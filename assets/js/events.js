window.onload = function() {
    addNav();
    addFooter();

    window.addEventListener("scroll", () => {
        manageNav();
    });
};

