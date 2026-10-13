import assert from "node:assert/strict";
import { emptyPromptDetails, readPromptDetails, validatePromptDetails, MAX_IMAGE_CHARS } from "../lib/prompt-media.ts";

const image = { id: "result-1", role: "gallery", label: "Resultado", url: "data:image/png;base64,AAAA" };
assert.deepEqual(readPromptDetails({}), emptyPromptDetails, "Legacy prompts remain readable without image fields");
assert.deepEqual(readPromptDetails({ images: [image] }).images, [image]);
assert.equal(readPromptDetails({ images: [{ ...image, url: "data:image/svg+xml;base64,AAAA" }, { ...image, url: "https://external.example/image.png" }] }).images.length, 0, "Only optimized image data URLs are accepted");
assert.doesNotThrow(() => validatePromptDetails("Título", "Texto completo", { ...emptyPromptDetails, images: [image] }));
assert.throws(() => validatePromptDetails("Título", "Texto", { ...emptyPromptDetails, images: [image, image] }), /repetida/);
assert.throws(() => validatePromptDetails("Título", "Texto", { ...emptyPromptDetails, images: [{ ...image, role: "before" }, { ...image, id: "result-2", role: "before" }] }), /apenas uma/);
assert.throws(() => validatePromptDetails("Título", "Texto", { ...emptyPromptDetails, images: Array.from({ length: 9 }, (_, id) => ({ ...image, id: String(id) })) }), /até 8/);
assert.throws(() => validatePromptDetails("Título", "Texto", { ...emptyPromptDetails, images: [{ ...image, url: "data:image/png;base64," + "A".repeat(MAX_IMAGE_CHARS) }] }), /inválida/);
assert.throws(() => validatePromptDetails("Título", "x".repeat(20001), emptyPromptDetails), /20.000/);
const fullGallery = Array.from({ length: 8 }, (_, id) => ({ ...image, id: String(id), url: "data:image/png;base64," + "A".repeat(79_960) }));
assert.doesNotThrow(() => validatePromptDetails("Título", "😀".repeat(10000), { ...emptyPromptDetails, images: fullGallery }), "A complete optimized gallery fits below Firestore's document size limit");
console.log("Prompt media checks passed: legacy data, safe image types, duplicate roles, size limits and full gallery budget.");
