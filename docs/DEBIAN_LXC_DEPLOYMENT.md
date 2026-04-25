# Deployment auf Debian 13 LXC

Diese Anleitung beschreibt den Betrieb auf einem Debian-13-LXC mit lokaler SQLite-Datenbank.
Es wird kein Supabase oder externer Datenbankdienst benötigt.

## Voraussetzungen

- Debian 13 Container mit Netzwerkzugriff
- Node.js 22 LTS oder neuer
- npm
- Domain `timeline.bechhofen-hilft.de`
- Nginx oder ein vorhandener Reverse Proxy

## System vorbereiten

```bash
sudo apt update
sudo apt install -y curl ca-certificates git nginx build-essential python3
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node --version
npm --version
```

`build-essential` und `python3` sind für native Node-Pakete wie SQLite wichtig.

## App installieren

```bash
sudo mkdir -p /opt/media-timeline
sudo chown "$USER":"$USER" /opt/media-timeline
git clone https://github.com/Schello805/timelineapp /opt/media-timeline
cd /opt/media-timeline
npm ci
cp .env.example .env.local
nano .env.local
```

## .env.local für deine Domain

Setze diese Werte:

```bash
NEXT_PUBLIC_SITE_URL=https://timeline.bechhofen-hilft.de
ADMIN_EMAIL=Info@schellenberger.biz
ADMIN_PASSWORD=ein-sehr-sicheres-passwort
ADMIN_SESSION_SECRET=ein-langer-zufälliger-geheimer-wert
TIMELINE_DATABASE_PATH=./data/timeline.sqlite
```

Einen guten Wert für `ADMIN_SESSION_SECRET` kannst du so erzeugen:

```bash
openssl rand -hex 32
```

Danach:

```bash
mkdir -p data public/uploads
npm run build
```

## systemd Service

Datei anlegen:

```bash
sudo nano /etc/systemd/system/media-timeline.service
```

Inhalt:

```ini
[Unit]
Description=Media Timeline Next.js App
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/media-timeline
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5
User=www-data
Group=www-data

[Install]
WantedBy=multi-user.target
```

Rechte setzen und starten:

```bash
sudo chown -R www-data:www-data /opt/media-timeline
sudo systemctl daemon-reload
sudo systemctl enable --now media-timeline
sudo systemctl status media-timeline
```

## Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/media-timeline
```

Inhalt:

```nginx
server {
  listen 80;
  server_name timeline.bechhofen-hilft.de;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Aktivieren:

```bash
sudo ln -s /etc/nginx/sites-available/media-timeline /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

TLS anschließend mit Certbot oder deinem vorhandenen Reverse Proxy aktivieren.

## Updates

```bash
cd /opt/media-timeline
sudo -u www-data git pull
sudo -u www-data npm ci
sudo -u www-data npm run build
sudo systemctl restart media-timeline
```

## Backup

Wichtig sind diese lokalen Daten:

```bash
/opt/media-timeline/data/timeline.sqlite
/opt/media-timeline/public/uploads
```

Diese Dateien/Ordner regelmäßig sichern.

## Hinweise

- Keine `.env.local` ins GitHub-Repository committen.
- Der Admin-Bereich liegt unter `/admin`.
- Die Datenbank wird automatisch als SQLite-Datei erstellt.
- Für produktive Nutzung Rechtsdokumente final ausfüllen und prüfen lassen.
