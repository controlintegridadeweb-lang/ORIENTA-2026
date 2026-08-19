#!/usr/bin/env bash
# Sobe o stack local do Supabase de forma reentrante.
# O CLI às vezes inicia o Postgres, falha no restante e tenta de novo com a porta 54322 ainda presa.
set -euo pipefail

PROJECT_DB_CONTAINER="${SUPABASE_DB_CONTAINER:-supabase_db_orienta-v1}"
DB_PORT="${SUPABASE_DB_PORT:-54322}"

port_in_use() {
  local port="$1"
  if command -v ss >/dev/null 2>&1; then
    ss -ltn | grep -qE ":${port}[[:space:]]"
    return $?
  fi
  if command -v lsof >/dev/null 2>&1; then
    lsof -iTCP:"${port}" -sTCP:LISTEN >/dev/null 2>&1
    return $?
  fi
  return 1
}

stop_leftovers() {
  supabase stop --no-backup >/dev/null 2>&1 || supabase stop >/dev/null 2>&1 || true
  docker rm -f "${PROJECT_DB_CONTAINER}" >/dev/null 2>&1 || true
  if port_in_use "${DB_PORT}"; then
    if command -v fuser >/dev/null 2>&1; then
      sudo fuser -k "${DB_PORT}/tcp" >/dev/null 2>&1 || true
    fi
  fi
}

wait_port_free() {
  local port="$1"
  local attempt
  for attempt in $(seq 1 30); do
    if ! port_in_use "${port}"; then
      return 0
    fi
    sleep 1
  done
  echo "Porta ${port} ainda em uso após esperar a liberação."
  if command -v ss >/dev/null 2>&1; then
    ss -ltnp | grep -E ":${port}[[:space:]]" || true
  fi
  return 1
}

for attempt in 1 2 3 4 5; do
  stop_leftovers
  wait_port_free "${DB_PORT}" || true
  if supabase start; then
    exit 0
  fi
  echo "supabase start falhou (tentativa ${attempt}); limpando leftovers..."
  stop_leftovers
  sleep $((attempt * 2))
done

echo "Não foi possível iniciar o stack local do Supabase."
exit 1
