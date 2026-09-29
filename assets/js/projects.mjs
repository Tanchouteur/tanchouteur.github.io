import {
  normalizeProjects,
  featuredProjects,
  filterProjects,
  categoriesFor,
  escapeHTML as e,
} from "../../lib/portfolio.mjs";
import { card, bindImageFallbacks } from "./ui.mjs";
import { inEnglish } from "../../lib/projects-en.mjs";

export async function initProjects(root = document, fetcher = fetch) {
  const grid = root.querySelector("#project-grid");
  if (!grid) return;
  const language = root.documentElement.lang === "en" ? "en" : "fr";
  const filters = root.querySelector("#project-filters");
  const selection = root.querySelector("#selected-projects");
  const count = root.querySelector("#results-count");
  grid.setAttribute("aria-busy", "true");
  try {
    const response = await fetcher("/assets/data/projects.json");
    if (!response.ok) throw new Error("Catalogue indisponible");
    const normalized = normalizeProjects(await response.json());
    const projects = language === "en" ? inEnglish(normalized) : normalized;
    root.querySelectorAll("[data-project-count]").forEach((element) => {
      element.textContent = String(projects.length).padStart(2, "0");
    });
    const selected = featuredProjects(projects);
    selection.hidden = selected.length === 0;
    selection.querySelector(".selected-grid").innerHTML = selected
      .map((p, i) => card(p, i, true, language))
      .join("");
    filters.innerHTML = categoriesFor(projects, language)
      .map(
        ({ key, label, count }) =>
          `<button type="button" class="filter-button" data-category="${e(key)}" aria-pressed="${key === "All"}">${e(label)} <span>${count}</span></button>`,
      )
      .join("");
    function render(category) {
      const visible = filterProjects(projects, category);
      grid.innerHTML = visible.length
        ? visible.map((p, i) => card(p, i, false, language)).join("")
        : `<p class="empty-state">${language === "en" ? "New projects are coming soon." : "De nouvelles explorations arrivent bientôt."}</p>`;
      count.textContent = language === "en" ? `${visible.length} project${visible.length === 1 ? "" : "s"}` : `${visible.length} projet${visible.length > 1 ? "s" : ""}`;
      filters
        .querySelectorAll("button")
        .forEach((button) =>
          button.setAttribute(
            "aria-pressed",
            String(button.dataset.category === category),
          ),
        );
      bindImageFallbacks(root);
    }
    filters.onclick = (event) => {
      const button = event.target.closest("button[data-category]");
      if (button) render(button.dataset.category);
    };
    render("All");
    if (root === globalThis.document && typeof matchMedia === "function") {
      import("./journey.mjs")
        .then(({ mountJourney }) => mountJourney(projects, root))
        .catch((error) =>
          console.info("Catalogue classique conservé.", error.message),
        );
    }
  } catch {
    selection.hidden = true;
    filters.innerHTML = "";
    count.textContent = "";
    grid.innerHTML = language === "en"
      ? '<div class="empty-state" role="alert"><p>Projects are unavailable right now.</p><button class="button" type="button" id="retry-projects">Try again ↗</button></div>'
      : '<div class="empty-state" role="alert"><p>Les projets ne sont pas disponibles pour le moment.</p><button class="button" type="button" id="retry-projects">Réessayer ↗</button></div>';
    root.querySelector("#retry-projects").onclick = () =>
      initProjects(root, fetcher);
  } finally {
    grid.setAttribute("aria-busy", "false");
  }
}
if (typeof document !== "undefined" && document.querySelector("#project-grid"))
  initProjects();
