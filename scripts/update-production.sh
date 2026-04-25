#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/media-timeline}"
SERVICE_NAME="${SERVICE_NAME:-media-timeline}"
HEALTH_URL="${HEALTH_URL:-https://timeline.bechhofen-hilft.de/health}"
APP_USER="${APP_USER:-www-data}"
APP_GROUP="${APP_GROUP:-www-data}"

log() {
  printf '\n\033[1;34m==>\033[0m %s\n' "$1"
}

fail() {
  printf '\n\033[1;31mFehler:\033[0m %s\n' "$1" >&2
  exit 1
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
  curl -fsS "$HEALTH_URL" >/dev/null || fail "Healthcheck ${HEALTH_URL} ist fehlgeschlagen."
  printf 'Healthcheck OK: %s\n' "$HEALTH_URL"
else
  printf 'curl ist nicht installiert, Healthcheck übersprungen.\n'
fi

log "Update abgeschlossen"
git --no-pager log --oneline -1
