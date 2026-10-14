-- Migration intake only. The running application must not read from this schema.
-- A backup's email/UID/verification flags are source data, never authentication.
create schema if not exists mind_migration;
revoke all on schema mind_migration from public, anon, authenticated;

create table mind_migration.firebase_imports (
  checksum text primary key check (checksum ~ '^[a-f0-9]{64}$'),
  firebase_uid text not null,
  raw_payload bytea not null check (octet_length(raw_payload) between 1 and 33554432),
  expected_counts jsonb not null,
  imported_at timestamptz not null default now(),
  constraint backup_digest_matches check (encode(sha256(raw_payload), 'hex') = checksum)
);

create table mind_migration.firebase_records (
  import_checksum text not null references mind_migration.firebase_imports(checksum),
  kind text not null check (kind in ('user', 'workspace', 'prompt')),
  source_id text not null,
  record_data jsonb not null check (jsonb_typeof(record_data) = 'object'),
  primary key (import_checksum, kind, source_id)
);

alter table mind_migration.firebase_imports enable row level security;
alter table mind_migration.firebase_records enable row level security;
-- No client policies: both anonymous and authenticated API clients are denied.
revoke all on all tables in schema mind_migration from public, anon, authenticated;
grant usage on schema mind_migration to service_role;
grant select, insert on all tables in schema mind_migration to service_role;

comment on schema mind_migration is 'Private Firebase migration intake. Do not expose to the Data API. Release data only after verified ownership, never by matching an email supplied in a backup.';
