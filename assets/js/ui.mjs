import {
  escapeHTML as e,
  categoryLabel,
  STATUS_LABELS,
} from "../../lib/portfolio.mjs";
const statusLabel = (status, language) => language === "en" ? status : STATUS_LABELS[status] || status;

export function media(project, { eager = false, language = "fr" } = {}) {
  const { type, accent, background } = project.presentation;
  return `<div class="project-media media-${type}${project.cover ? " has-cover" : ""}" style="--project-accent:${accent}${background ? `;--project-background:${background}` : ""}">
    <div class="media-fallback" aria-hidden="true"><span>${e(project.title.slice(0, 2).toUpperCase())}</span><i></i><small>${e(project.tags[0] || "Exploration")}</small></div>
    ${project.cover ? `<img class="media-ambient" src="${e(project.cover)}" alt="" aria-hidden="true" loading="${eager ? "eager" : "lazy"}" decoding="async"><img class="media-cover" src="${e(project.cover)}" alt="${language === "en" ? "Preview of" : "Aperçu de"} ${e(project.title)}" loading="${eager ? "eager" : "lazy"}" decoding="async">` : ""}
    ${type === "interface" ? '<div class="window-chrome" aria-hidden="true"><i></i><i></i><i></i></div>' : ""}
  </div>`;
}
export function card(project, index, selected = false, language = "fr") {
  const prefix = language === "en" ? "/en" : "";
  return `<article class="project-card ${selected ? "selected-card" : ""}">
    <a class="project-image-link" href="${prefix}/project.html?id=${encodeURIComponent(project.id)}" tabindex="-1" aria-hidden="true">${media(project, { language })}</a>
    <div class="card-meta"><span>${String(index + 1).padStart(2, "0")} / ${e(categoryLabel(project.category, language))}</span><span>${e(statusLabel(project.status, language))}</span></div>
    <div class="card-title-row"><h3><a href="${prefix}/project.html?id=${encodeURIComponent(project.id)}">${e(project.title)}</a></h3><span aria-hidden="true">↗</span></div>
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
