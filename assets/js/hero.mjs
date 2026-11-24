import { heroState, follow } from "../../lib/hero.mjs";

// Pinned home hero: native scroll drives the exploded processor. Text stays
// real HTML; the scene is optional and never blocks reading or navigation.
export function mountHero(root = document, options = {}) {
  const view = root.defaultView;
  const hero = root.querySelector(".hero");
  const stage = hero?.querySelector(".hero-scene");
  if (!hero || !stage) return () => {};
  const loadScene = options.loadScene || (() => import("./scene.mjs"));
  const reduced = view.matchMedia("(prefers-reduced-motion: reduce)");
  const labels = [...hero.querySelectorAll(".layer-label")];
  let scene,
    frameId = 0,
    visible = true,
    disposed = false,
    loading = false,
    last = 0,
    clock = 0;
  const pointer = { x: 0, y: 0 },
    pointerTarget = { x: 0, y: 0 };
  const smooth = { explode: 0, intro: 1, labels: 0, exit: 0, progress: 0 };

  let offscreen = false;
  const measure = () => {
    const rect = hero.getBoundingClientRect();
    offscreen = rect.bottom < 0 || rect.top > view.innerHeight;
    return heroState(-rect.top, hero.offsetHeight - view.innerHeight);
  };
  const applyDOM = (state) => {
    hero.style.setProperty("--intro", state.intro.toFixed(4));
    hero.style.setProperty("--labels", state.labels.toFixed(4));
    hero.style.setProperty("--explode", state.explode.toFixed(4));
    hero.style.setProperty("--exit", state.exit.toFixed(4));
    hero.classList.toggle("labels-active", state.labels > 0.5);
    hero
      .querySelector(".hero-identity")
      ?.toggleAttribute("inert", state.intro < 0.2);
  };
  const placeLabels = (anchors) => {
    if (!anchors?.length || hero.classList.contains("is-compact")) return;
    labels.forEach((label) => {
      const anchor = anchors[Number(label.dataset.layer)];
      if (!anchor) return;
      label.style.transform = `translate3d(${Math.round(anchor.x)}px, ${Math.round(anchor.y)}px, 0)`;
    });
  };
  const loop = (now) => {
    frameId = 0;
    if (disposed || reduced.matches || !visible || root.hidden) return;
    const delta = last ? (now - last) / 1000 : 0.016;
    last = now;
    clock += Math.min(delta, 0.05);
    const target = measure();
    let moving = false;
    for (const key of Object.keys(smooth)) {
      smooth[key] = follow(smooth[key], target[key], delta, 9);
      if (Math.abs(smooth[key] - target[key]) > 0.0005) moving = true;
    }
    pointer.x = follow(pointer.x, pointerTarget.x, delta, 4);
    pointer.y = follow(pointer.y, pointerTarget.y, delta, 4);
    // Text follows the scroll directly; only the 3D motion is smoothed.
    applyDOM(target);
    // The scene animates continuously while visible; without it, only scroll moves.
    if (scene && !offscreen) placeLabels(scene.frame(smooth, pointer, clock));
    // Stop at once when scrolled away, without waiting for the observer.
    if (offscreen) visible = false;
    else if (scene || moving) frameId = view.requestAnimationFrame(loop);
  };
  const start = () => {
    if (!frameId && !disposed && !reduced.matches && visible && !root.hidden) {
      last = 0;
      frameId = view.requestAnimationFrame(loop);
    }
  };
  const stop = () => {
    view.cancelAnimationFrame(frameId);
    frameId = 0;
  };
  const compact = () =>
    hero.classList.toggle("is-compact", view.innerWidth < 900);
  const onPointer = (event) => {
    if (event.pointerType === "touch") return;
    pointerTarget.x = (event.clientX / view.innerWidth - 0.5) * 2;
    pointerTarget.y = (event.clientY / view.innerHeight - 0.5) * 2;
  };
  const onResize = () => {
    compact();
    scene?.resize();
    start();
  };
  const onScroll = () => {
    const rect = hero.getBoundingClientRect();
    if (rect.bottom >= 0 && rect.top <= view.innerHeight) {
      visible = true;
      start();
    }
  };
  const onVisibility = () => (root.hidden ? stop() : start());
  const observer = view.IntersectionObserver
    ? new view.IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
        if (visible) start();
        else stop();
      })
    : null;

  const enable = () => {
    hero.classList.add("is-immersive");
    root.body.classList.add("immersive-home");
    compact();
    start();
    if (scene || loading) return;
    loading = true;
    loadScene()
      .then(({ mountScene }) => {
        loading = false;
        if (disposed || reduced.matches || scene) return;
        scene = mountScene(stage, { compact: view.innerWidth < 760 });
        hero.classList.add("scene-ready");
        start();
      })
      .catch(() => {
        loading = false;
        hero.classList.add("scene-failed");
      });
  };
  const disable = () => {
    stop();
    scene?.dispose();
    scene = undefined;
    hero.classList.remove("is-immersive", "scene-ready", "labels-active");
    root.body.classList.remove("immersive-home");
    hero.style.cssText = "";
    labels.forEach((label) => (label.style.transform = ""));
    hero.querySelector(".hero-identity")?.removeAttribute("inert");
  };
  const onPreference = () => (reduced.matches ? disable() : enable());

  observer?.observe(hero);
  view.addEventListener("pointermove", onPointer, { passive: true });
  view.addEventListener("scroll", onScroll, { passive: true });
  view.addEventListener("resize", onResize);
  root.addEventListener("visibilitychange", onVisibility);
  reduced.addEventListener?.("change", onPreference);
  onPreference();

  return () => {
    disposed = true;
    disable();
    observer?.disconnect();
    view.removeEventListener("pointermove", onPointer);
    view.removeEventListener("scroll", onScroll);
    view.removeEventListener("resize", onResize);
    root.removeEventListener("visibilitychange", onVisibility);
    reduced.removeEventListener?.("change", onPreference);
  };
}

if (typeof document !== "undefined" && document.querySelector(".hero-scene"))
  mountHero();
