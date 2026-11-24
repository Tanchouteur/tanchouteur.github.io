// Fade-in on scroll. Content is visible by default; the effect only applies
// once JavaScript confirms IntersectionObserver and full motion are available.
let observer;
export function reveal(root = document) {
  const view = root.defaultView || globalThis;
  const elements = root.querySelectorAll("[data-reveal]:not(.is-visible)");
  const show = (element) => element.classList.add("is-visible");
  if (
    !view.IntersectionObserver ||
    typeof view.matchMedia !== "function" ||
    view.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    elements.forEach(show);
    return;
  }
  root.documentElement.classList.add("reveal-ready");
  observer ??= new view.IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        show(entry.target);
        observer.unobserve(entry.target);
      }),
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
  );
  elements.forEach((element, index) => {
    element.style.setProperty("--reveal-delay", `${(index % 3) * 70}ms`);
    // Anything already scrolled past (deep links, reloads) appears at once.
    if (element.getBoundingClientRect().bottom < 0) show(element);
    else observer.observe(element);
  });
}
