const canvas = document.getElementById("colorCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight * 0.8;

let gradientOffset = 0;

function drawWave() {
    const width = canvas.width;
    const height = canvas.height;

    const gradient = ctx.createLinearGradient(gradientOffset, 0, gradientOffset + width*2.1, 0);

    gradient.addColorStop(0, "rgba(250,119,12,0.15)");
    gradient.addColorStop(0.125, "rgba(221,193,9,0.15)");
    gradient.addColorStop(0.25, "rgba(31,232,34,0.15)");
    gradient.addColorStop(0.5, "rgba(250,119,12,0.15)");
    gradient.addColorStop(0.625, "rgba(221,193,9,0.15)");
    gradient.addColorStop(0.75, "rgba(31,232,34,0.15)");
    gradient.addColorStop(1, "rgba(250,119,12,0.15)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const fadeGradient = ctx.createLinearGradient(0, height * 0.6, 0, height);
    fadeGradient.addColorStop(0, "#fff0");
    fadeGradient.addColorStop(1, "rgb(239,227,220)");

    ctx.fillStyle = fadeGradient;
    ctx.fillRect(0, height * 0.6, width, height);
}

function animateWave() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawWave();

    gradientOffset -= 2;
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