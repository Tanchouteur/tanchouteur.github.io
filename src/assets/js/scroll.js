function manageNav() {
    if (window.scrollY > 0 && !nav.classList.contains("nav-opaque")) {
        nav.classList.add("nav-opaque");
    } else if (window.scrollY === 0 && nav.classList.contains("nav-opaque")) {
        nav.classList.remove("nav-opaque");
    }
}

window.addEventListener("scroll", () => {
    manageNav();
});