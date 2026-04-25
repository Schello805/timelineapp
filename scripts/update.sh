#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/media-timeline}"
SERVICE_NAME="${SERVICE_NAME:-media-timeline}"
HEALTH_URL="${HEALTH_URL:-https://timeline.bechhofen-hilft.de/health}"
LOCAL_HEALTH_URL="${LOCAL_HEALTH_URL:-http://127.0.0.1:3000/health}"
HEALTH_RETRIES="${HEALTH_RETRIES:-12}"
HEALTH_RETRY_DELAY="${HEALTH_RETRY_DELAY:-2}"
APP_USER="${APP_USER:-www-data}"
APP_GROUP="${APP_GROUP:-www-data}"

log() {
  printf '\n\033[1;34m==>\033[0m %s\n' "$1"
}

fail() {
  printf '\n\033[1;31mFehler:\033[0m %s\n' "$1" >&2
  exit 1
}

check_health() {
  local url="$1"
  local label="$2"
  local attempt

  for attempt in $(seq 1 "$HEALTH_RETRIES"); do
    if curl -fsS "$url" >/dev/null; then
      printf 'Healthcheck OK (%s): %s\n' "$label" "$url"
      return 0
    fi

    printf 'Healthcheck wartet (%s), Versuch %s/%s...\n' "$label" "$attempt" "$HEALTH_RETRIES"
    sleep "$HEALTH_RETRY_DELAY"
  done

  return 1
}

command -v git >/dev/null || fail "git ist nicht installiert."
command -v npm >/dev/null || fail "npm ist nicht installiert."
command -v systemctl >/dev/null || fail "systemctl ist nicht verfügbar."

log "Wechsle in ${APP_DIR}"
cd "$APP_DIR" || fail "App-Verzeichnis ${APP_DIR} wurde nicht gefunden."

log "Git-Verzeichnis als sicher markieren"
git config --global --add safe.directory "$APP_DIR" || true

log "Aktuellen Stand von GitHub holen"
git fetch origin main
git pull --ff-only origin main

log "Lokale Laufzeitordner anlegen"
mkdir -p data public/uploads

log "Abhängigkeiten installieren"
npm ci

log "Alten Next.js Build entfernen"
rm -rf .next

log "Produktionsbuild erstellen"
npm run build

log "Dateirechte setzen"
chown -R "$APP_USER:$APP_GROUP" "$APP_DIR"

log "Service neu starten"
systemctl restart "$SERVICE_NAME"

log "Service-Status prüfen"
systemctl is-active --quiet "$SERVICE_NAME" || {
  systemctl status "$SERVICE_NAME" --no-pager || true
  fail "Service ${SERVICE_NAME} läuft nicht."
}

log "Healthcheck prüfen"
if command -v curl >/dev/null; then
  check_health "$LOCAL_HEALTH_URL" "lokal" || {
    systemctl status "$SERVICE_NAME" --no-pager || true
    journalctl -u "$SERVICE_NAME" -n 80 --no-pager || true
    fail "Lokaler Healthcheck ${LOCAL_HEALTH_URL} ist fehlgeschlagen."
  }

  if ! check_health "$HEALTH_URL" "Domain"; then
    printf '\n\033[1;33mWarnung:\033[0m Die App läuft lokal, aber der Domain-Healthcheck ist fehlgeschlagen.\n'
    printf 'Bitte Nginx, DNS oder TLS prüfen. Das Update selbst wurde erfolgreich installiert.\n'
    nginx -t 2>/dev/null || true
  fi
else
  printf 'curl ist nicht installiert, Healthcheck übersprungen.\n'
fi

log "Update abgeschlossen"
git --no-pager log --oneline -1
