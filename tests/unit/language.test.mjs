import test from "node:test";
import assert from "node:assert/strict";
import { currentLanguage, languageURL, preferredLanguage } from "../../lib/language.mjs";
import { inEnglish } from "../../lib/projects-en.mjs";

test("browser preference, explicit choice and matching page URLs", () => {
  assert.equal(preferredLanguage(null, "en-US"), "en");
  assert.equal(preferredLanguage(null, "fr-FR"), "fr");
  assert.equal(preferredLanguage("fr", "en-US"), "fr");
  assert.equal(preferredLanguage("en", "fr-FR"), "en");
  assert.equal(currentLanguage("/en/project.html"), "en");
  assert.equal(languageURL("/en/project.html", "fr"), "/project.html");
  assert.equal(languageURL("/me.html", "en"), "/en/me.html");
});

test("English project copy stays independent of collected French data", () => {
  const source = [{ id: "CliOS", title: "CliOS", description: "Français", longDescription: "Texte français", tags: ["Algorithmique"] }];
  const translated = inEnglish(source);
  assert.match(translated[0].description, /dashboard/);
  assert.equal(translated[0].tags[0], "Algorithms");
  assert.equal(source[0].description, "Français");
  assert.equal(inEnglish([{ id: "future", title: "New project", tags: [] }])[0].description, "English project description coming soon.");
});
