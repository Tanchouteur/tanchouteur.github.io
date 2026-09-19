import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { mountJourney } from "../../assets/js/journey.mjs";
import { normalizeProjects } from "../../lib/portfolio.mjs";
const tick = () => new Promise((resolve) => setImmediate(resolve));
function setup(reduced = false) {
  const dom = new JSDOM(readFileSync("index.html", "utf8"), {
    url: "https://example.com",
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
  let callbacks = new Map(),
    id = 0;
  view.requestAnimationFrame = (fn) => {
    callbacks.set(++id, fn);
    return id;
  };
  view.cancelAnimationFrame = (id) => callbacks.delete(id);
  const flush = (time = view.performance.now()) => {
    const current = [...callbacks.values()];
    callbacks.clear();
    current.forEach((fn) => fn(time));
  };
  const change = (value) => {
    preference.matches = value;
    preference.dispatchEvent(new view.Event("change"));
    flush();
  };
  return { dom, doc: view.document, view, preference, flush, change };
}
const projects = normalizeProjects([
  { id: "a", title: "A", featured: true },
  { id: "b", title: "B", featured: true },
]);
test("mouvement réduit : aucun import 3D, liens catalogue et sélection disponibles", async () => {
  const env = setup(true);
  let imports = 0;
  const stop = mountJourney(projects, env.doc, {
    loadScene: async () => {
      imports++;
      throw Error();
    },
  });
  env.flush();
  await tick();
  assert.equal(imports, 0);
  assert.equal(env.doc.querySelector(".is-immersive"), null);
  assert.equal(
    env.doc.querySelector(".hero-actions a").getAttribute("href"),
    "#projects",
  );
  assert.equal(env.doc.querySelector("#selected-projects").hidden, false);
  stop();
  assert.equal(env.doc.querySelector(".journey-shell"), null);
  assert.ok(env.doc.querySelector(".hero"));
  env.dom.window.close();
});
test("défilement, sortie lisible, retour au début et changement de préférence", async () => {
  const env = setup();
  let disposed = 0;
  const updates = [];
  const stop = mountJourney(projects, env.doc, {
    loadScene: async () => ({
      mountScene: () => ({
        update: (state) => updates.push(state),
        dispose: () => disposed++,
      }),
    }),
  });
  await tick();
  const shell = env.doc.querySelector(".journey-shell");
  let top = 0;
  Object.defineProperty(shell, "offsetHeight", { value: 4768 });
  shell.getBoundingClientRect = () => ({ top });
  env.flush();
  assert.equal(env.doc.querySelector(".journey-intro").inert, false);
  assert.equal(
    parseFloat(env.doc.querySelector("#journey-start").style.top),
    4000 / 3,
  );
  assert.equal(env.doc.body.classList.contains("immersive-home"), true);
  top = -4000;
  env.view.dispatchEvent(new env.view.Event("scroll"));
  env.flush();
  assert.equal(env.doc.querySelector(".journey-outro").inert, false);
  assert.equal(env.doc.querySelector(".journey-outro").style.opacity, "1");
  assert.equal(env.doc.querySelector(".journey-intro").inert, true);
  top = 0;
  env.view.dispatchEvent(new env.view.Event("resize"));
  env.flush();
  assert.equal(env.doc.querySelector(".journey-intro").inert, false);
  env.change(true);
  assert.equal(disposed, 1);
  assert.equal(env.doc.body.classList.contains("immersive-home"), false);
  assert.equal(shell.classList.contains("is-immersive"), false);
  assert.equal(
    env.doc.querySelector(".hero-actions a").getAttribute("href"),
    "#projects",
  );
  stop();
  assert.equal(env.doc.querySelector(".journey-shell"), null);
  env.dom.window.close();
});
test("import tardif et import échoué : contenu HTML conservé sans scène", async () => {
  const env = setup();
  let resolve,
    mounts = 0;
  const stop = mountJourney(projects, env.doc, {
    loadScene: () =>
      new Promise((done) => {
        resolve = done;
      }),
  });
  env.change(true);
  resolve({
    mountScene: () => {
      mounts++;
    },
  });
  await tick();
  assert.equal(mounts, 0);
  assert.ok(env.doc.querySelector("h1"));
  stop();
  const cleanup = mountJourney(projects, env.doc, {
    loadScene: async () => {
      throw Error("WebGL unavailable");
    },
  });
  env.change(false);
  await tick();
  env.flush();
  assert.ok(env.doc.querySelector(".journey-intro"));
  assert.ok(env.doc.querySelector(".journey-hud a"));
  cleanup();
  env.dom.window.close();
});

test("aimantation progressive annulable par un nouveau geste et par mouvement réduit", async () => {
  const env = setup();
  let timers = new Map(),
    timerId = 0,
    now = 0;
  env.view.performance.now = () => now;
  env.view.setTimeout = (fn) => {
    timers.set(++timerId, fn);
    return timerId;
  };
  env.view.clearTimeout = (id) => timers.delete(id);
  const runTimers = () => {
    const pending = [...timers.values()];
    timers.clear();
    pending.forEach((fn) => fn());
  };
  const calls = [];
  env.view.scrollTo = ({ top, behavior }) => {
    calls.push({ top, behavior });
    env.view.scrollY = top;
  };
  const stop = mountJourney(projects, env.doc, {
    loadScene: async () => ({
      mountScene: () => ({ update() {}, dispose() {} }),
    }),
  });
  await tick();
  const shell = env.doc.querySelector(".journey-shell");
  Object.defineProperty(shell, "offsetHeight", { value: 3768 });
  shell.getBoundingClientRect = () => ({ top: -env.view.scrollY });
  env.flush();
  env.view.scrollY = 300;
  env.view.dispatchEvent(new env.view.Event("scroll"));
  runTimers();
  now = 250;
  env.flush(now);
  assert.ok(env.view.scrollY > 300 && env.view.scrollY < 1000);
  assert.equal(calls.at(-1).behavior, "instant");
  env.view.dispatchEvent(new env.view.Event("wheel"));
  const count = calls.length;
  now = 900;
  env.flush(now);
  assert.equal(calls.length, count);
  env.view.scrollY = 700;
  env.view.dispatchEvent(new env.view.Event("scroll"));
  runTimers();
  now = 2000;
  env.flush(now);
  assert.equal(env.view.scrollY, 1000);
  env.view.scrollY = 1400;
  env.view.dispatchEvent(new env.view.Event("scroll"));
  runTimers();
  env.change(true);
  const reducedCount = calls.length;
  now = 4000;
  env.flush(now);
  assert.equal(calls.length, reducedCount);
  stop();
  env.dom.window.close();
});
