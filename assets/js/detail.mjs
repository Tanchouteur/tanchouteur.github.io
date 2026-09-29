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
import { inEnglish } from "../../lib/projects-en.mjs";

const english = {
  unavailable: "Project unavailable", browse: "Browse projects ↗", which: "Which project would you like to explore?", gone: "This project is no longer in the workshop.", offline: "The workshop is temporarily unavailable.",
  github: "Source code", demo: "Demo", website: "Visit website", docs: "Documentation", tools: "Project tools", details: "In detail", views: "Views", viewpoints: "Some<br><em>perspectives.</em>", enlarge: "Enlarge", all: "← All projects", contact: "Get in touch ↗", missing: "Image unavailable", missingDetail: "<h2>An idea turned into a project.</h2><p>Explore the media and links on this page to learn more.</p>", imageMissing: "This image is unavailable.",
};

export async function initDetail(
  root = document,
  fetcher = fetch,
  search = location.search,
) {
  const target = root.querySelector("#project-detail");
  if (!target) return;
  const language = root.documentElement.lang === "en" ? "en" : "fr";
  const en = language === "en";
  const path = en ? "/en" : "";
  const id = new URLSearchParams(search).get("id");
  const error = (message) => {
    target.innerHTML = `<div class="detail-error"><p class="eyebrow">${en ? english.unavailable : "Projet indisponible"}</p><h1>${e(message)}</h1><a class="button" href="${path}/index.html#projects">${en ? english.browse : "Parcourir les projets ↗"}</a></div>`;
  };
  if (!id) {
    error(en ? english.which : "Quel projet souhaitez-vous découvrir ?");
    return;
  }
  try {
    const response = await fetcher("/assets/data/projects.json");
    if (!response.ok) throw new Error("Catalogue indisponible");
    const normalized = normalizeProjects(await response.json());
    const project = (en ? inEnglish(normalized) : normalized).find(
      (p) => p.id === id,
    );
    if (!project) {
      error(en ? english.gone : "Ce projet n’est plus dans l’atelier.");
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
      github: en ? english.github : "Code source",
      demo: en ? english.demo : "Démo",
      website: en ? english.website : "Visiter le site",
      docs: "Documentation",
    };
    target.innerHTML = `<header class="detail-heading"><div class="eyebrow">${e(categoryLabel(project.category, language))} <span>/</span> ${e(project.date)} <span>/</span> ${e(en ? project.status : STATUS_LABELS[project.status] || project.status)}</div><h1>${e(project.title)}</h1><p class="detail-intro">${e(project.description)}</p><div class="detail-links">${Object.entries(
      project.links,
    )
      .map(
        ([key, href]) =>
          `<a class="button ${key === "github" ? "" : "button-dark"}" href="${e(href)}" target="_blank" rel="noopener noreferrer">${e(linkLabels[key] || key)} ↗</a>`,
      )
      .join("")}</div></header>
      <div class="detail-cover">${media(project, { eager: true, language })}</div>
      <div class="detail-body"><aside><p class="eyebrow">${en ? english.tools : "Les outils du projet"}</p><ul class="tag-list">${project.tags.map((tag) => `<li>${e(tag)}</li>`).join("")}</ul></aside><div class="prose markdown">${description || (en ? english.missingDetail : "<h2>Une idée devenue projet.</h2><p>Découvrez sa réalisation à travers les médias et les liens disponibles sur cette page.</p>")}</div></div>
      ${project.images.length ? `<section class="project-gallery"><div class="section-heading"><div><p class="eyebrow">${en ? english.details : "Dans les détails"}</p><h2>${en ? english.viewpoints : "Quelques<br><em>points de vue.</em>"}</h2></div><span>${String(project.images.length).padStart(2, "0")} ${en ? english.views : "VUES"}</span></div><div class="gallery-grid">${project.images.map((imagePath, index) => `<figure><button class="gallery-item" data-image="${index}" aria-label="${en ? english.enlarge : "Agrandir"} : ${e(captionFor(project, imagePath, index, language))}"><img src="${e(imagePath)}" alt="${e(captionFor(project, imagePath, index, language))}" loading="lazy"><span aria-hidden="true">↗</span></button><figcaption><span>${String(index + 1).padStart(2, "0")}</span> ${e(captionFor(project, imagePath, index, language))}</figcaption></figure>`).join("")}</div></section>` : ""}
      <div class="detail-end"><a class="text-link" href="${path}/index.html#projects">${en ? english.all : "← Toutes les explorations"}</a><a class="text-link" href="${path}/contact.html">${en ? english.contact : "Parlons ensemble ↗"}</a></div>`;
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
    setupGallery(root, project, language);
  } catch {
    error(en ? english.offline : "L’atelier est momentanément indisponible.");
  }
}

function setupGallery(root, project, language = "fr") {
  const dialog = root.querySelector("#gallery-dialog");
  const image = root.querySelector("#dialog-image");
  const caption = root.querySelector("#dialog-caption");
  if (!dialog) return;
  let current = 0;
  let opener;
  const show = (index) => {
    current = (index + project.images.length) % project.images.length;
    image.src = project.images[current];
    image.alt = captionFor(project, project.images[current], current, language);
    image.hidden = false;
    caption.textContent = `${current + 1} / ${project.images.length} — ${image.alt}`;
  };
  root.querySelectorAll(".gallery-item").forEach((button) => {
    button.querySelector("img").addEventListener("error", (event) => {
      event.target.hidden = true;
      button.classList.add("gallery-missing");
      button.disabled = true;
      button.setAttribute("aria-label", language === "en" ? english.missing : "Image indisponible");
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
    caption.textContent = language === "en" ? english.imageMissing : "Cette image est indisponible.";
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
