import {
  journeyState,
  panelPose,
  snapStation,
  snapProgress,
} from "../../lib/journey.mjs";
import { media, bindImageFallbacks } from "./ui.mjs";
import { categoryLabel, escapeHTML as e } from "../../lib/portfolio.mjs";

export function mountJourney(projects, root = document, options = {}) {
  const view = root.defaultView;
  const loadScene = options.loadScene || (() => import("./scene.mjs"));
  const hero = root.querySelector(".hero");
  if (!hero || root.querySelector(".journey-shell")) return () => {};
  const preference = view.matchMedia("(prefers-reduced-motion: reduce)");
  const selected = projects.filter((p) => p.featured).slice(0, 3);
  const stops = selected.length ? selected : projects.slice(0, 3);
  const shell = root.createElement("section");
  shell.className = "journey-shell";
  shell.setAttribute("aria-label", "De la surface aux projets");
  const originalHTML = hero.innerHTML;
  const originalClass = hero.className;
  const originalParent = hero.parentElement;
  originalParent.insertBefore(shell, hero);
  shell.innerHTML = `<div class="journey-viewport"><div class="journey-environment" aria-hidden="true"></div><div class="journey-stage"></div><div class="journey-hud"><span class="depth-label">SURFACE / 00</span><div class="depth-track"><i></i></div><a href="#projects">Accès direct aux projets ↗</a></div></div>`;
  const stage = shell.querySelector(".journey-stage");
  stage.append(hero);
  hero.classList.add("journey-panel", "journey-intro");
  hero.querySelector(".hero-art").innerHTML =
    `<div class="identity-sculpture"><div class="identity-frame"><img src="/assets/images/pp.jpeg" alt="Louis Tanchou"><span>LOUIS / TANCHOU</span></div><span class="identity-chip chip-software">DÉVELOPPEUR</span><span class="identity-chip chip-systems">SYSTÈMES & LOGICIELS</span><span class="identity-chip chip-curiosity">ENSIIE / EDF R&D</span></div>`;
  hero.querySelectorAll('a[href="#projects"]').forEach((link) => {
    link.href = "#journey-start";
  });
  const start = root.createElement("span");
  start.id = "journey-start";
  start.className = "journey-start";
  shell.append(start);
  stops.forEach((project, index) => {
    const panel = root.createElement("article");
    panel.className = "journey-panel journey-project";
    panel.innerHTML = `<div class="journey-project-copy"><p class="eyebrow">STRATE ${String(index + 1).padStart(2, "0")} / ${e(categoryLabel(project.category))}</p><h2>${e(project.title)}</h2><p>${e(project.description)}</p><ul class="tag-list">${project.tags
      .slice(0, 4)
      .map((tag) => `<li>${e(tag)}</li>`)
      .join(
        "",
      )}</ul><a class="button" href="/project.html?id=${encodeURIComponent(project.id)}">Découvrir le projet ↗</a></div><div class="journey-project-object">${media(project, { eager: index === 0 })}<div class="panel-edge" aria-hidden="true"></div><span class="object-caption">EXPLORATION / ${String(index + 1).padStart(2, "0")}</span></div>`;
    stage.append(panel);
  });
  const outro = root.createElement("div");
  outro.className = "journey-panel journey-outro";
  outro.innerHTML =
    '<p class="eyebrow">Sous la surface, des idées prennent forme.</p><h2>Bienvenue<br>dans <em>l’atelier.</em></h2><a class="button" href="#projects">Toutes les explorations ↓</a>';
  stage.append(outro);
  const panels = [...stage.children];
  const selection = root.querySelector("#selected-projects");
  let frame = 0,
    scene,
    disposed = false,
    visible = true,
    pointerX = 0,
    pointerY = 0;
  let lastActive = -1,
    lastCamera = 0,
    anchorTop = "";
  const progressBar = shell.querySelector(".depth-track i");
  const depthLabel = shell.querySelector(".depth-label");
  let settleTimer,
    snapFrame = 0,
    snapping = false,
    suppressUntil = 0;
  let previousScroll = view.scrollY,
    direction = 1;
  const settle = () => {
    view.clearTimeout(settleTimer);
    if (
      disposed ||
      preference.matches ||
      snapping ||
      Date.now() < suppressUntil
    )
      return;
    const top = shell.getBoundingClientRect().top + view.scrollY;
    const travel = shell.offsetHeight - view.innerHeight;
    const target = snapStation(
      view.scrollY - top,
      travel,
      panels.length,
      direction,
    );
    if (target === null || Math.abs(top + target - view.scrollY) < 2) return;
    snapping = true;
    const from = view.scrollY;
    const to = top + target;
    const duration = Math.min(850, 380 + Math.abs(to - from) * 0.25);
    const began = view.performance.now();
    const step = (now) => {
      if (!snapping || disposed || preference.matches) return;
      const progress = snapProgress(now - began, duration);
      view.scrollTo({
        top: from + (to - from) * progress,
        behavior: "instant",
      });
      if (progress < 1) snapFrame = view.requestAnimationFrame(step);
      else {
        snapping = false;
        snapFrame = 0;
        previousScroll = to;
        suppressUntil = Date.now() + 100;
      }
    };
    snapFrame = view.requestAnimationFrame(step);
  };
  const interrupt = () => {
    view.cancelAnimationFrame(snapFrame);
    snapFrame = 0;
    snapping = false;
    view.clearTimeout(settleTimer);
  };

  const scrollGesture = () => {
    if (!snapping) {
      direction = view.scrollY >= previousScroll ? 1 : -1;
      view.clearTimeout(settleTimer);
      settleTimer = view.setTimeout(settle, 140);
    }
    previousScroll = view.scrollY;
  };
  const scrollEnd = () => {
    if (!snapping) {
      view.clearTimeout(settleTimer);
      settleTimer = view.setTimeout(settle, 80);
    }
  };
  const followAnchor = (event) => {
    if (event.target.closest("a")) {
      interrupt();
      suppressUntil = Date.now() + 1500;
      view.clearTimeout(settleTimer);
    }
  };
  const render = () => {
    frame = 0;
    if (disposed || preference.matches) return;
    const rect = shell.getBoundingClientRect();
    const state = journeyState(
      -rect.top,
      shell.offsetHeight - view.innerHeight,
      panels.length,
    );
    lastCamera = state.camera;
    const nextAnchorTop = `${(shell.offsetHeight - view.innerHeight) / (panels.length - 1)}px`;
    if (nextAnchorTop !== anchorTop)
      start.style.top = anchorTop = nextAnchorTop;
    shell.style.setProperty("--depth", state.darkness);
    shell.style.setProperty("--pointer-x", `${pointerX}deg`);
    shell.style.setProperty("--pointer-y", `${pointerY}deg`);
    panels.forEach((panel, index) => {
      const pose = panelPose(index, state.camera);
      const shown = pose.opacity > 0.001;
      if (!shown && panel.style.visibility === "hidden") return;
      panel.style.willChange = shown ? "transform, opacity" : "auto";
      panel.style.transform = `translate3d(0,${pose.y}px,${pose.z}px) rotateX(${pose.rotateX}deg)`;
      panel.style.opacity = pose.opacity;
      panel.style.visibility = pose.opacity > 0.001 ? "visible" : "hidden";
      panel.inert = !pose.interactive;
    });
    progressBar.style.transform = `scaleY(${state.progress})`;
    if (lastActive !== state.active) {
      depthLabel.textContent = state.active
        ? `SOUS LA SURFACE / ${String(state.active).padStart(2, "0")}`
        : "SURFACE / 00";
      lastActive = state.active;
    }
    scene?.update(state, pointerX, pointerY);
  };
  const request = () => {
    if (!frame && visible && !root.hidden)
      frame = view.requestAnimationFrame(render);
  };
  const pointer = (event) => {
    if (event.pointerType === "touch" || lastCamera > 0.7) return;
    pointerX = (event.clientX / view.innerWidth - 0.5) * 5;
    pointerY = (event.clientY / view.innerHeight - 0.5) * -4;
    request();
  };
  const change = () => {
    hero
      .querySelectorAll('a[href="#journey-start"], a[href="#projects"]')
      .forEach((link) => {
        link.setAttribute(
          "href",
          preference.matches ? "#projects" : "#journey-start",
        );
      });
    shell.classList.toggle("is-immersive", !preference.matches);
    root.body.classList.toggle("immersive-home", !preference.matches);
    shell.style.setProperty(
      "--journey-height",
      `${panels.length * 125 + 100}svh`,
    );
    if (selection) selection.hidden = !preference.matches || !selected.length;
    if (preference.matches) {
      interrupt();
      panels.forEach((panel) => {
        panel.style.cssText = "";
        panel.inert = false;
      });
      scene?.dispose();
      scene = undefined;
    } else {
      request();
      loadScene()
        .then(({ mountScene }) => {
          if (disposed || preference.matches || scene) return;
          scene = mountScene(
            shell.querySelector(".journey-environment"),
            panels.length,
          );
          request();
        })
        .catch(() => {});
    }
  };
  const observer = new view.IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    request();
  });
  observer.observe(shell);
  view.addEventListener("scroll", request, { passive: true });
  view.addEventListener("scroll", scrollGesture, { passive: true });
  view.addEventListener("scrollend", scrollEnd);
  const interruptKeys = (event) => {
    if (
      [
        "ArrowDown",
        "ArrowUp",
        "PageDown",
        "PageUp",
        "Home",
        "End",
        " ",
      ].includes(event.key)
    )
      interrupt();
  };
  view.addEventListener("wheel", interrupt, { passive: true });
  view.addEventListener("touchstart", interrupt, { passive: true });
  view.addEventListener("pointerdown", interrupt, { passive: true });
  view.addEventListener("keydown", interruptKeys);
  root.addEventListener("click", followAnchor);
  view.addEventListener("resize", request);
  shell.addEventListener("pointermove", pointer);
  root.addEventListener("visibilitychange", request);
  preference.addEventListener("change", change);
  bindImageFallbacks(shell);
  change();
  return () => {
    disposed = true;
    root.body.classList.remove("immersive-home");
    view.cancelAnimationFrame(frame);
    view.clearTimeout(settleTimer);
    interrupt();
    view.removeEventListener("wheel", interrupt);
    view.removeEventListener("touchstart", interrupt);
    view.removeEventListener("pointerdown", interrupt);
    view.removeEventListener("keydown", interruptKeys);
    view.removeEventListener("scroll", scrollGesture);
    view.removeEventListener("scrollend", scrollEnd);
    root.removeEventListener("click", followAnchor);
    observer.disconnect();
    scene?.dispose();
    originalParent.insertBefore(hero, shell);
    hero.innerHTML = originalHTML;
    hero.className = originalClass;
    hero.style.cssText = "";
    hero.inert = false;
    shell.remove();
    if (selection) selection.hidden = !selected.length;
    view.removeEventListener("scroll", request);
    view.removeEventListener("resize", request);
    shell.removeEventListener("pointermove", pointer);
    root.removeEventListener("visibilitychange", request);
    preference.removeEventListener("change", change);
  };
}
