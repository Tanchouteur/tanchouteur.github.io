const canvas = document.getElementById("colorCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight * 0.8;

let gradientOffset = 0;

function drawWave() {
    const width = canvas.width;
    const height = canvas.height;

    const gradient = ctx.createLinearGradient(gradientOffset, 0, gradientOffset + width*2.1, 0);

    gradient.addColorStop(0, "rgba(216,255,95,0.32)");
    gradient.addColorStop(0.22, "rgba(220,233,255,0.24)");
    gradient.addColorStop(0.48, "rgba(255,199,152,0.18)");
    gradient.addColorStop(0.72, "rgba(216,255,95,0.22)");
    gradient.addColorStop(1, "rgba(220,233,255,0.22)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const fadeGradient = ctx.createLinearGradient(0, height * 0.6, 0, height);
    fadeGradient.addColorStop(0, "#fff0");
    fadeGradient.addColorStop(1, "rgb(242,240,233)");

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

animateWave();
