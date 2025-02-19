window.onload = function() {
    addNav();
    addFooter();

    window.addEventListener("scroll", () => {
        manageNav();
    });

    window.addEventListener("resize", () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight * 0.7;
    });
};

