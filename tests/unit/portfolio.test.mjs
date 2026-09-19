import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeProjects,
  normalizeProject,
  normalizePresentation,
  featuredProjects,
  categoriesFor,
  filterProjects,
  mediaPath,
  safeURL,
  captionFor,
  COPPER,
} from "../../lib/portfolio.mjs";

test("ancien contrat : valeurs par défaut, médias historiques et contenu conservés", () => {
  const p = normalizeProject({
    id: "legacy",
    title: "Ancien projet",
    cover: "assets/images/projects/legacy/cover.png",
    tags: ["C"],
    longDescription: "# Architecture",
  });
  assert.equal(p.cover, "/assets/images/Projects/legacy/cover.png");
  assert.equal(p.presentation.type, "neutral");
  assert.equal(p.presentation.accent, COPPER);
  assert.equal(p.longDescription, "# Architecture");
  assert.deepEqual(p.tags, ["C"]);
});
test("présentation facultative validée sans injecter de CSS", () => {
  assert.deepEqual(
    normalizePresentation({
      type: "interface",
      accent: "#112233",
      captions: { "a.png": "Vue", "b.png": 7 },
    }),
    { type: "interface", accent: "#112233", captions: { "a.png": "Vue" } },
  );
  assert.equal(
    normalizePresentation({ type: "invented", accent: "red;position:fixed" })
      .accent,
    COPPER,
  );
  assert.equal(normalizePresentation({ type: "invented" }).type, "neutral");
});
test("ordre stable puis date, sélection limitée à trois, identifiants uniques", () => {
  const items = normalizeProjects([
    { id: "old", date: "2020", order: 1, featured: true },
    { id: "new", date: "2026", order: 1, featured: true },
    { id: "first", order: 0, featured: true },
    { id: "fourth", featured: true },
    { id: "first" },
  ]);
  assert.deepEqual(
    items.map((p) => p.id),
    ["first", "new", "old", "fourth"],
  );
  assert.deepEqual(
    featuredProjects(items).map((p) => p.id),
    ["first", "new", "old"],
  );
});
test("professionnels et catégories futures sont filtrables", () => {
  const projects = normalizeProjects([
    { id: "a", category: "Professional" },
    { id: "b", category: "Research" },
    { id: "c", category: "Professional" },
  ]);
  assert.equal(
    categoriesFor(projects).find((c) => c.key === "Professional").label,
    "Professionnel",
  );
  assert.equal(filterProjects(projects, "Professional").length, 2);
  assert.equal(filterProjects(projects, "Research").length, 1);
  assert.deepEqual(filterProjects(projects, "absent"), []);
});
test("liens exécutables exclus et dépôts privés non présentés comme code public", () => {
  assert.equal(safeURL("javascript:alert(1)"), "");
  assert.equal(safeURL("data:text/html,bad"), "");
  const p = normalizeProject({
    id: "private",
    repoData: { isPrivate: true },
    links: {
      github: "https://github.com/x/y",
      demo: "https://demo.example.com",
    },
  });
  assert.equal(p.links.github, undefined);
  assert.equal(p.links.demo, "https://demo.example.com/");
});
test("médias locaux uniquement, sans traversée de chemin", () => {
  for (const path of [
    "https://evil/a.png",
    "assets/images/projects/a/../secret",
    'assets/images/projects/a/"bad.png',
  ])
    assert.equal(mediaPath(path), "");
});
test("légendes nommées et secours explicite", () => {
  const p = normalizeProject({
    id: "a",
    title: "Projet",
    presentation: { captions: { "a.png": "Écran principal" } },
  });
  assert.equal(
    captionFor(p, "/assets/images/Projects/a/a.png", 0),
    "Écran principal",
  );
  assert.equal(
    captionFor(p, "/assets/images/Projects/a/b.png", 1),
    "Projet — vue 2",
  );
});
test("catalogue vide, mauvais format et projet invalide", () => {
  assert.deepEqual(normalizeProjects([]), []);
  assert.deepEqual(normalizeProjects([null, {}, { id: 2 }]), []);
  assert.throws(() => normalizeProjects({ projects: [] }), /liste/);
});
