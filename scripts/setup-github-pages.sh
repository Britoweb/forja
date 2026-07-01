#!/usr/bin/env bash
# Configura repo privado, secrets e GitHub Pages (source: Actions).
# Pré-requisito: gh auth login
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

REPO_NAME="${REPO_NAME:-forja}"
VISIBILITY="${VISIBILITY:-private}"

if ! command -v gh >/dev/null 2>&1; then
  echo "Instale o GitHub CLI: https://cli.github.com/"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "Faça login primeiro: gh auth login"
  exit 1
fi

if [[ ! -f .env ]]; then
  echo "Arquivo .env não encontrado. Copie .env.example e preencha as chaves do Supabase."
  exit 1
fi

# shellcheck disable=SC1091
source .env

if [[ -z "${VITE_SUPABASE_URL:-}" || -z "${VITE_SUPABASE_ANON_KEY:-}" ]]; then
  echo ".env incompleto: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórios."
  exit 1
fi

OWNER="$(gh api user -q .login)"
PAGES_URL="https://${OWNER}.github.io/${REPO_NAME}/"

echo "→ Repositório: ${OWNER}/${REPO_NAME} (${VISIBILITY})"
echo "→ URL prevista: ${PAGES_URL}"

if git remote get-url origin >/dev/null 2>&1; then
  echo "→ Remote origin já existe"
else
  gh repo create "${REPO_NAME}" \
    --"${VISIBILITY}" \
    --source=. \
    --remote=origin \
    --description "FORJA — transformação comportamental pessoal"
fi

echo "→ Configurando secrets do Actions…"
gh secret set VITE_SUPABASE_URL --body "${VITE_SUPABASE_URL}"
gh secret set VITE_SUPABASE_ANON_KEY --body "${VITE_SUPABASE_ANON_KEY}"

echo "→ Ativando GitHub Pages (GitHub Actions)…"
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  "/repos/${OWNER}/${REPO_NAME}/pages" \
  -f build_type=workflow \
  >/dev/null 2>&1 || true

echo "→ Enviando código (branch main)…"
git push -u origin main

echo "→ Disparando deploy…"
gh workflow run "Deploy GitHub Pages" 2>/dev/null || echo "   (workflow rodará no push ou em Actions → Run workflow)"

cat <<EOF

✓ Setup concluído.

1. Acompanhe o deploy: gh run watch --exit-status
   ou GitHub → Actions → Deploy GitHub Pages

2. Supabase (obrigatório para login):
   Authentication → URL Configuration
   • Site URL: ${PAGES_URL}
   • Redirect URLs: ${PAGES_URL}
                     http://localhost:5173

3. No celular: abra ${PAGES_URL} → Adicionar à tela inicial

EOF
