import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Produces an administrative MCP execute_sql request, never a browser endpoint.
// Keep the generated file outside the repository: it contains private user data.
const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  throw new Error("Uso: node scripts/prepare-firebase-import.mjs BACKUP.json /tmp/import-request.json");
}
const repository = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const destination = resolve(outputPath);
const relativeDestination = relative(repository, destination);
if (!relativeDestination.startsWith("../") && relativeDestination !== "..") {
  throw new Error("Grave o arquivo gerado fora do repositório para proteger os dados privados.");
}
const raw = await readFile(inputPath);
if (!raw.length || raw.length > 32 * 1024 * 1024) throw new Error("Backup vazio ou maior que 32 MB.");
const backup = JSON.parse(raw.toString("utf8"));
const object = value => value !== null && typeof value === "object" && !Array.isArray(value);
const identifier = value => typeof value === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(value);
if (backup.format !== "mind-firebase-backup" || backup.version !== 1 || !object(backup.account) || !identifier(backup.account.firebaseUid) || !object(backup.profile) || !Array.isArray(backup.prompts)) {
  throw new Error("Formato de backup não reconhecido.");
}
const uid = backup.account.firebaseUid;
if (backup.profile.uid && backup.profile.uid !== uid) throw new Error("UID do perfil não corresponde ao backup.");
if (backup.workspace !== null && (!object(backup.workspace) || !identifier(backup.workspace.id) || !object(backup.workspace.data) || backup.workspace.data.ownerId !== uid)) {
  throw new Error("Workspace inválido ou proprietário diferente.");
}
if (backup.prompts.length && !backup.workspace) throw new Error("Prompts sem workspace de origem.");
if (backup.workspace && backup.profile.primaryWorkspaceId !== backup.workspace.id) throw new Error("Workspace principal não corresponde ao backup.");
const ids = new Set();
let images = 0, published = 0, favorites = 0;
for (const prompt of backup.prompts) {
  if (!object(prompt) || !identifier(prompt.id) || ids.has(prompt.id) || !object(prompt.data)) throw new Error("Prompt inválido ou duplicado.");
  ids.add(prompt.id);
  const data = prompt.data;
  if (data.createdBy !== uid || typeof data.title !== "string" || typeof data.content !== "string" || !Array.isArray(data.images)) throw new Error("Dados ou proprietário do prompt inválidos.");
  for (const image of data.images) {
    if (!object(image) || typeof image.url !== "string" || !["gallery", "reference", "before", "after"].includes(image.role)) throw new Error("Imagem inválida no backup.");
  }
  images += data.images.length;
  published += Number(data.isPublished === true);
  favorites += Number(data.isFavorite === true);
}
const checksum = createHash("sha256").update(raw).digest("hex");
const counts = { users: 1, workspaces: backup.workspace ? 1 : 0, prompts: backup.prompts.length, images, published, favorites };
// Only validated identifiers/digest/counts and hex-encoded bytes enter SQL text.
// Contents (including user-authored prompts) are parsed as JSON, never SQL.
const query = `begin;
insert into mind_migration.firebase_imports(checksum, firebase_uid, raw_payload, expected_counts)
values ('${checksum}', '${uid}', decode('${raw.toString("hex")}', 'hex'), '${JSON.stringify(counts)}'::jsonb)
on conflict (checksum) do nothing;
with source as (
  select checksum, convert_from(raw_payload, 'UTF8')::jsonb as backup
  from mind_migration.firebase_imports where checksum = '${checksum}'
), records as (
  select checksum, 'user' as kind, backup->'account'->>'firebaseUid' as source_id, backup->'profile' as record_data from source
  union all
  select checksum, 'workspace', backup->'workspace'->>'id', backup->'workspace'->'data' from source where jsonb_typeof(backup->'workspace') = 'object'
  union all
  select checksum, 'prompt', prompt->>'id', prompt->'data' from source cross join lateral jsonb_array_elements(backup->'prompts') as prompt
)
insert into mind_migration.firebase_records(import_checksum, kind, source_id, record_data)
select checksum, kind, source_id, record_data from records
on conflict (import_checksum, kind, source_id) do nothing;
commit;`;
await writeFile(destination, JSON.stringify({ query }), { mode: 0o600, flag: "wx" });
console.log(JSON.stringify({ checksum, bytes: raw.length, ...counts, requestPath: destination }));
