#!/bin/sh
set -e

# Ensure data directories exist
mkdir -p /app/data/prisma /app/data/uploads

# Ensure public/uploads points to persistent storage
if [ ! -L /app/public/uploads ]; then
  rm -rf /app/public/uploads
  ln -s /app/data/uploads /app/public/uploads
fi

echo "=================================================="
echo " Starting PhotoContest Platform"
echo " Time: $(date)"
echo " Environment: $NODE_ENV"
echo " App URL: $NEXT_PUBLIC_APP_URL"
echo "=================================================="

exec "$@"
