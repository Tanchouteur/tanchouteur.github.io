const canvas = document.getElementById("colorCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight * 0.7;

let gradientOffset = 0;

function drawWave() {
    const width = canvas.width;
    const height = canvas.height;

    const gradient = ctx.createLinearGradient(gradientOffset, 0, gradientOffset + width, 0);

    gradient.addColorStop(0, "rgba(250,119,12,0.2)");
    gradient.addColorStop(0.5, "rgba(215,221,30,0.2)");
    gradient.addColorStop(1, "rgba(31,232,34,0.2)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const fadeGradient = ctx.createLinearGradient(0, height * 0.6, 0, height);
    fadeGradient.addColorStop(0, "#fff1");
    fadeGradient.addColorStop(1, "#efe3dc");

    ctx.fillStyle = fadeGradient;
    ctx.fillRect(0, height * 0.6, width, height);
}

function animateWave() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawWave();

    gradientOffset -= 1;
    if (gradientOffset < -canvas.width) {
        gradientOffset = 0;
    }
    requestAnimationFrame(animateWave);
}

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight * 0.7;
});

animateWave();


const nav = document.querySelector("nav");
window.addEventListener("scroll" , (e) => {
    console.log(e.target);
    if (e.target.scrollTop > 0 && !nav.classList.contains("nav-opaque")) {
        nav.classList.add("nav-opaque");
    }else if (e.target.scrollTop === 0 && nav.classList.contains("nav-opaque")){
        nav.classList.remove("nav-opaque");
    }
});

