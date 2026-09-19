import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import collector from "../../scripts/build-projects.js";
import { normalizeProjects } from "../../lib/portfolio.mjs";

test("collecte GitHub simulée → JSON publié → contrat front-end", async () => {
  const directory = await mkdtemp(join(tmpdir(), "atelier-collector-"));
  const outputJson = join(directory, "projects.json");
  const api = {
    listAllRepos: async () => [
      {
        name: "old",
        owner: { login: "owner" },
        created_at: "2024-02-01",
        description: "Ancien",
        html_url: "https://github.com/owner/old",
        language: "Java",
      },
      {
        name: "new",
        owner: { login: "owner" },
        created_at: "2026-01-01",
        private: true,
      },
      { name: "ignored", archived: true },
    ],
    getPortfolioFolder: async () => [{ name: "portfolio.json" }],
    getPortfolioJson: async (_, name) =>
      name === "old"
        ? { title: "Ancien projet" }
        : {
            title: "Nouveau",
            order: 0,
            presentation: {
              type: "diagram",
              accent: "#123456",
              background: "#101b19",
              captions: { "view.png": "Architecture" },
            },
          },
    downloadPortfolioImages: async (_, name) => ({
      cover: `assets/images/Projects/${name}/cover.png`,
      images: [],
    }),
  };
  try {
    await collector.main({
      logger: { log() {} },
      api,
      outputJson,
      imagesDir: join(directory, "images"),
      dryRun: false,
    });
    const result = normalizeProjects(
      JSON.parse(await readFile(outputJson, "utf8")),
    );
    assert.equal(result.length, 2);
    assert.equal(result[0].id, "new");
    assert.equal(result[0].presentation.type, "diagram");
    assert.equal(result[0].presentation.background, "#101b19");
    assert.equal(result[1].presentation.type, "neutral");
    assert.deepEqual(result[1].tags, ["Java"]);
    assert.equal(result[1].cover, "/assets/images/Projects/old/cover.png");
    const dryPath = join(directory, "dry.json");
    await collector.main({
      logger: { log() {} },
      api,
      outputJson: dryPath,
      imagesDir: join(directory, "images"),
      dryRun: true,
    });
    await assert.rejects(access(dryPath));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
test("une erreur API interrompt la publication du catalogue", async () => {
  await assert.rejects(
    collector.main({
      logger: { log() {} },
      api: {
        listAllRepos: async () => {
          throw new Error("API unavailable");
        },
      },
      dryRun: true,
    }),
    /API unavailable/,
  );
});
