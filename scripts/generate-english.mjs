import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { JSDOM } from 'jsdom';

// The French HTML remains the source of truth for structure and styling.
// Keep every visible sentence here so a new French paragraph cannot silently stay French.
const text = {
  'Aller au contenu':'Skip to content','Menu':'Menu','Projets':'Projects','Expertise':'Expertise','À propos':'About','Parlons ensemble':'Get in touch',
  'Logiciel. Systèmes. Exploration.':'Software. Systems. Exploration.','Conçu avec curiosité. Construit avec soin.':'Designed with curiosity. Built with care.',
  'PORTFOLIO / INGÉNIERIE & CRÉATION':'PORTFOLIO / ENGINEERING & CREATION','Logiciels · Systèmes · Curiosité':'Software · Systems · Curiosity',
  'Du logiciel aux systèmes embarqués,':'From software to embedded systems,','j’aime comprendre les rouages.':'I like to understand how things work.','Et leur donner une nouvelle forme.':'And shape them into something new.',
  'Entrer dans l’atelier':'Explore the workshop','Mon CV':'My resume','ÉTUDE N° 01':'STUDY NO. 01','LE TOUT & LES PARTIES':'THE WHOLE & THE PARTS',
  'ASSEMBLAGE / EXPLORATION':'ASSEMBLY / EXPLORATION','ÉTUDIANT-INGÉNIEUR ENSIIE':'ENSIIE ENGINEERING STUDENT','APPRENTI EDF R&D':'EDF R&D APPRENTICE','DÉFILER POUR DÉCOUVRIR':'SCROLL TO EXPLORE',
  '01 / Quelques réalisations':'01 / Selected work','De l’idée':'From idea','au concret.':'to reality.','Des interfaces, des systèmes et les liens entre les deux. Une sélection de ce que je construis.':'Interfaces, systems and the connections between them. A selection of what I build.',
  '02 / L’atelier ouvert':'02 / The open workshop','Toutes les':'All the','explorations.':'explorations.','Ouverture de l’atelier…':'Opening the workshop…',
  'Activez JavaScript pour parcourir le catalogue, ou':'Enable JavaScript to browse the projects, or','retrouvez mes projets sur GitHub':'find my projects on GitHub',
  'TOUJOURS EN TRAIN D’APPRENDRE.':'ALWAYS LEARNING.','03 / Derrière les projets':'03 / Behind the projects','Curieux de nature.':'Curious by nature.','Ingénieur en devenir.':'Engineer in the making.',
  'Un circuit logique, une API, une interface. Ce qui m’intéresse, c’est de comprendre comment les pièces s’articulent — puis de construire un ensemble qui fonctionne.':'A logic circuit, an API, an interface. I enjoy understanding how the pieces fit together, then building a system that works.',
  'Étudiant à l’ENSIIE et apprenti chez EDF R&D, j’explore cette rencontre entre logiciel et matériel, au travail comme dans mes projets.':'As an ENSIIE student and EDF R&D apprentice, I explore the meeting point of software and hardware, at work and in my own projects.',
  'Un peu plus sur moi':'More about me','La suite commence par une conversation':'The next step starts with a conversation','Et si on construisait':'What if we built','quelque chose ?':'something together?',
  'Relier les couches.':'Connecting the layers.','Maîtriser l’ensemble.':'Understanding the whole.','Une approche du développement qui va des fondamentaux de la machine jusqu’au produit que l’on utilise.':'A view of development that spans machine fundamentals and the products people use.',
  'Logiciel & données':'Software & data','Concevoir des API, modéliser les données et traduire des contraintes réelles en comportements fiables.':'Design APIs, model data and turn real-world constraints into reliable behavior.',
  'Interfaces & produits':'Interfaces & products','Donner une forme lisible aux systèmes : des interfaces web aux tableaux de bord embarqués.':'Make systems understandable, from web interfaces to embedded dashboards.',
  'Embarqué & bas niveau':'Embedded & low-level systems','Comprendre les signaux, les architectures et les échanges entre le logiciel et le matériel.':'Understand signals, architectures and the exchanges between software and hardware.',
  'Infrastructure & déploiement':'Infrastructure & deployment','Héberger, automatiser et maintenir les applications au-delà de leur première mise en ligne.':'Host, automate and maintain applications beyond their first release.','Algorithmique':'Algorithms',
  '02 / À propos':'02 / About','La curiosité':'Curiosity','comme point de départ.':'as a starting point.','J’aime ouvrir la boîte, comprendre les mécanismes et imaginer ce qu’on pourrait en faire autrement.':'I like opening things up, understanding how they work and imagining what else they could do.',
  'Louis Tanchou / Logiciel & systèmes':'Louis Tanchou / Software & systems','Du fonctionnement':'From understanding','à la construction.':'to building.',
  'Ce qui m’attire dans l’informatique, c’est la possibilité de parcourir toute la chaîne : une porte logique, un processeur, un système, puis une application qui rend service.':'What draws me to computing is the chance to explore the entire stack: a logic gate, a processor, a system, and finally an application that helps someone.',
  'Après un parcours en BUT Informatique à l’IUT de Fontainebleau, j’ai rejoint l’ENSIIE. En alternance chez EDF R&D, je développe des solutions logicielles et travaille sur des architectures FPGA dans un contexte d’essais et d’instrumentation.':'After studying computer science at IUT de Fontainebleau, I joined ENSIIE. As an apprentice at EDF R&D, I develop software solutions and work on FPGA architectures in testing and instrumentation.',
  'Mes projets personnels prolongent cette curiosité : interfaces automobiles, automatisation, applications web et infrastructure auto-hébergée. J’aime autant comprendre une contrainte technique que rendre le résultat simple à utiliser.':'My personal projects extend that curiosity to automotive interfaces, automation, web applications and self-hosted infrastructure. I enjoy understanding technical constraints as much as making the result easy to use.',
  'En dehors du code':'Beyond code','L’automobile, l’acoustique et la photographie de rue nourrissent aussi mon goût pour les systèmes, la précision et la composition.':'Cars, acoustics and street photography also feed my interest in systems, precision and composition.',
  'Consulter mon CV ↗':'View my resume ↗','Le parcours / deux fils qui se rejoignent':'My path / two parallel threads','Apprendre.':'Learn.','Mettre en pratique.':'Put it into practice.',
  'Depuis septembre 2025, ma formation à l’ENSIIE et mon alternance chez EDF R&D avancent ensemble.':'Since September 2025, my studies at ENSIIE and apprenticeship at EDF R&D have progressed together.',
  '2028 · diplôme visé':'2028 · expected graduation','Formation':'Education','BUT Informatique':'University technology degree in computer science',
  'Un parcours pour apprendre à concevoir, développer et valider des applications.':'A course of study focused on designing, developing and validating applications.','Les fondations':'The foundations',
  '· prévisionnel':'· expected','Cycle ingénieur':'Engineering degree program','Approfondir l’informatique, les systèmes et les architectures.':'Deepening my knowledge of computing, systems and architectures.','Formation en cours':'In progress',
  'Expérience':'Experience','L’école et le terrain':'Academic study and work','en parallèle ↗':'side by side ↗','Depuis':'Since','septembre 2025':'September 2025',
  'Alternance · EDF R&D':'Apprenticeship · EDF R&D','Développement logiciel & FPGA':'Software development & FPGA','Mettre les connaissances en pratique dans un contexte d’essais et d’instrumentation.':'Applying knowledge in testing and instrumentation.','En parallèle du cycle ingénieur':'Alongside the engineering degree',
  '03 / Le laboratoire':'03 / The lab','Les mains dans':'Hands-on with','les rouages.':'the inner workings.','Un terrain d’expérimentation pour relier les applications à ce qui les fait réellement fonctionner.':'A place to connect applications with the systems that actually make them work.',
  'NEXUS / INFRASTRUCTURE PERSONNELLE':'NEXUS / PERSONAL INFRASTRUCTURE','APPLICATIONS':'APPLICATIONS','Projets & services':'Projects & services','ORCHESTRATION':'ORCHESTRATION','FONDATIONS':'FOUNDATIONS',
  '01 / Héberger pour comprendre':'01 / Hosting to understand','Un laboratoire':'A lab','qui sert au quotidien.':'used every day.','J’exploite une infrastructure personnelle virtualisée pour déployer mes applications, explorer les réseaux et automatiser les opérations.':'I run a virtualized personal infrastructure to deploy applications, explore networking and automate operations.',
  'Le portfolio en fait partie. Ses projets sont collectés depuis GitHub, puis publiés sur une infrastructure auto-hébergée avec Coolify.':'This portfolio is part of it. Its projects are collected from GitHub and published on self-hosted infrastructure using Coolify.',
  '02 / Calcul & matériel':'02 / Computing & hardware','Assembler.':'Assemble.','Mesurer. Ajuster.':'Measure. Adjust.','Le matériel offre un autre regard sur les logiciels : ressources disponibles, consommation et limites physiques. Un prolongement concret de mes projets de supervision.':'Hardware offers another perspective on software: available resources, power use and physical limits. It extends my monitoring projects into the real world.',
  '03 / Du signal à l’interface':'03 / From signal to interface','Faire dialoguer':'Connecting','les systèmes.':'systems.','Bus CAN, circuits logiques, capteurs et automatisations : autant de façons d’explorer la frontière entre une donnée et le monde réel.':'CAN buses, logic circuits, sensors and automation all offer ways to explore the boundary between data and the physical world.','Explorer les réalisations ↗':'Explore the projects ↗',
  'Les bonnes idées':'Good ideas','commencent à deux.':'start together.','Un projet, une opportunité ou simplement l’envie de discuter technique. Je serai ravi d’échanger.':'A project, an opportunity or just a technical conversation. I would be happy to talk.',
  'Échangeons sur LinkedIn':'Connect on LinkedIn','Parcours, opportunités et conversations.':'Experience, opportunities and conversations.','Retrouvons-nous sur GitHub':'Find me on GitHub','Le code, les expérimentations et les projets.':'Code, experiments and projects.',
  'Mon parcours en un document':'My experience in one document','Consulter mon CV au format PDF.':'View my resume as a PDF.','À bientôt':'See you soon',
  '← Retour à l’atelier':'← Back to the workshop','Ouverture du projet…':'Opening the project…','Activez JavaScript pour consulter cette fiche.':'Enable JavaScript to view this project.','Fermer ✕':'Close ✕',
};
const meta = {
  index: ['Software & systems developer — Louis Tanchou','Louis Tanchou’s portfolio. From software to embedded systems, turning ideas into working projects.'],
  project: ['Project — Louis Tanchou','A project by Louis Tanchou: context, technologies and exploration.'],
  skills: ['Expertise — Louis Tanchou','Software, embedded systems, interfaces and infrastructure: the areas explored by Louis Tanchou.'],
  me: ['About — Louis Tanchou','Louis Tanchou, ENSIIE engineering student and EDF R&D apprentice, connecting software and hardware.'],
  hardware: ['Lab — Louis Tanchou','Louis Tanchou’s personal lab: infrastructure, systems and hardware experiments.'],
  contact: ['Contact — Louis Tanchou','Get in touch with Louis Tanchou about a project, opportunity or technical question.'],
};
function translateFile(source, target, page) {
  const dom = new JSDOM(readFileSync(source, 'utf8'));
  const document = dom.window.document;
  document.documentElement.lang = 'en';
  const walker = document.createTreeWalker(document.body, 4);
  const missing = new Set();
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.parentElement.closest('script,style')) continue;
    const key = node.textContent.trim().replace(/\s+/g, ' ');
    if (text[key]) node.textContent = node.textContent.replace(node.textContent.trim(), text[key]);
    else if (key && /[À-ÿ]|\b(?:le|la|les|des|une|pour|avec|dans|projets|logiciel|systèmes)\b/i.test(key)) missing.add(key);
  }
  if (missing.size) throw new Error(`Untranslated strings in ${source}: ${[...missing].join(' | ')}`);
  for (const [selector, value] of [
    ['meta[name="description"]', meta[page]?.[1]],
    ['meta[property="og:title"]', meta[page]?.[0]],
    ['meta[property="og:description"]', meta[page]?.[1]],
  ]) if (value) document.querySelector(selector)?.setAttribute('content', value);
  if (meta[page]) document.title = meta[page][0];
  for (const element of document.querySelectorAll('[href]')) {
    const href = element.getAttribute('href');
    if (href.startsWith('/assets/CV/CV_Louis_Tanchou_francais.pdf')) element.setAttribute('href', '/assets/CV/CV_Louis_Tanchou-english.pdf');
    else if (/^\/(?:index|project|skills|me|hardware|contact)\.html/.test(href)) element.setAttribute('href', '/en' + href);
    else if (href === '/') element.setAttribute('href', '/en/');
  }
  for (const [selector, value] of Object.entries({
    '#project-filters':'Filter projects', '.round-link':'Contact me', '#gallery-dialog':'Project preview', '.dialog-close':'Close gallery', '#gallery-prev':'Previous image', '#gallery-next':'Next image', '.lab-diagram':'Simplified architecture: applications, containers and virtualization', '.brand':'Louis Tanchou — Home', '#navigation':'Main navigation'
  })) document.querySelector(selector)?.setAttribute('aria-label', value);
  for (const [selector, value] of Object.entries({
    '.about-portrait img':'Portrait of Louis Tanchou', '.lab-grid img':'Computer motherboard and components'
  })) document.querySelector(selector)?.setAttribute('alt', value);
  if (page) {
    document.querySelector('meta[property="og:url"]')?.setAttribute('content', `https://tanchou.fr/en/${page}.html`);
    document.head.insertAdjacentHTML('beforeend', `<link rel="alternate" hreflang="fr" href="https://tanchou.fr/${page}.html"><link rel="alternate" hreflang="en" href="https://tanchou.fr/en/${page}.html">`);
    writeFileSync(target, '<!doctype html>\n' + document.documentElement.outerHTML + '\n');
  } else {
    writeFileSync(target, document.body.innerHTML.trim() + '\n');
  }
}
mkdirSync('en', { recursive: true });
for (const page of Object.keys(meta)) translateFile(`${page}.html`, `en/${page}.html`, page);
translateFile('assets/html/nav.html', 'assets/html/nav.en.html');
translateFile('assets/html/footer.html', 'assets/html/footer.en.html');
