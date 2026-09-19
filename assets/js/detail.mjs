import { marked } from "marked";
import createDOMPurify from "dompurify";
import {
  normalizeProjects,
  categoryLabel,
  STATUS_LABELS,
  captionFor,
  escapeHTML as e,
} from "../../lib/portfolio.mjs";
import { media, bindImageFallbacks } from "./ui.mjs";

export async function initDetail(
  root = document,
  fetcher = fetch,
  search = location.search,
) {
  const target = root.querySelector("#project-detail");
  if (!target) return;
  const id = new URLSearchParams(search).get("id");
  const error = (message) => {
    target.innerHTML = `<div class="detail-error"><p class="eyebrow">Projet indisponible</p><h1>${e(message)}</h1><a class="button" href="/index.html#projects">Parcourir les projets ↗</a></div>`;
  };
  if (!id) {
    error("Quel projet souhaitez-vous découvrir ?");
    return;
  }
  try {
    const response = await fetcher("/assets/data/projects.json");
    if (!response.ok) throw new Error("Catalogue indisponible");
    const project = normalizeProjects(await response.json()).find(
      (p) => p.id === id,
    );
    if (!project) {
      error("Ce projet n’est plus dans l’atelier.");
      return;
    }
    root.title = `${project.title} — Louis Tanchou`;
    root
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", project.description);
    root
      .querySelector('meta[property="og:title"]')
      ?.setAttribute("content", root.title);
    root
      .querySelector('meta[property="og:description"]')
      ?.setAttribute("content", project.description);
    const purifier = createDOMPurify(root.defaultView);
    const description = purifier.sanitize(
      marked.parse(project.longDescription),
      {
        USE_PROFILES: { html: true },
        FORBID_TAGS: ["style", "form", "input", "button", "iframe"],
        FORBID_ATTR: ["style"],
      },
    );
    const linkLabels = {
      github: "Code source",
      demo: "Démo",
      website: "Visiter le site",
      docs: "Documentation",
    };
    target.innerHTML = `<header class="detail-heading"><div class="eyebrow">${e(categoryLabel(project.category))} <span>/</span> ${e(project.date)} <span>/</span> ${e(STATUS_LABELS[project.status] || project.status)}</div><h1>${e(project.title)}</h1><p class="detail-intro">${e(project.description)}</p><div class="detail-links">${Object.entries(
      project.links,
    )
      .map(
        ([key, href]) =>
          `<a class="button ${key === "github" ? "" : "button-dark"}" href="${e(href)}" target="_blank" rel="noopener noreferrer">${e(linkLabels[key] || key)} ↗</a>`,
      )
      .join("")}</div></header>
      <div class="detail-cover">${media(project, { eager: true })}</div>
      <div class="detail-body"><aside><p class="eyebrow">Les outils du projet</p><ul class="tag-list">${project.tags.map((tag) => `<li>${e(tag)}</li>`).join("")}</ul></aside><div class="prose markdown">${description || "<h2>Une idée devenue projet.</h2><p>Découvrez sa réalisation à travers les médias et les liens disponibles sur cette page.</p>"}</div></div>
      ${project.images.length ? `<section class="project-gallery"><div class="section-heading"><div><p class="eyebrow">Dans les détails</p><h2>Quelques<br><em>points de vue.</em></h2></div><span>${String(project.images.length).padStart(2, "0")} VUES</span></div><div class="gallery-grid">${project.images.map((path, index) => `<figure><button class="gallery-item" data-image="${index}" aria-label="Agrandir : ${e(captionFor(project, path, index))}"><img src="${e(path)}" alt="${e(captionFor(project, path, index))}" loading="lazy"><span aria-hidden="true">↗</span></button><figcaption><span>${String(index + 1).padStart(2, "0")}</span> ${e(captionFor(project, path, index))}</figcaption></figure>`).join("")}</div></section>` : ""}
      <div class="detail-end"><a class="text-link" href="/index.html#projects">← Toutes les explorations</a><a class="text-link" href="/contact.html">Parlons ensemble ↗</a></div>`;
    target
      .querySelectorAll(
        ".markdown h1, .markdown h2, .markdown h3, .markdown h4, .markdown h5",
      )
      .forEach((heading) => {
        const replacement = root.createElement(
          `h${Number(heading.tagName[1]) + 1}`,
        );
        replacement.innerHTML = heading.innerHTML;
        heading.replaceWith(replacement);
      });
    target.querySelectorAll(".markdown a").forEach((link) => {
      link.rel = "noopener noreferrer";
    });
    bindImageFallbacks(root);
    setupGallery(root, project);
  } catch {
    error("L’atelier est momentanément indisponible.");
  }
}

function setupGallery(root, project) {
  const dialog = root.querySelector("#gallery-dialog");
  const image = root.querySelector("#dialog-image");
  const caption = root.querySelector("#dialog-caption");
  if (!dialog) return;
  let current = 0;
  let opener;
  const show = (index) => {
    current = (index + project.images.length) % project.images.length;
    image.src = project.images[current];
    image.alt = captionFor(project, project.images[current], current);
    image.hidden = false;
    caption.textContent = `${current + 1} / ${project.images.length} — ${image.alt}`;
  };
  root.querySelectorAll(".gallery-item").forEach((button) => {
    button.querySelector("img").addEventListener("error", (event) => {
      event.target.hidden = true;
      button.classList.add("gallery-missing");
      button.disabled = true;
      button.setAttribute("aria-label", "Image indisponible");
    });
    button.addEventListener("click", () => {
      opener = button;
      show(Number(button.dataset.image));
      dialog.showModal();
    });
  });
  root.querySelector("#gallery-prev").onclick = () => show(current - 1);
  root.querySelector("#gallery-next").onclick = () => show(current + 1);
  image.onerror = () => {
    image.hidden = true;
    caption.textContent = "Cette image est indisponible.";
  };
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      show(current - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      show(current + 1);
    }
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => opener?.focus());
}
if (
  typeof document !== "undefined" &&
  document.querySelector("#project-detail")
)
  initDetail();
