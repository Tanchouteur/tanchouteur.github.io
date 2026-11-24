import {
  escapeHTML as e,
  categoryLabel,
  STATUS_LABELS,
} from "../../lib/portfolio.mjs";
const statusLabel = (status, language) =>
  language === "en" ? status : STATUS_LABELS[status] || status;

export function media(project, { eager = false, language = "fr" } = {}) {
  const { type, accent, background } = project.presentation;
  return `<div class="project-media media-${type}${project.cover ? " has-cover" : ""}" style="--project-accent:${accent}${background ? `;--project-background:${background}` : ""}">
    <div class="media-fallback" aria-hidden="true"><span>${e(project.title.slice(0, 2).toUpperCase())}</span><i></i><small>${e(project.tags[0] || "Exploration")}</small></div>
    ${project.cover ? `<img class="media-ambient" src="${e(project.cover)}" alt="" aria-hidden="true" loading="${eager ? "eager" : "lazy"}" decoding="async"><img class="media-cover" src="${e(project.cover)}" alt="${language === "en" ? "Preview of" : "Aperçu de"} ${e(project.title)}" loading="${eager ? "eager" : "lazy"}" decoding="async">` : ""}
    ${type === "interface" ? '<div class="window-chrome" aria-hidden="true"><i></i><i></i><i></i></div>' : ""}
  </div>`;
}
const projectURL = (project, language) =>
  `${language === "en" ? "/en" : ""}/project.html?id=${encodeURIComponent(project.id)}`;
const tags = (project, count = 4) =>
  `<ul class="tag-list" aria-label="Technologies">${project.tags
    .slice(0, count)
    .map((tag) => `<li>${e(tag)}</li>`)
    .join("")}</ul>`;
const year = (project) =>
  /^\d{4}/.test(project.date) ? project.date.slice(0, 4) : "";

export function card(project, index, selected = false, language = "fr") {
  if (selected) return feature(project, index, language);
  const href = projectURL(project, language);
  return `<article class="project-card" style="--project-accent:${project.presentation.accent}" data-reveal>
    <a class="project-image-link tilt" href="${href}" tabindex="-1" aria-hidden="true">${media(project, { language })}<span class="tilt-glare"></span></a>
    <div class="card-meta"><span>${e(categoryLabel(project.category, language))}</span><span class="status status-${e(project.status.toLowerCase().replace(/\s+/g, "-"))}">${e(statusLabel(project.status, language))}</span></div>
    <div class="card-title-row"><h3><a href="${href}">${e(project.title)}</a></h3><span aria-hidden="true">↗</span></div>
    <p>${e(project.description)}</p>
    ${tags(project)}
  </article>`;
}
export function feature(project, index, language = "fr") {
  const href = projectURL(project, language);
  const when = year(project);
  return `<article class="project-card selected-card" style="--project-accent:${project.presentation.accent}" data-reveal>
    <a class="feature-media tilt" href="${href}" tabindex="-1" aria-hidden="true">${media(project, { language, eager: index === 0 })}<span class="tilt-glare"></span></a>
    <div class="feature-copy">
      <span class="feature-index" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span>
      <div class="card-meta"><span>${e(categoryLabel(project.category, language))}</span>${when ? `<span>${when}</span>` : ""}<span class="status status-${e(project.status.toLowerCase().replace(/\s+/g, "-"))}">${e(statusLabel(project.status, language))}</span></div>
      <h3><a href="${href}">${e(project.title)}</a></h3>
      <p>${e(project.description)}</p>
      ${tags(project, 5)}
      <span class="feature-cta" aria-hidden="true">${language === "en" ? "View case study" : "Découvrir le projet"} <i>→</i></span>
    </div>
  </article>`;
}
// Gentle 3D tilt that follows the pointer; skipped for touch and reduced motion.
export function bindTilt(root = document) {
  const view = root.defaultView || globalThis;
  if (
    typeof view.matchMedia !== "function" ||
    view.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    !view.matchMedia("(hover: hover)").matches
  )
    return;
  root.querySelectorAll(".tilt:not([data-tilt-bound])").forEach((element) => {
    element.dataset.tiltBound = "";
    const host = element.closest(".project-card") || element;
    host.addEventListener("pointermove", (event) => {
      const rect = element.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      element.style.setProperty("--ry", `${(x * 9).toFixed(2)}deg`);
      element.style.setProperty("--rx", `${(-y * 7).toFixed(2)}deg`);
      element.style.setProperty("--gx", `${((x + 0.5) * 100).toFixed(1)}%`);
      element.style.setProperty("--gy", `${((y + 0.5) * 100).toFixed(1)}%`);
      element.classList.add("is-tilting");
    });
    host.addEventListener("pointerleave", () => {
      element.classList.remove("is-tilting");
      element.style.setProperty("--rx", "0deg");
      element.style.setProperty("--ry", "0deg");
    });
  });
}
export function bindImageFallbacks(root = document) {
  root.querySelectorAll(".project-media img").forEach((image) => {
    const fail = () => {
      image.parentElement.querySelectorAll("img").forEach((item) => {
        item.hidden = true;
      });
      image.parentElement.classList.add("image-failed");
    };
    image.addEventListener("error", fail, { once: true });
    if (image.complete && image.naturalWidth === 0) fail();
  });
  root.querySelectorAll(".project-media .media-cover").forEach((image) => {
    const fitFrame = () => {
      if (!image.naturalWidth || !image.naturalHeight) return;
      image.parentElement.style.setProperty(
        "--media-ratio",
        `${image.naturalWidth} / ${image.naturalHeight}`,
      );
      image.parentElement.style.setProperty(
        "--media-ratio-value",
        String(image.naturalWidth / image.naturalHeight),
      );
      image.parentElement.classList.add("media-ratio-ready");
    };
    image.addEventListener("load", fitFrame, { once: true });
    if (image.complete && image.naturalWidth > 0) fitFrame();
  });
}
