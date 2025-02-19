
// navbar.js
let nav = null;


function addNav(){
    fetch('/assets/html/nav.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('navbar-container').innerHTML = data;
            nav = document.getElementById("navbar");

            navLinkNav();
        })
        .catch(err => console.error('Erreur de chargement de la navbar:', err));
}

function addFooter(){
    fetch('/assets/html/footer.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('footer').innerHTML = data;
        })
        .catch(err => console.error('Erreur de chargement du footer:', err));
}

function navLinkNav() {

    let current = window.location.pathname.split("/").pop();
    let links = document.querySelectorAll("#navbar a");

    links.forEach(link => {
        let linkHref = link.getAttribute("href").split("/").pop();

        if (linkHref === current || (linkHref === "" && current === "index.html")) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });
}
