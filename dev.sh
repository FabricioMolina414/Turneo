#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

usage() {
  cat <<'USAGE'
Uso:
  turneo --up [-d]          # docker compose up (pasa flags), prisma generate + migrate deploy (silencioso)
  turneo --down             # docker compose down
  turneo --dev-bg           # inicia Next.js en segundo plano (silencioso)
  turneo --stop-dev         # detiene el Next.js en segundo plano
Ejemplos:
  turneo --up -d
USAGE
}

wait_pg() {
  echo -n "⏳ Esperando Postgres..."
  # intenta hasta 40s
  for i in $(seq 1 40); do
    if docker compose exec -T db pg_isready -U dev -d turnero >/dev/null 2>&1; then
      echo " ok"
      return 0
    fi
    sleep 1
  done
  echo " tiempo agotado"
  return 1
}

case "${1-}" in
  --up)
    shift || true
    echo "▶️  Levantando stack Docker..."
    # Levanta servicios; flags extras (p.ej. -d) se pasan tal cual
    docker compose up "$@" >/dev/null 2>&1
    wait_pg || { echo "❌ Postgres no quedó listo"; exit 1; }

    # Prisma generate + migrate deploy silencioso dentro de packages/db
    if [ -d "packages/db" ]; then
      if [ -f "packages/db/.env" ]; then
        ( cd packages/db && pnpm prisma generate --schema prisma/schema.prisma >/dev/null 2>&1 || true )
        ( cd packages/db && pnpm prisma migrate deploy --schema prisma/schema.prisma >/dev/null 2>&1 || true )
      else
        echo "⚠️  Falta packages/db/.env (DATABASE_URL). Saltando Prisma."
      fi
    fi

    echo "✅ Stack listo. Web: http://localhost:3000  Mailhog: http://localhost:8025"
    ;;
  --down)
    echo "🛑 Apagando stack..."
    docker compose down >/dev/null 2>&1 || true
    # detener Next.js en bg si estaba corriendo
    if [ -f ".web.pid" ]; then
      kill "$(cat .web.pid)" >/dev/null 2>&1 || true
      rm -f .web.pid
    fi
    echo "✅ Listo."
    ;;
  --dev-bg)
    echo "🚀 Iniciando Next.js (background)..."
    ( cd apps/web && pnpm dev >/dev/null 2>&1 & echo $! > "$ROOT_DIR/.web.pid" )
    echo "   PID: $(cat .web.pid)"
    ;;
  --stop-dev)
    if [ -f ".web.pid" ]; then
      kill "$(cat .web.pid)" >/dev/null 2>&1 || true
      rm -f .web.pid
      echo "🛑 Next.js detenido."
    else
      echo "ℹ️  No hay Next.js en segundo plano."
    fi
    ;;
  *)
    usage
    ;;
esac
