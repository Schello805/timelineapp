import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { hashPassword } from "@/lib/passwords";
import type { AdminUser, AnnualMetric, TimelineEvent, TimelineEventInput } from "@/lib/types";

const dataDir = process.env.TIMELINE_DATA_DIR ?? path.join(process.cwd(), "data");
const dbPath = process.env.TIMELINE_DATABASE_PATH ?? path.join(dataDir, "timeline.sqlite");

let database: Database.Database | null = null;

function getDb() {
  if (!database) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    database = new Database(dbPath);
    database.pragma("journal_mode = WAL");
    database.exec(`
      create table if not exists timeline_events (
        id text primary key,
        slug text,
        event_date text not null,
        title text not null,
        description text not null,
        importance text not null default 'standard',
        image_url text,
        video_url text,
        audio_url text,
        pdf_url text,
        created_at text not null default current_timestamp,
        updated_at text not null default current_timestamp
      );

      create table if not exists app_settings (
        key text primary key,
        value text not null,
        updated_at text not null default current_timestamp
      );

      create table if not exists admin_users (
        id text primary key,
        email text not null unique,
        password_hash text not null,
        is_primary integer not null default 0,
        created_at text not null default current_timestamp,
        updated_at text not null default current_timestamp
      );

      create table if not exists annual_metrics (
        id text primary key,
        year text not null,
        label text not null,
        value real not null,
        unit text,
        comparison_label text,
        comparison_value real,
        comparison_unit text,
        description text,
        display_order integer not null default 0,
        created_at text not null default current_timestamp,
        updated_at text not null default current_timestamp
      );

      create trigger if not exists timeline_events_updated_at
      after update on timeline_events
      for each row
      begin
        update timeline_events set updated_at = current_timestamp where id = old.id;
      end;

      create trigger if not exists admin_users_updated_at
      after update on admin_users
      for each row
      begin
        update admin_users set updated_at = current_timestamp where id = old.id;
      end;

      create trigger if not exists annual_metrics_updated_at
      after update on annual_metrics
      for each row
      begin
        update annual_metrics set updated_at = current_timestamp where id = old.id;
      end;
    `);
    migrateDatabase(database);
  }

  return database;
}

function migrateDatabase(db: Database.Database) {
  const columns = db.prepare("pragma table_info(timeline_events)").all() as Array<{ name: string }>;
  if (!columns.some((column) => column.name === "slug")) {
    db.prepare("alter table timeline_events add column slug text").run();
  }
  if (!columns.some((column) => column.name === "importance")) {
    db.prepare("alter table timeline_events add column importance text not null default 'standard'").run();
  }
  if (!columns.some((column) => column.name === "audio_url")) {
    db.prepare("alter table timeline_events add column audio_url text").run();
  }

  db.prepare("create unique index if not exists timeline_events_slug_unique on timeline_events(slug)").run();
  db.prepare("create unique index if not exists admin_users_email_unique on admin_users(email)").run();

  const eventsWithoutSlug = db
    .prepare("select id, event_date, title from timeline_events where slug is null or slug = ''")
    .all() as Array<{ id: string; event_date: string; title: string }>;

  for (const event of eventsWithoutSlug) {
    db.prepare("update timeline_events set slug = ? where id = ?").run(
      createUniqueSlug(db, event.title, event.event_date, event.id),
      event.id,
    );
  }
}

export function ensurePrimaryAdminUser() {
  const db = getDb();
  const count = db.prepare("select count(*) as count from admin_users").get() as { count: number };
  if (count.count > 0) return;

  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;

  const storedHash = getSetting("admin_password_hash")?.value;

  db.prepare("insert into admin_users (id, email, password_hash, is_primary) values (?, ?, ?, 1)").run(
    crypto.randomUUID(),
    email.toLowerCase(),
    storedHash || hashPassword(password),
  );
}

export function listTimelineEvents() {
  return getDb()
    .prepare(
      `select id, slug, event_date, title, description, image_url, video_url, audio_url, pdf_url, created_at, updated_at
       , importance
       from timeline_events
       order by event_date asc`,
    )
    .all() as TimelineEvent[];
}

