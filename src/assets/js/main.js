// navbar.js
window.onload = function() {
    fetch('nav.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('navbar-container').innerHTML = data;
        })
        .catch(err => console.error('Erreur de chargement de la navbar:', err));

    fetch('/src/assets/html/footer.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('footer').innerHTML = data;
        })
        .catch(err => console.error('Erreur de chargement du footer:', err));
};