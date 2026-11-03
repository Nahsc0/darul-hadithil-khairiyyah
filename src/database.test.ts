import {
  before as beforeAll,
  after as afterAll,
  describe,
  it,
} from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
// Execute the real migration in PostgreSQL WASM with minimal Supabase-owned schemas.
const db = new PGlite();
const admin = "11111111-1111-4111-8111-111111111111";
const editor = "22222222-2222-4222-8222-222222222222";
const outsider = "33333333-3333-4333-8333-333333333333";
beforeAll(
  async () => {
    await db.exec(`create role anon; create role authenticated; create schema auth; create schema storage;
 create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth,storage to anon,authenticated;
 grant execute on function auth.uid() to anon,authenticated;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
 alter table storage.objects enable row level security;
 grant select,insert,update,delete on storage.objects to anon,authenticated;
 insert into auth.users values('${admin}'),('${editor}'),('${outsider}');`);
    await db.exec(readFileSync("supabase/001_schema.sql", "utf8"));
    await db.exec(`insert into public.profiles values('${admin}','admin'),('${editor}','editor');
 insert into content(kind,slug,title_en,title_ha,body_en,body_ha,status,date) values
 ('event','public-event','Public event','Taro','Body','Rubutu','published','2026-10-30'),
 ('article','staff-draft','Draft','Daftari','','','draft','2026-11-03');`);
  },
  { timeout: 30000 },
);
afterAll(async () => {
  await db.close();
});
async function as(role: string, id: string, sql: string) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  await db.exec(`set role ${role}`);
  return db.query(sql);
}
describe("database security boundaries", () => {
  it("anonymous readers see published content only", async () => {
    const r = await as("anon", "", "select slug from content");
    assert.deepEqual(r.rows, [{ slug: "public-event" }]);
  });
  it("anonymous writes and TRUNCATE are denied", async () => {
    await assert.rejects(as("anon", "", "delete from content"));
    await assert.rejects(as("authenticated", admin, "truncate content"));
  });
  it("editors read drafts but cannot publish or change settings", async () => {
    const r = await as(
      "authenticated",
      editor,
      "select slug from content order by slug",
    );
    assert.equal(r.rows.length, 2);
    await assert.rejects(
      as(
        "authenticated",
        editor,
        "update content set status='published',body_en='test',body_ha='rubutu',author='Editor' where slug='staff-draft'",
      ),
    );
    const change = await as(
      "authenticated",
      editor,
      "update settings set value='{}' where id='public' returning id",
    );
    assert.equal(change.rows.length, 0);
  });
  it("staff cannot grant themselves another role", async () => {
    await assert.rejects(
      as("authenticated", editor, "update profiles set role='admin'"),
    );
  });
  it("users without a staff role cannot create content", async () => {
    await assert.rejects(
      as(
        "authenticated",
        outsider,
        "insert into content(kind,slug,title_en,title_ha,date) values('event','blocked','x','y','2026-11-03')",
      ),
    );
  });
  it("editors can save a draft and admins can publish it", async () => {
    await as(
      "authenticated",
      editor,
      "update content set body_en='Reviewed content',body_ha='Rubutun da aka duba',author='Mosque editorial team' where slug='staff-draft'",
    );
    const r = await as(
      "authenticated",
      admin,
      "update content set status='published' where slug='staff-draft' returning status",
    );
    assert.deepEqual(r.rows, [{ status: "published" }]);
  });
  it("server rejects incomplete publication", async () => {
    await assert.rejects(
      as(
        "authenticated",
        admin,
        "insert into content(kind,slug,title_en,title_ha,status,date) values('article','incomplete','x','y','published','2026-11-03')",
      ),
    );
  });
  it("only admins upload images and see the content audit trail", async () => {
    await assert.rejects(
      as(
        "authenticated",
        editor,
        "insert into storage.objects(bucket_id,name) values('media','blocked.png')",
      ),
    );
    await as(
      "authenticated",
      admin,
      "insert into storage.objects(bucket_id,name) values('media','allowed.png')",
    );
    const audit = await as(
      "authenticated",
      admin,
      "select action from audit_log where action like 'content:UPDATE:%'",
    );
    assert.ok(audit.rows.length > 0);
    const hidden = await as("authenticated", editor, "select * from audit_log");
    assert.equal(hidden.rows.length, 0);
  });
});
