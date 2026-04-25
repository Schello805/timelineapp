import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import type { TimelineEvent, TimelineEventInput } from "@/lib/types";

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
        image_url text,
        video_url text,
        pdf_url text,
        created_at text not null default current_timestamp,
        updated_at text not null default current_timestamp
      );

      create table if not exists app_settings (
        key text primary key,
        value text not null,
        updated_at text not null default current_timestamp
      );

      create trigger if not exists timeline_events_updated_at
      after update on timeline_events
      for each row
      begin
        update timeline_events set updated_at = current_timestamp where id = old.id;
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

  db.prepare("create unique index if not exists timeline_events_slug_unique on timeline_events(slug)").run();

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

export function listTimelineEvents() {
  return getDb()
    .prepare(
      `select id, slug, event_date, title, description, image_url, video_url, pdf_url, created_at, updated_at
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
      `insert into timeline_events (id, slug, event_date, title, description, image_url, video_url, pdf_url)
       values (@id, @slug, @event_date, @title, @description, @image_url, @video_url, @pdf_url)
       on conflict(id) do update set
         slug = excluded.slug,
         event_date = excluded.event_date,
         title = excluded.title,
         description = excluded.description,
         image_url = excluded.image_url,
         video_url = excluded.video_url,
         pdf_url = excluded.pdf_url`,
    )
    .run({
      id,
      slug,
      event_date: input.event_date,
      title: input.title,
      description: input.description,
      image_url: input.image_url ?? null,
      video_url: input.video_url ?? null,
      pdf_url: input.pdf_url ?? null,
    });

  return id;
}

export function getTimelineEventBySlug(slug: string) {
  return getDb()
    .prepare(
      `select id, slug, event_date, title, description, image_url, video_url, pdf_url, created_at, updated_at
       from timeline_events
       where slug = ?`,
    )
    .get(slug) as TimelineEvent | undefined;
}

export function getTimelineEventById(id: string) {
  return getDb()
    .prepare(
      `select id, slug, event_date, title, description, image_url, video_url, pdf_url, created_at, updated_at
       from timeline_events
       where id = ?`,
    )
    .get(id) as TimelineEvent | undefined;
}

export function deleteEvent(id: string) {
  getDb().prepare("delete from timeline_events where id = ?").run(id);
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
