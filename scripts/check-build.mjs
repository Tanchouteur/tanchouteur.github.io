import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";
import { gzipSync } from "node:zlib";
import { JSDOM } from "jsdom";
import { normalizeProjects } from "../lib/portfolio.mjs";

function exactPath(path) {
  const parts = path.split("/").filter(Boolean);
  let directory = resolve("dist");
  for (const part of parts) {
    assert.ok(
      readdirSync(directory).includes(part),
      `Ressource manquante ou mauvaise casse : ${path}`,
    );
    directory = join(directory, part);
  }
  assert.ok(statSync(directory).isFile(), `Fichier attendu : ${path}`);
}
for (const name of [
  "index",
  "project",
  "skills",
  "me",
  "hardware",
  "contact",
]) {
  const dom = new JSDOM(readFileSync(`dist/${name}.html`, "utf8"));
  const doc = dom.window.document;
  assert.equal(doc.documentElement.lang, "fr");
  assert.ok(doc.querySelector("nav"), `Navigation absente de ${name}`);
  assert.ok(doc.querySelector("main"));
  assert.equal(doc.querySelectorAll("h1").length, 1);
  for (const element of doc.querySelectorAll("[src], [href]")) {
    const url = element.getAttribute("src") || element.getAttribute("href");
    if (!url || !url.startsWith("/") || url.startsWith("//")) continue;
    const path = decodeURIComponent(url.split(/[?#]/)[0]);
    if (path === "/") continue;
    exactPath(path);
  }
  dom.window.close();
}
const projects = normalizeProjects(
  JSON.parse(readFileSync("dist/assets/data/projects.json", "utf8")),
);
for (const project of projects)
  for (const path of [project.cover, ...project.images].filter(Boolean))
    exactPath(path);
let ordinary = 0,
  scene = 0;
for (const name of readdirSync("dist/assets").filter((name) =>
  name.endsWith(".js"),
)) {
  const bytes = gzipSync(readFileSync(`dist/assets/${name}`)).length;
  if (name.startsWith("scene-")) scene += bytes;
  else ordinary += bytes;
}
assert.ok(scene > 0 && scene < 200 * 1024, `Budget 3D dépassé : ${scene}`);
assert.ok(
  ordinary < 150 * 1024,
  `Budget JavaScript hors 3D dépassé : ${ordinary}`,
);
console.log(
  `Build validé : six pages, ${projects.length} projets, chemins sensibles à la casse. JS gzip : ${(ordinary / 1024).toFixed(1)} Ko + 3D différée ${(scene / 1024).toFixed(1)} Ko.`,
);
