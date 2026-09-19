export const COPPER = "#9a4c32";
export const CATEGORY_LABELS = {
  Personal: "Personnel",
  Academic: "Académique",
  Professional: "Professionnel",
};
export const STATUS_LABELS = {
  "In Progress": "En cours",
  Completed: "Terminé",
  Archived: "Archivé",
};
export const text = (value) => (typeof value === "string" ? value : "");
export const escapeHTML = (value) =>
  text(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function safeURL(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}
export function mediaPath(value) {
  if (
    typeof value !== "string" ||
    !/^assets\/images\/(?:Projects|projects)\/[^?#]+$/i.test(value)
  )
    return "";
  if (
    value.split("/").some((segment) => segment === ".." || segment === ".") ||
    /[<>"'\\\u0000-\u001f]/.test(value)
  )
    return "";
  return (
    "/" +
    value.replace(/^assets\/images\/projects\//i, "assets/images/Projects/")
  );
}
export function normalizePresentation(value) {
  const input = value && typeof value === "object" ? value : {};
  const captions = Object.fromEntries(
    Object.entries(
      input.captions && typeof input.captions === "object"
        ? input.captions
        : {},
    ).filter(([key, value]) => !key.includes("/") && typeof value === "string"),
  );
  return {
    type: ["neutral", "interface", "photo", "diagram"].includes(input.type)
      ? input.type
      : "neutral",
    accent:
      typeof input.accent === "string" && /^#[\da-f]{6}$/i.test(input.accent)
        ? input.accent
        : COPPER,
    background:
      typeof input.background === "string" &&
      /^#[\da-f]{6}$/i.test(input.background)
        ? input.background
        : "",
    captions,
  };
}
export function normalizeProject(input) {
  if (!input || typeof input !== "object" || !text(input.id)) return null;
  const seenLinks = new Set();
  const links = Object.fromEntries(
    Object.entries(input.links || {})
      .map(([key, value]) => [key, safeURL(value)])
      .filter(
        ([, value]) => value && !seenLinks.has(value) && seenLinks.add(value),
      ),
  );
  if (input.repoData?.isPrivate) delete links.github;
  return {
    id: input.id,
    title: text(input.title) || input.id,
    description: text(input.description),
    longDescription: text(input.longDescription),
    category: text(input.category) || "Personal",
    status: text(input.status) || "Completed",
    date: text(input.date),
    featured: input.featured === true,
    order:
      typeof input.order === "number" && Number.isFinite(input.order)
        ? input.order
        : 999,
    tags: Array.isArray(input.tags)
      ? input.tags.filter((tag) => typeof tag === "string")
      : [],
    cover: mediaPath(input.cover),
    images: Array.isArray(input.images)
      ? input.images.map(mediaPath).filter(Boolean)
      : [],
    links,
    presentation: normalizePresentation(input.presentation),
  };
}
export function normalizeProjects(input) {
  if (!Array.isArray(input))
    throw new Error("Le catalogue doit être une liste.");
  const seen = new Set();
  return input
    .map(normalizeProject)
    .filter((p) => p && !seen.has(p.id) && seen.add(p.id))
    .sort((a, b) => a.order - b.order || b.date.localeCompare(a.date));
}
export const featuredProjects = (projects) =>
  projects.filter((project) => project.featured).slice(0, 3);
export const filterProjects = (projects, category) =>
  category === "All"
    ? projects
    : projects.filter((project) => project.category === category);
export const categoryLabel = (category) =>
  CATEGORY_LABELS[category] || category;
export function categoriesFor(projects) {
  return ["All", ...new Set(projects.map((project) => project.category))].map(
    (key) => ({
      key,
      label: key === "All" ? "Tous" : categoryLabel(key),
      count: filterProjects(projects, key).length,
    }),
  );
}
export function captionFor(project, path, index) {
  return (
    project.presentation.captions[path.split("/").pop()] ||
    `${project.title} — vue ${index + 1}`
  );
}
