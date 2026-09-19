import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { initProjects } from "../../assets/js/projects.mjs";
import { normalizeProjects, featuredProjects } from "../../lib/portfolio.mjs";
import { initDetail } from "../../assets/js/detail.mjs";
const sample = {
  id: "sample",
  title: "Exemple",
  cover: "assets/images/Projects/sample/cover.png",
  images: ["assets/images/Projects/sample/view.png"],
  tags: ["C"],
  links: { github: "https://github.com/example/sample" },
};
const actual = JSON.parse(readFileSync("assets/data/projects.json", "utf8"));
const domFor = (page) =>
  new JSDOM(readFileSync(`${page}.html`, "utf8"), {
    url: "https://portfolio.example/",
  });
const fetchData = (data) => async () => ({ ok: true, json: async () => data });

test("catalogue réel évolutif et filtres de toutes ses catégories", async () => {
  const dom = domFor("index");
  const doc = dom.window.document;
  await initProjects(doc, fetchData(actual));
  const expected = normalizeProjects(actual);
  assert.equal(
    doc.querySelectorAll("#project-grid .project-card").length,
    expected.length,
  );
  assert.equal(
    doc.querySelectorAll(".selected-grid .project-card").length,
    featuredProjects(expected).length,
  );
  for (const button of doc.querySelectorAll("[data-category]")) {
    button.click();
    const count =
      button.dataset.category === "All"
        ? expected.length
        : expected.filter((p) => p.category === button.dataset.category).length;
    assert.equal(
      doc.querySelectorAll("#project-grid .project-card").length,
      count,
    );
  }
  dom.window.close();
});
test("nouveaux projets sans image, titres longs et contenu hostile", async () => {
  const dom = domFor("index");
  const doc = dom.window.document;
  const projects = Array.from({ length: 30 }, (_, i) => ({
    id: `test-${i}`,
    title:
      i === 0
        ? "<img src=x onerror=alert(1)>"
        : `Titre long ${"x".repeat(100)}`,
    category: i % 2 ? "Research" : "Professional",
  }));
  await initProjects(doc, fetchData(projects));
  assert.equal(doc.querySelectorAll("#project-grid .project-card").length, 30);
  assert.equal(doc.querySelectorAll("#project-grid img").length, 0);
  assert.match(doc.querySelector("h3").textContent, /<img/);
  assert.equal(doc.querySelector("#selected-projects").hidden, true);
  assert.ok(doc.querySelector('[data-category="Research"]'));
  dom.window.close();
});
test("catalogue vide et erreur réseau avec nouvel essai", async () => {
  const dom = domFor("index");
  const doc = dom.window.document;
  await initProjects(doc, fetchData([]));
  assert.match(doc.querySelector("#project-grid").textContent, /bientôt/);
  await initProjects(doc, async () => {
    throw new Error("offline");
  });
  assert.ok(doc.querySelector('[role="alert"]'));
  assert.ok(doc.querySelector("#retry-projects"));
  assert.equal(
    doc.querySelector("#project-grid").getAttribute("aria-busy"),
    "false",
  );
  dom.window.close();
});
test("fiche historique : liens, galerie, Markdown assaini, texte échappé", async () => {
  const dom = domFor("project");
  const doc = dom.window.document;
  const project = {
    ...sample,
    longDescription:
      '# Description\n\n<script>alert(1)</script><img src="x" onerror="alert(1)"><a href="javascript:alert(1)">Bad</a>\n\n**Texte**',
    title: "Titre <script>bad</script>",
  };
  await initDetail(doc, fetchData([project]), `?id=${project.id}`);
  assert.equal(
    doc.querySelector(".detail-heading h1").textContent,
    project.title,
  );
  assert.ok(doc.querySelector(".markdown strong"));
  assert.equal(doc.querySelectorAll("h1").length, 1);
  assert.equal(doc.querySelector(".markdown script"), null);
  assert.equal(doc.querySelector(".markdown [onerror]"), null);
  assert.equal(doc.querySelector('.markdown a[href^="javascript"]'), null);
  assert.equal(
    doc.querySelectorAll(".gallery-item").length,
    project.images.length,
  );
  dom.window.close();
});
test("fiche inconnue ou sans identifiant : retour au catalogue", async () => {
  const dom = domFor("project");
  const doc = dom.window.document;
  await initDetail(doc, fetchData(actual), "?id=unknown");
  assert.ok(doc.querySelector(".detail-error a"));
  await initDetail(doc, fetchData(actual), "");
  assert.match(doc.querySelector("h1").textContent, /Quel projet/);
  dom.window.close();
});
test("image de couverture cassée : repli typographique", async () => {
  const dom = domFor("index");
  const doc = dom.window.document;
  await initProjects(doc, fetchData([sample]));
  const image = doc.querySelector(".project-media img");
  image.dispatchEvent(new dom.window.Event("error"));
  assert.equal(image.hidden, true);
  assert.ok(image.parentElement.querySelector(".media-fallback"));
  assert.equal(image.parentElement.querySelectorAll("img[hidden]").length, 2);
  dom.window.close();
});
test("une couverture conserve son ratio sur un fond flouté dérivé", async () => {
  const dom = domFor("index");
  const doc = dom.window.document;
  await initProjects(doc, fetchData([sample]));
  const media = doc.querySelector(".project-media");
  const normalizedCover = normalizeProjects([sample])[0].cover;
  assert.equal(media.querySelectorAll("img").length, 2);
  assert.equal(
    media.querySelector(".media-ambient").getAttribute("src"),
    normalizedCover,
  );
  assert.equal(
    media.querySelector(".media-cover").getAttribute("src"),
    normalizedCover,
  );
  assert.equal(
    media.querySelector(".media-ambient").getAttribute("aria-hidden"),
    "true",
  );
  dom.window.close();
});
