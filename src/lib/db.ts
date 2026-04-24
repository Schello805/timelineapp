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
        event_date text not null,
        title text not null,
        description text not null,
        image_url text,
        video_url text,
        pdf_url text,
        created_at text not null default current_timestamp,
        updated_at text not null default current_timestamp
      );

      create trigger if not exists timeline_events_updated_at
      after update on timeline_events
      for each row
      begin
        update timeline_events set updated_at = current_timestamp where id = old.id;
      end;
    `);
  }

  return database;
}

export function listTimelineEvents() {
  return getDb()
    .prepare(
      `select id, event_date, title, description, image_url, video_url, pdf_url, created_at, updated_at
       from timeline_events
       order by event_date asc`,
    )
    .all() as TimelineEvent[];
}

export function upsertEvent(input: TimelineEventInput & { id?: string }) {
  const id = input.id || crypto.randomUUID();

  getDb()
    .prepare(
      `insert into timeline_events (id, event_date, title, description, image_url, video_url, pdf_url)
       values (@id, @event_date, @title, @description, @image_url, @video_url, @pdf_url)
       on conflict(id) do update set
         event_date = excluded.event_date,
         title = excluded.title,
         description = excluded.description,
         image_url = excluded.image_url,
         video_url = excluded.video_url,
         pdf_url = excluded.pdf_url`,
    )
    .run({
      id,
      event_date: input.event_date,
      title: input.title,
      description: input.description,
      image_url: input.image_url ?? null,
      video_url: input.video_url ?? null,
      pdf_url: input.pdf_url ?? null,
    });

  return id;
}

export function deleteEvent(id: string) {
  getDb().prepare("delete from timeline_events where id = ?").run(id);
}