export function upsertEvent(input: TimelineEventInput & { id?: string }) {
  const id = input.id || crypto.randomUUID();
  const db = getDb();
  const slug = input.slug?.trim() || createUniqueSlug(db, input.title, input.event_date, id);

  db
    .prepare(
      `insert into timeline_events (id, slug, event_date, title, description, importance, image_url, video_url, audio_url, pdf_url)
       values (@id, @slug, @event_date, @title, @description, @importance, @image_url, @video_url, @audio_url, @pdf_url)
       on conflict(id) do update set
         slug = excluded.slug,
         event_date = excluded.event_date,
         title = excluded.title,
         description = excluded.description,
         importance = excluded.importance,
         image_url = excluded.image_url,
         video_url = excluded.video_url,
         audio_url = excluded.audio_url,
         pdf_url = excluded.pdf_url`,
    )
    .run({
      id,
      slug,
      event_date: input.event_date,
      title: input.title,
      description: input.description,
      importance: input.importance ?? "standard",
      image_url: input.image_url ?? null,
      video_url: input.video_url ?? null,
      audio_url: input.audio_url ?? null,
      pdf_url: input.pdf_url ?? null,
    });

  return id;
}

export function getTimelineEventBySlug(slug: string) {
  return getDb()
    .prepare(
      `select id, slug, event_date, title, description, importance, image_url, video_url, audio_url, pdf_url, created_at, updated_at
       from timeline_events
       where slug = ?`,
    )
    .get(slug) as TimelineEvent | undefined;
}

export function getTimelineEventById(id: string) {
  return getDb()
    .prepare(
      `select id, slug, event_date, title, description, importance, image_url, video_url, audio_url, pdf_url, created_at, updated_at
       from timeline_events
       where id = ?`,
    )
    .get(id) as TimelineEvent | undefined;
}

export function deleteEvent(id: string) {
  getDb().prepare("delete from timeline_events where id = ?").run(id);
}

export function replaceTimelineEvents(events: TimelineEvent[]) {
  const db = getDb();
  const replace = db.transaction((items: TimelineEvent[]) => {
    db.prepare("delete from timeline_events").run();

    const insert = db.prepare(
      `insert into timeline_events
       (id, slug, event_date, title, description, importance, image_url, video_url, audio_url, pdf_url, created_at, updated_at)
       values (@id, @slug, @event_date, @title, @description, @importance, @image_url, @video_url, @audio_url, @pdf_url, @created_at, @updated_at)`,
    );

    for (const item of items) {
      const id = item.id || crypto.randomUUID();
      insert.run({
        id,
        slug: item.slug?.trim() || createUniqueSlug(db, item.title, item.event_date, id),
        event_date: item.event_date,
        title: item.title,
        description: item.description,
        importance: item.importance ?? "standard",
        image_url: item.image_url ?? null,
        video_url: item.video_url ?? null,
        audio_url: item.audio_url ?? null,
        pdf_url: item.pdf_url ?? null,
        created_at: item.created_at ?? new Date().toISOString(),
        updated_at: item.updated_at ?? new Date().toISOString(),
      });
    }
  });

  replace(events);
}

export function getSetting(key: string) {
  return getDb().prepare("select value from app_settings where key = ?").get(key) as
    | { value: string }
    | undefined;
}

export function setSetting(key: string, value: string) {
  getDb()
    .prepare(
      `insert into app_settings (key, value, updated_at)
       values (?, ?, current_timestamp)
       on conflict(key) do update set value = excluded.value, updated_at = current_timestamp`,
    )
    .run(key, value);
}

type AdminUserRow = AdminUser & { password_hash: string };

export function listAdminUsers() {
  ensurePrimaryAdminUser();

  return getDb()
    .prepare(
      `select id, email, is_primary, created_at, updated_at
       from admin_users
       order by is_primary desc, email asc`,
    )
    .all() as AdminUser[];
}

export function getAdminUserById(id: string) {
  ensurePrimaryAdminUser();

  return getDb()
    .prepare(
      `select id, email, is_primary, created_at, updated_at
       from admin_users
       where id = ?`,
    )
    .get(id) as AdminUser | undefined;
}

export function getAdminUserWithPasswordByEmail(email: string) {
  ensurePrimaryAdminUser();

  return getDb()
    .prepare(
      `select id, email, password_hash, is_primary, created_at, updated_at
       from admin_users
       where lower(email) = lower(?)`,
    )
    .get(email) as AdminUserRow | undefined;
}

export function getAdminUserWithPasswordById(id: string) {
  ensurePrimaryAdminUser();

  return getDb()
    .prepare(
      `select id, email, password_hash, is_primary, created_at, updated_at
       from admin_users
       where id = ?`,
    )
    .get(id) as AdminUserRow | undefined;
}

