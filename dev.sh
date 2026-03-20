#!/bin/bash

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

# Parse argument: web | mobile | all (default)
MODE="${1:-all}"

echo -e "${BLUE}🚀 Starting Tadriss Development Environment (mode: ${MODE})...${NC}\n"

# 1. Check if Docker is running (optional — needed for local Supabase)
if ! docker info > /dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  Docker is not running. Skipping local Supabase setup.${NC}"
  echo -e "${YELLOW}   If you need a local DB, start Docker and re-run this script.${NC}"
  echo -e "${YELLOW}   Using existing .env.local files (remote Supabase or cached keys).${NC}\n"
else
  # 2. Start Supabase
  echo -e "${BLUE}📦 Starting Supabase local stack...${NC}"
  npx supabase start

  # 3. Extract Supabase variables
  echo -e "\n${BLUE}🔑 Updating environment variables...${NC}"
  SUPABASE_URL="http://127.0.0.1:54321"

  STATUS_ENV=$(npx supabase status -o env)
  ANON_KEY=$(echo "$STATUS_ENV" | grep 'SUPABASE_ANON_KEY' | cut -d '=' -f 2 | tr -d '"\r')
  SERVICE_ROLE_KEY=$(echo "$STATUS_ENV" | grep 'SUPABASE_SERVICE_ROLE_KEY' | cut -d '=' -f 2 | tr -d '"\r')

  if [ -z "$ANON_KEY" ]; then
    echo -e "${RED}❌ Failed to extract Supabase keys. Make sure Supabase started correctly.${NC}"
    exit 1
  fi

  # Inject env into Next.js web app
  cat <<EOF > apps/web/.env.local
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY
EOF

  # Inject env into Expo mobile app
  cat <<EOF > apps/mobile/.env.local
EXPO_PUBLIC_SUPABASE_URL=$SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY
EOF

  echo -e "${GREEN}✅ Environment variables set.${NC}\n"
fi

# 4. Start servers based on mode
echo -e "${BLUE}📡 Services:${NC}"
echo -e "   🌐 Supabase Studio → http://127.0.0.1:54323"

if [ "$MODE" = "web" ]; then
  echo -e "   💻 Web App        → http://localhost:3000\n"
  pnpm turbo run dev --filter=@tadriss/web

elif [ "$MODE" = "mobile" ]; then
  echo -e "   📱 Mobile App     → Expo Go QR code will appear below\n"
  echo -e "${YELLOW}💡 Tip: Press 'w' to open in browser, 'i' for iOS sim, 'a' for Android${NC}\n"
  pnpm turbo run dev --filter=@tadriss/mobile

else
  echo -e "   💻 Web App        → http://localhost:3000"
  echo -e "   📱 Mobile App     → Expo Go QR code will appear below\n"
  echo -e "${YELLOW}💡 Tip: Press 'w' to open mobile in browser, 'i' for iOS sim, 'a' for Android${NC}\n"
  pnpm turbo run dev --parallel
fi
