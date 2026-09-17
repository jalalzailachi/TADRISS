#!/bin/bash
set -e

# Deployment Configuration
SERVER_IP="84.8.223.50"
SERVER_USER="opc"  # Default for Oracle Linux (since ubuntu failed)
SSH_KEY="../trade/ssh-key-2026-02-28.key"
APP_DIR="apps/web"

echo "==========================================="
echo "   🚀 Deploying Tadriss to Oracle Server   "
echo "==========================================="

echo -e "\n🔨 1. Building the standalone Next.js app..."
cd $APP_DIR
pnpm run build
cd -

# Dynamically find the server.js file within the standalone directory
# In Next.js 15 standalone builds, the structure can be nested under the full project path
FULL_STANDALONE_PATH="$(pwd)/$APP_DIR/.next/standalone"
SERVER_JS_FULL_PATH=$(find "$FULL_STANDALONE_PATH" -name "server.js" | grep -v "node_modules" | head -n 1)

if [[ -z "$SERVER_JS_FULL_PATH" ]]; then
  echo "Error: server.js not found in $FULL_STANDALONE_PATH!"
  exit 1
fi

# The directory containing server.js relative to the standalone root
SERVER_JS_RELATIVE_DIR=$(dirname "${SERVER_JS_FULL_PATH#$FULL_STANDALONE_PATH/}")

echo "Found server.js at: $SERVER_JS_FULL_PATH"
echo "Relative execution directory: $SERVER_JS_RELATIVE_DIR"

echo "Found server.js at: $SERVER_JS_FULL_PATH"
echo "Relative execution directory: $SERVER_JS_RELATIVE_DIR"

echo -e "\n🔐 2. Ensuring SSH key has correct permissions..."
chmod 600 "$SSH_KEY"

echo -e "\n🔥 3. Wiping the old application from the server entirely..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "pm2 delete tadriss-web 2>/dev/null || true; pm2 save --force 2>/dev/null || true; rm -rf ~/tadriss-web"

echo -e "\n📁 4. Creating fresh application directories on server..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "mkdir -p ~/tadriss-web/.next/static && mkdir -p ~/tadriss-web/$SERVER_JS_RELATIVE_DIR/.next/static && mkdir -p ~/tadriss-web/$SERVER_JS_RELATIVE_DIR/messages"

echo -e "\n📦 5. Transferring files to Oracle server..."
# Upload the standalone application code (maintains nested structure)
rsync -avz --progress -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" $APP_DIR/.next/standalone/ $SERVER_USER@$SERVER_IP:~/tadriss-web/
# Upload static CSS/JS to the absolute root directory of standalone
rsync -avz --progress -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" $APP_DIR/.next/static/ $SERVER_USER@$SERVER_IP:~/tadriss-web/.next/static/
# Upload public directory to the absolute root directory of standalone
rsync -avz --progress -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" $APP_DIR/public/ $SERVER_USER@$SERVER_IP:~/tadriss-web/public/
# ALSO upload CSS/JS strictly right next to the server.js binary to defeat Turbopack __dirname pathing bugs
rsync -avz --progress -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" $APP_DIR/.next/static/ $SERVER_USER@$SERVER_IP:~/tadriss-web/$SERVER_JS_RELATIVE_DIR/.next/static/
rsync -avz --progress -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" $APP_DIR/public/ $SERVER_USER@$SERVER_IP:~/tadriss-web/$SERVER_JS_RELATIVE_DIR/public/
# CRITICAL: Upload the messages folder which is NOT traced effectively in standalone because of dynamic imports in i18n.ts
rsync -avz --progress -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" $APP_DIR/messages/ $SERVER_USER@$SERVER_IP:~/tadriss-web/$SERVER_JS_RELATIVE_DIR/messages/

# Upload environment variables exclusively to the absolute root directory
rsync -avz --progress -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" $APP_DIR/.env.local $SERVER_USER@$SERVER_IP:~/tadriss-web/.env

echo -e "\n⚙️ 6. Setting up Server (Node.js & PM2) and starting the app..."
# Pass the nested directory variable to the remote script securely
touch .ready
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no .ready $SERVER_USER@$SERVER_IP:~/tadriss-web/.ready || true
rm .ready

ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "SERVER_JS_RELATIVE_DIR='$SERVER_JS_RELATIVE_DIR'"' bash -s' << 'EOF'
  set -e
  
  if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
  fi

  if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
  fi

  cd ~/tadriss-web
  export NODE_ENV=production
  
  # Forcefully rip out "localhost" from Next.js internal binding and inject 0.0.0.0 permanently!
  sed -i "s/'localhost'/'0.0.0.0'/g" $SERVER_JS_RELATIVE_DIR/server.js || true
  sed -i 's/process.env.HOSTNAME || "localhost"/"0.0.0.0"/g' $SERVER_JS_RELATIVE_DIR/server.js || true

  # Nginx proved fundamentally flawed against SELinux over loopback in this environment. 
  # We are completely annihilating Nginx and shifting statically to Port 3000 manually.
  echo "Terminating and purging Nginx..."
  sudo systemctl stop nginx || true
  sudo systemctl disable nginx || true
  sudo rm -f /etc/nginx/conf.d/tadriss.conf || true

  # Open Native Port 3000 securely on the OS firewall
  echo "Opening native Port 3000 on Oracle Linux firewall..."
  sudo firewall-cmd --zone=public --add-port=3000/tcp --permanent 2>/dev/null || true
  sudo firewall-cmd --reload 2>/dev/null || true
  sudo ufw allow 3000/tcp 2>/dev/null || true
  sudo iptables -I INPUT 1 -p tcp --dport 3000 -j ACCEPT 2>/dev/null || true
  sudo netfilter-persistent save 2>/dev/null || true

  # Force PM2 to stop everything existing
  if pm2 describe tadriss-web > /dev/null 2>&1; then
    pm2 delete tadriss-web
  fi

  echo "Starting Tadriss Next.js Server natively bound to 0.0.0.0:3000..."
  # Next.js standalone does NOT load .env natively. We MUST aggressively inject it here!
  set -a; source ~/tadriss-web/.env 2>/dev/null || true; set +a
  
  # Bind securely to PUBLIC port
  # We MUST ensure TRUSTED_HOSTS is set for Server Actions to work behind proxies or direct IPs
  # and that the PORT and HOSTNAME are correctly synchronized.
  PORT=3000 HOSTNAME=0.0.0.0 pm2 start $SERVER_JS_RELATIVE_DIR/server.js --name tadriss-web --interpreter node -- -p 3000
  pm2 save
  sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp /home/$USER || true
  pm2 save
EOF

echo -e "\n✅ Deployment complete!"
echo "Visit: http://$SERVER_IP:3000"