export function createAdminUser(input: { email: string; passwordHash: string; isPrimary?: boolean }) {
  ensurePrimaryAdminUser();

  const id = crypto.randomUUID();
  getDb()
    .prepare("insert into admin_users (id, email, password_hash, is_primary) values (?, ?, ?, ?)")
    .run(id, input.email.toLowerCase(), input.passwordHash, input.isPrimary ? 1 : 0);

  return id;
}

export function updateAdminUserPassword(userId: string, passwordHash: string) {
  ensurePrimaryAdminUser();
  getDb().prepare("update admin_users set password_hash = ? where id = ?").run(passwordHash, userId);
}

export function deleteAdminUser(userId: string) {
  ensurePrimaryAdminUser();
  getDb().prepare("delete from admin_users where id = ? and is_primary = 0").run(userId);
}

export function listAnnualMetrics() {
  return getDb()
    .prepare(
      `select id, year, label, value, unit, comparison_label, comparison_value, comparison_unit, description, display_order, created_at, updated_at
       from annual_metrics
       order by year asc, display_order asc, label asc`,
    )
    .all() as AnnualMetric[];
}

export function getAnnualMetricById(id: string) {
  return getDb()
    .prepare(
      `select id, year, label, value, unit, comparison_label, comparison_value, comparison_unit, description, display_order, created_at, updated_at
       from annual_metrics
       where id = ?`,
    )
    .get(id) as AnnualMetric | undefined;
}

export function upsertAnnualMetric(input: Omit<AnnualMetric, "id" | "created_at" | "updated_at"> & { id?: string }) {
  const id = input.id || crypto.randomUUID();
  getDb()
    .prepare(
      `insert into annual_metrics
       (id, year, label, value, unit, comparison_label, comparison_value, comparison_unit, description, display_order)
       values (@id, @year, @label, @value, @unit, @comparison_label, @comparison_value, @comparison_unit, @description, @display_order)
       on conflict(id) do update set
         year = excluded.year,
         label = excluded.label,
         value = excluded.value,
         unit = excluded.unit,
         comparison_label = excluded.comparison_label,
         comparison_value = excluded.comparison_value,
         comparison_unit = excluded.comparison_unit,
         description = excluded.description,
         display_order = excluded.display_order`,
    )
    .run({
      id,
      year: input.year,
      label: input.label,
      value: input.value,
      unit: input.unit ?? null,
      comparison_label: input.comparison_label ?? null,
      comparison_value: input.comparison_value ?? null,
      comparison_unit: input.comparison_unit ?? null,
      description: input.description ?? null,
      display_order: input.display_order ?? 0,
    });

  return id;
}

export function deleteAnnualMetric(id: string) {
  getDb().prepare("delete from annual_metrics where id = ?").run(id);
}

export function replaceAnnualMetrics(metrics: AnnualMetric[]) {
  const db = getDb();
  const replace = db.transaction((items: AnnualMetric[]) => {
    db.prepare("delete from annual_metrics").run();

    const insert = db.prepare(
      `insert into annual_metrics
       (id, year, label, value, unit, comparison_label, comparison_value, comparison_unit, description, display_order, created_at, updated_at)
       values (@id, @year, @label, @value, @unit, @comparison_label, @comparison_value, @comparison_unit, @description, @display_order, @created_at, @updated_at)`,
    );

    for (const item of items) {
      insert.run({
        id: item.id || crypto.randomUUID(),
        year: item.year,
        label: item.label,
        value: item.value,
        unit: item.unit ?? null,
        comparison_label: item.comparison_label ?? null,
        comparison_value: item.comparison_value ?? null,
        comparison_unit: item.comparison_unit ?? null,
        description: item.description ?? null,
        display_order: item.display_order ?? 0,
        created_at: item.created_at ?? new Date().toISOString(),
        updated_at: item.updated_at ?? new Date().toISOString(),
      });
    }
  });

  replace(metrics);
}

function createUniqueSlug(db: Database.Database, title: string, date: string, ownId: string) {
  const year = date.slice(0, 4);
  const base = slugify(`${year}-${title}`) || `${year}-ereignis`;
  let candidate = base;
  let index = 2;

  while (true) {
    const existing = db
      .prepare("select id from timeline_events where slug = ? and id != ?")
      .get(candidate, ownId) as { id: string } | undefined;

    if (!existing) return candidate;
    candidate = `${base}-${index}`;
    index += 1;
  }
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
