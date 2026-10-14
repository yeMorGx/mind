export const USERNAME_PATTERN = /^[a-z][a-z0-9_]{2,23}$/;
export const USERNAME_HINT = "Use de 3 a 24 caracteres: letras, números e _, começando com uma letra.";
export function normalizeUsername(value: string) { return value.trim().replace(/^@/, "").toLowerCase(); }
export function creatorProfileHref(publicId: string, username?: string) { return `/u/${username ? `@${username}` : publicId}`; }
