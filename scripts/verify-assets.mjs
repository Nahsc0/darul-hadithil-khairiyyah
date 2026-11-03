import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
for (const file of [
  "mosque-logo.jpeg",
  "muhammad-auwal-mai-shago.jpeg",
  "kamaluddeen-umar-esq.jpeg",
]) {
  const original = await readFile(
    `kit/darul_hadithil_website_handoff/assets/originals/${file}`,
  );
  const published = await readFile(`public/assets/originals/${file}`);
  const hash = (x) => createHash("sha256").update(x).digest("hex");
  if (hash(original) !== hash(published))
    throw Error(`Original asset changed: ${file}`);
  console.log(`${file}: byte-for-byte preserved`);
}
console.log(
  `${(await readdir("public/assets/posters")).length} design-history posters preserved.`,
);
