# Deployment auf Debian 13 LXC

Diese Anleitung beschreibt einen einfachen Betrieb auf einem Debian-13-LXC, zum Beispiel hinter
Nginx oder einem vorhandenen Reverse Proxy.

## Voraussetzungen

- Debian 13 Container mit Netzwerkzugriff
- Node.js 22 LTS oder neuer
- npm
- Supabase-Projekt mit ausgefuehrtem `supabase/schema.sql`
- Domain oder interne Reverse-Proxy-Route

## System vorbereiten

```bash
sudo apt update
sudo apt install -y curl ca-certificates git
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node --version
npm --version
```

## App installieren

```bash
sudo mkdir -p /opt/media-timeline
sudo chown "$USER":"$USER" /opt/media-timeline
git clone <DEIN_GITHUB_REPO> /opt/media-timeline
cd /opt/media-timeline
npm ci
cp .env.example .env.local
nano .env.local
npm run build
```

In `.env.local` muessen mindestens diese Werte gesetzt sein:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_SITE_URL=https://timeline.example.com
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

Beispiel fuer eine Domain:

```nginx
server {
  listen 80;
  server_name timeline.example.com;

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

TLS sollte anschliessend ueber den Reverse Proxy oder Certbot aktiviert werden.

## Updates

```bash
cd /opt/media-timeline
sudo -u www-data git pull
sudo -u www-data npm ci
sudo -u www-data npm run build
sudo systemctl restart media-timeline
```

## Hinweise

- Keine `.env.local` ins GitHub-Repository committen.
- Der Admin-Bereich liegt unter `/admin`.
- Supabase Auth verwaltet den Admin-Login.
- Fuer produktive Nutzung Rechtsdokumente final ausfuellen und pruefen lassen.
