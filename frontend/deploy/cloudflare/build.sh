#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../.."
management_commit=639c86489c01d70ca80efedf83bc1ee6387af554
management_repo=https://github.com/bestarm/sen-viet-restaurant.git
management_source="$(mktemp -d)"
trap 'rm -rf -- "$management_source"' EXIT

# The production backend still uses this portal version. The newer portal build embeds internal seed data.
git -C "$management_source" init --quiet
git -C "$management_source" fetch --quiet --no-tags --depth=1 "$management_repo" "$management_commit"
git -C "$management_source" archive FETCH_HEAD frontend | tar -xf - -C "$management_source"

npm run build
npm --prefix "$management_source/frontend" ci --no-audit --no-fund
npm --prefix "$management_source/frontend" run build
node deploy/cloudflare/package.mjs "$management_source/frontend/dist"
