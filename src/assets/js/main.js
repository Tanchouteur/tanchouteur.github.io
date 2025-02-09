// navbar.js
let nav = null;
window.onload = function() {
    fetch('nav.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('navbar-container').innerHTML = data;
            nav = document.getElementById("navbar");
        })
        .catch(err => console.error('Erreur de chargement de la navbar:', err));
    manageNav();
};

    fetch('/src/assets/html/footer.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('footer').innerHTML = data;
        })
        .catch(err => console.error('Erreur de chargement du footer:', err));
};