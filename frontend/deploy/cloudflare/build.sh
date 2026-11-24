#!/usr/bin/env bash
set -euo pipefail

[[ "${CF_PAGES_BRANCH:-}" == "ci/cloudflare-build-check-e7dacac" ]]

cd "$(dirname "$0")/../.."

npm run build
node deploy/cloudflare/package.mjs

# This temporary preview validates the complete build without publishing internal data.
if [[ "${CF_PAGES_BRANCH:-}" == 'ci/cloudflare-build-check-e7dacac' ]]; then
  test -f dist/pages/management/index.html
  test -f dist/pages/_worker.js
  compgen -G 'dist/pages/assets/App-*.js' > /dev/null
  rm -r -- dist/pages
  mkdir -- dist/pages
  printf '%s\n' '<!doctype html><html lang="vi"><meta charset="utf-8"><title>Sen Việt build check</title><p>Cloudflare đã build frontend thành công.</p></html>' > dist/pages/index.html
  printf '%s\n' 'Sen Viet frontend build and packaging verified. Preview publishes only the build status page.'
fi
