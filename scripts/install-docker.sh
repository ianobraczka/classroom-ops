#!/usr/bin/env bash
# Install Docker Engine + Compose v2 on Ubuntu 20.04+ (Debian-style).
# Run: bash scripts/install-docker.sh
# Requires: sudo (you will be prompted for your password).

set -euo pipefail

if [[ "${EUID:-$(id -u)}" -eq 0 ]]; then
  echo "Run this as your normal user (not root). It will use sudo when needed."
  exit 1
fi

echo "==> Ensuring Ubuntu 'universe' repository is enabled (docker.io lives there)"
if grep -qi ubuntu /etc/os-release 2>/dev/null; then
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y software-properties-common
  sudo add-apt-repository -y universe || true
fi

echo "==> Updating apt and installing docker.io + docker-compose-v2"
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y docker.io docker-compose-v2

echo "==> Verifying packages are installed"
if ! dpkg -l docker.io 2>/dev/null | grep -q '^ii'; then
  echo "ERROR: docker.io did not install. Try manually:"
  echo "  sudo apt-get update && sudo apt-get install -y docker.io"
  exit 1
fi
if ! dpkg -l docker-compose-v2 2>/dev/null | grep -q '^ii'; then
  echo "WARN: docker-compose-v2 missing; you can still use 'docker compose' if provided by docker.io, or install:"
  echo "  sudo apt-get install -y docker-compose-v2"
fi

echo "==> Enabling and starting Docker"
sudo systemctl enable --now docker

echo "==> Adding user $(whoami) to the docker group (log out and back in for this to take full effect)"
sudo usermod -aG docker "$(whoami)"

echo "==> Testing Docker (may need newgrp if group not active yet)"
if docker run --rm hello-world; then
  echo "==> Docker is working."
else
  echo "If permission denied, run: newgrp docker"
  echo "Then: docker run --rm hello-world"
fi

docker compose version 2>/dev/null || true

echo ""
echo "Done. From your project root you can run: docker compose up --build"
