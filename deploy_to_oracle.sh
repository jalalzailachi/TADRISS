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

# Turborepo natively maps the standalone executable recursively reflecting the $APP_DIR structure
SERVER_JS_PATH="$APP_DIR/.next/standalone/$APP_DIR/server.js"
if [[ ! -f "$SERVER_JS_PATH" ]]; then
  echo "Error: server.js not found natively in .next/standalone/$APP_DIR root!"
  exit 1
fi
# The relative execution directory is simply the deeply nested APP_DIR natively
SERVER_JS_RELATIVE_DIR="$APP_DIR"

echo -e "\n🔐 2. Ensuring SSH key has correct permissions..."
chmod 600 "$SSH_KEY"

echo -e "\n📁 3. Creating application directories on server..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "mkdir -p ~/tadriss-web/.next/static && mkdir -p ~/tadriss-web/$SERVER_JS_RELATIVE_DIR/.next/static"

echo -e "\n📦 4. Transferring files to Oracle server..."
# Upload the standalone application code (maintains nested structure)
rsync -avz --progress -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" $APP_DIR/.next/standalone/ $SERVER_USER@$SERVER_IP:~/tadriss-web/
# Upload static CSS/JS to the absolute root directory of standalone
rsync -avz --progress -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" $APP_DIR/.next/static/ $SERVER_USER@$SERVER_IP:~/tadriss-web/.next/static/
# Upload public directory to the absolute root directory of standalone
rsync -avz --progress -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" $APP_DIR/public/ $SERVER_USER@$SERVER_IP:~/tadriss-web/public/
# ALSO upload CSS/JS strictly right next to the server.js binary to defeat Turbopack __dirname pathing bugs
rsync -avz --progress -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" $APP_DIR/.next/static/ $SERVER_USER@$SERVER_IP:~/tadriss-web/$SERVER_JS_RELATIVE_DIR/.next/static/
rsync -avz --progress -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" $APP_DIR/public/ $SERVER_USER@$SERVER_IP:~/tadriss-web/$SERVER_JS_RELATIVE_DIR/public/
# Upload environment variables exclusively to the absolute root directory
rsync -avz --progress -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" $APP_DIR/.env.local $SERVER_USER@$SERVER_IP:~/tadriss-web/.env

echo -e "\n⚙️ 5. Setting up Server (Node.js & PM2) and starting the app..."
# Pass the nested directory variable to the remote script securely
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no /dev/null $SERVER_USER@$SERVER_IP:~/tadriss-web/.ready || true
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

  # Automatically open port 3000 forcefully at PRIORITY 1 in the server's internal firewall for Nginx
  echo "Opening port 3000 on server firewall at Priority #1..."
  sudo firewall-cmd --zone=public --add-port=3000/tcp --permanent 2>/dev/null || true
  sudo firewall-cmd --reload 2>/dev/null || true
  sudo ufw allow 3000/tcp 2>/dev/null || true
  sudo iptables -I INPUT 1 -p tcp --dport 3000 -j ACCEPT 2>/dev/null || true
  sudo netfilter-persistent save 2>/dev/null || true

  # Force PM2 to delete the old instance so it stops caching anything old
  if pm2 describe tadriss-web > /dev/null 2>&1; then
    pm2 delete tadriss-web
  fi

  echo "Starting Tadriss Next.js Server on 127.0.0.1:3001..."
  # Next.js standalone does NOT load .env natively. We MUST aggressively inject it here!
  set -a; source ~/tadriss-web/.env 2>/dev/null || true; set +a
  PORT=3001 HOSTNAME=127.0.0.1 pm2 start $SERVER_JS_RELATIVE_DIR/server.js --name tadriss-web --interpreter node -- -p 3001
  pm2 save
  sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp /home/$USER || true
  pm2 save
EOF

echo -e "\n✅ Deployment complete!"
echo "Visit: http://$SERVER_IP:3000"
