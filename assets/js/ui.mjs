import {
  escapeHTML as e,
  categoryLabel,
  STATUS_LABELS,
} from "../../lib/portfolio.mjs";

export function media(project, { eager = false } = {}) {
  const { type, accent, background } = project.presentation;
  return `<div class="project-media media-${type}" style="--project-accent:${accent}${background ? `;--project-background:${background}` : ""}">
    <div class="media-fallback" aria-hidden="true"><span>${e(project.title.slice(0, 2).toUpperCase())}</span><i></i><small>${e(project.tags[0] || "Exploration")}</small></div>
    ${project.cover ? `<img src="${e(project.cover)}" alt="Aperçu de ${e(project.title)}" loading="${eager ? "eager" : "lazy"}" decoding="async">` : ""}
    ${type === "interface" ? '<div class="window-chrome" aria-hidden="true"><i></i><i></i><i></i></div>' : ""}
  </div>`;
}
export function card(project, index, selected = false) {
  return `<article class="project-card ${selected ? "selected-card" : ""}">
    <a class="project-image-link" href="/project.html?id=${encodeURIComponent(project.id)}" tabindex="-1" aria-hidden="true">${media(project)}</a>
    <div class="card-meta"><span>${String(index + 1).padStart(2, "0")} / ${e(categoryLabel(project.category))}</span><span>${e(STATUS_LABELS[project.status] || project.status)}</span></div>
    <div class="card-title-row"><h3><a href="/project.html?id=${encodeURIComponent(project.id)}">${e(project.title)}</a></h3><span aria-hidden="true">↗</span></div>
    <p>${e(project.description)}</p>
    <ul class="tag-list" aria-label="Technologies">${project.tags
      .slice(0, 4)
      .map((tag) => `<li>${e(tag)}</li>`)
      .join("")}</ul>
  </article>`;
}
export function bindImageFallbacks(root = document) {
  root.querySelectorAll(".project-media img").forEach((image) => {
    const fail = () => {
      image.hidden = true;
      image.parentElement.classList.add("image-failed");
    };
    image.addEventListener("error", fail, { once: true });
    if (image.complete && image.naturalWidth === 0) fail();
  });
}
