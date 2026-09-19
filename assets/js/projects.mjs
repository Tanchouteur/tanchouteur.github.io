import {
  normalizeProjects,
  featuredProjects,
  filterProjects,
  categoriesFor,
  escapeHTML as e,
} from "../../lib/portfolio.mjs";
import { card, bindImageFallbacks } from "./ui.mjs";

export async function initProjects(root = document, fetcher = fetch) {
  const grid = root.querySelector("#project-grid");
  if (!grid) return;
  const filters = root.querySelector("#project-filters");
  const selection = root.querySelector("#selected-projects");
  const count = root.querySelector("#results-count");
  grid.setAttribute("aria-busy", "true");
  try {
    const response = await fetcher("/assets/data/projects.json");
    if (!response.ok) throw new Error("Catalogue indisponible");
    const projects = normalizeProjects(await response.json());
    root.querySelectorAll("[data-project-count]").forEach((element) => {
      element.textContent = String(projects.length).padStart(2, "0");
    });
    const selected = featuredProjects(projects);
    selection.hidden = selected.length === 0;
    selection.querySelector(".selected-grid").innerHTML = selected
      .map((p, i) => card(p, i, true))
      .join("");
    filters.innerHTML = categoriesFor(projects)
      .map(
        ({ key, label, count }) =>
          `<button type="button" class="filter-button" data-category="${e(key)}" aria-pressed="${key === "All"}">${e(label)} <span>${count}</span></button>`,
      )
      .join("");
    function render(category) {
      const visible = filterProjects(projects, category);
      grid.innerHTML = visible.length
        ? visible.map((p, i) => card(p, i)).join("")
        : '<p class="empty-state">De nouvelles explorations arrivent bientôt.</p>';
      count.textContent = `${visible.length} projet${visible.length > 1 ? "s" : ""}`;
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
    grid.innerHTML =
      '<div class="empty-state" role="alert"><p>Les projets ne sont pas disponibles pour le moment.</p><button class="button" type="button" id="retry-projects">Réessayer ↗</button></div>';
    root.querySelector("#retry-projects").onclick = () =>
      initProjects(root, fetcher);
  } finally {
    grid.setAttribute("aria-busy", "false");
  }
}
if (typeof document !== "undefined" && document.querySelector("#project-grid"))
  initProjects();
