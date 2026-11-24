import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { mountHero } from "../../assets/js/hero.mjs";

const tick = () => new Promise((resolve) => setImmediate(resolve));
function setup(page = "index.html", reduced = false) {
  const dom = new JSDOM(readFileSync(page, "utf8"), {
    url: "https://example.com/",
    pretendToBeVisual: true,
  });
  const view = dom.window;
  const preference = new view.EventTarget();
  preference.matches = reduced;
  view.matchMedia = () => preference;
  view.IntersectionObserver = class {
    observe() {}
    disconnect() {}
  };
  const callbacks = new Map();
  let id = 0;
  view.requestAnimationFrame = (fn) => (callbacks.set(++id, fn), id);
  view.cancelAnimationFrame = (key) => callbacks.delete(key);
  const flush = (time = 16) => {
    const current = [...callbacks.values()];
    callbacks.clear();
    current.forEach((fn) => fn(time));
  };
  const change = (value) => {
    preference.matches = value;
    preference.dispatchEvent(new view.Event("change"));
  };
  return {
    dom,
    doc: view.document,
    view,
    flush,
    change,
    pending: () => callbacks.size,
  };
}
const fakeScene = (log) => async () => ({
  mountScene: (container) => {
    log.mounted = container;
    return {
      frame(state) {
        log.frames = (log.frames || 0) + 1;
        log.state = state;
        return [0, 1, 2, 3].map((i) => ({ x: 100 + i, y: 400 - i * 80 }));
      },
      resize() {},
      dispose() {
        log.disposed = (log.disposed || 0) + 1;
      },
    };
  },
});

for (const page of ["index.html", "en/index.html"])
  test(`${page} : le héros expose identité, actions et quatre couches en HTML`, () => {
    const { doc, dom } = setup(page);
    assert.equal(doc.querySelectorAll("h1").length, 1);
    assert.equal(doc.querySelectorAll(".layer-label").length, 4);
    assert.deepEqual(
      [...doc.querySelectorAll(".layer-label")].map((l) => l.dataset.layer),
      ["3", "2", "1", "0"],
    );
    assert.equal(
      doc.querySelector(".hero-actions a").getAttribute("href"),
      "#projects",
    );
    dom.window.close();
  });

test("mode immersif : scène chargée, étiquettes reliées aux couches, nettoyage complet", async () => {
  const env = setup();
  const log = {};
  const stop = mountHero(env.doc, { loadScene: fakeScene(log) });
  await tick();
  const hero = env.doc.querySelector(".hero");
  assert.ok(hero.classList.contains("is-immersive"));
  assert.ok(hero.classList.contains("scene-ready"));
  assert.equal(log.mounted, env.doc.querySelector(".hero-scene"));
  env.flush();
  assert.ok(log.frames >= 1);
  const label = env.doc.querySelector('.layer-label[data-layer="2"]');
  assert.match(label.style.transform, /translate3d\(102px, 240px/);
  assert.ok(env.pending() > 0, "la scène s’anime tant qu’elle est visible");
  stop();
  assert.equal(log.disposed, 1);
  assert.equal(hero.classList.contains("is-immersive"), false);
  assert.equal(label.style.transform, "");
  assert.equal(env.doc.body.classList.contains("immersive-home"), false);
  env.dom.window.close();
});

test("mouvement réduit : aucun import 3D et présentation statique", async () => {
  const env = setup("index.html", true);
  let imports = 0;
  const stop = mountHero(env.doc, {
    loadScene: async () => {
      imports++;
      throw new Error("ne doit pas charger");
    },
  });
  env.flush();
  await tick();
  assert.equal(imports, 0);
  assert.equal(env.doc.querySelector(".is-immersive"), null);
  stop();
  env.dom.window.close();
});

test("bascule du mouvement réduit en cours de session : la scène est libérée", async () => {
  const env = setup();
  const log = {};
  const stop = mountHero(env.doc, { loadScene: fakeScene(log) });
  await tick();
  env.change(true);
  assert.equal(log.disposed, 1);
  assert.equal(env.doc.querySelector(".is-immersive"), null);
  assert.equal(
    env.doc.querySelector(".hero-identity").hasAttribute("inert"),
    false,
  );
  env.change(false);
  await tick();
  assert.ok(env.doc.querySelector(".hero.scene-ready"));
  stop();
  env.dom.window.close();
});

test("échec du chargement 3D : le texte reste en place", async () => {
  const env = setup();
  const stop = mountHero(env.doc, {
    loadScene: async () => Promise.reject(new Error("réseau")),
  });
  await tick();
  await tick();
  assert.ok(env.doc.querySelector(".hero.scene-failed"));
  assert.ok(env.doc.querySelector(".hero-identity h1"));
  stop();
  env.dom.window.close();
});
