#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
if [ -e .env ]; then
  echo '.env already exists; refusing to overwrite secrets.' >&2
  exit 1
fi
secret="$(openssl rand -hex 48)"
sed "s/replace-with-a-random-64-character-secret/$secret/" .env.example > .env
chmod 600 .env
echo 'Created .env. Set TC_CAMERA_URL and TC_PUBLIC_HOST before starting Docker.'
