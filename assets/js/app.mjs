import "../css/atelier.css";

const menu = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#navigation");
menu?.addEventListener("click", () => {
  const open = menu.getAttribute("aria-expanded") !== "true";
  menu.setAttribute("aria-expanded", String(open));
  navigation.classList.toggle("is-open", open);
});
document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    menu?.getAttribute("aria-expanded") === "true"
  ) {
    menu.setAttribute("aria-expanded", "false");
    navigation.classList.remove("is-open");
    menu.focus();
  }
});
navigation?.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    menu.setAttribute("aria-expanded", "false");
    navigation.classList.remove("is-open");
  }
});
const current = location.pathname.split("/").pop() || "index.html";
document.querySelectorAll("#navigation a").forEach((link) => {
  if (
    (link.getAttribute("href").split("#")[0].split("/").pop() ||
      "index.html") === current
  )
    link.setAttribute("aria-current", "page");
});
document.querySelectorAll("[data-year]").forEach((element) => {
  element.textContent = new Date().getFullYear();
});
