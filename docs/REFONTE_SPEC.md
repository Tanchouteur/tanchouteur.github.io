# Atelier — Spécification de refonte

Statut : refonte implémentée et prête à être déployée depuis `main`. Direction consolidée après les retours de Louis des 18 et 19 septembre 2026.

## 1. Objectif et périmètre

Un portfolio mémorable pour les recruteurs techniques, lisible rapidement, dont les projets restent alimentés automatiquement par les dossiers `.portfolio/` des dépôts GitHub. Refonte de l'accueil, du catalogue, des fiches, d'Expertise, À propos, Lab et Contact. Aucun backend supplémentaire. Aucun changement de domaine ni de tunnel.

Archive de référence : branche GitHub `codex/archive-portfolio-2026-09-18`, commit `f544577a183e116a343be13a80ad9760c9ecb0a3`. Refonte développée sur `codex/atelier-3d`, puis fusionnée dans `main`. Les fichiers système `.DS_Store` ne font pas partie de l'archive.

## 2. Direction artistique et navigation

- Palette : ivoire `#f2efe8`, graphite `#252824`, cuivre sombre `#9a4c32` pour les textes/liens, cuivre clair `#c48663` pour les objets. Jamais de citron. Ces couleurs structurent les pages éditoriales et le catalogue. Le parcours immersif utilise un fond presque noir, du métal sombre et des lueurs ambre/cuivre.
- En-tête commun : monogramme LT, nom, Projets, Expertise, À propos, Lab, Contact. Menu mobile avec bouton et `aria-expanded`. Lien d'évitement, focus visible, page active annoncée.
- Accueil : une présentation personnelle entière disposée dans l’espace. Titre, actions, portrait encadré et étiquettes occupent des profondeurs distinctes, avec parallaxe au pointeur. Aucun écran de chargement obligatoire.
- Parcours : défilement natif dans une section épinglée. La caméra part d’un parvis sombre dans la brume, rejoint rapidement le portail visible au loin, puis traverse les strates d’une architecture métallique. Le premier projet se devine dès l'ouverture. Chaque projet garde une profondeur fixe dans le tunnel : il grandit à l'approche, atteint son arrêt puis passe derrière la caméra, tandis que son texte glisse à gauche et son cadre à droite pour dégager le passage. Le texte et le portrait du parvis restent d'abord presque en place, puis s'écartent plus tard dans l'approche. Pas de capture de roue.
- Stations : jusqu’à quatre projets `featured` suivant l’ordre du catalogue ; à défaut les quatre premiers. L’ordre éditorial courant est CliOS, Lapins du Gapeau, SpotiSort, puis RigFarm ; il reste piloté par `order`, sans nom codé en dur dans le front-end. Texte HTML accessible et médias en panneaux avec épaisseur. Chaque station fournit un arrêt de lecture ; pendant le geste la caméra suit continûment le scroll sans zone morte.
- Crans demandés par Louis : après 140 ms sans défilement (80 ms après `scrollend`), terminer le déplacement vers une station lisible dans le sens du geste. Tolérance de 8 % autour du cran pour éviter les sauts involontaires. Ne pas capturer la roue ; ne pas recaler le catalogue, les liens directs ou le mode mouvement réduit.
- Sortie : invitation à entrer dans l’atelier, puis catalogue complet filtrable. Accès direct au catalogue toujours disponible dans le parcours. La sélection classique reste utilisée en mouvement réduit, sans duplication visuelle en mode immersif.
- Décor validé après inspection : approfondir le tunnel dans une ambiance presque noire, métal sombre, lueurs ambre/cuivre cinématographiques. La lumière est localisée dans les joints et derrière les panneaux ; éviter les grands cadres blancs répétés. La présentation personnelle est également nocturne ; son texte reste clair et contrasté.
- Fiche : titre, catégorie, statut français, résumé, liens en premier ; couverture non recadrée par défaut, complétée par un fond flouté issu de la même image lorsque les ratios diffèrent ; Markdown assaini ; technologies ; galerie avec légendes et dialogue d'agrandissement accessible. Ne pas afficher de faux lien public vers un dépôt privé.
- Pages secondaires : contenu français fondé sur le portfolio et les fiches professionnelles Nexus. Ne pas publier les coordonnées privées, adresses réseau, détails de domicile ni des secrets d'infrastructure. Liens LinkedIn, GitHub et CV existants conservés. Pas de promesse de disponibilité non confirmée.

## 3. Contrat de données rétrocompatible

Les champs existants et les URL `project.html?id=<repo>` restent valides. Le collecteur continue de produire `assets/data/projects.json`. Chemins canoniques des médias : `assets/images/Projects/<repo>/<fichier>` (casse réelle du dépôt).

Nouveau champ facultatif :

```json
{
  "presentation": {
    "type": "interface",
    "accent": "#9a4c32",
    "background": "#17120e",
    "captions": { "screenshot1.png": "Planification de la semaine" }
  }
}
```

- `type` : `neutral` (défaut), `interface` (cadre de fenêtre), `photo` (image bord à bord recadrée), `diagram` (surface claire avec marge et image entière). Inconnu → `neutral`. Aucun choix basé sur le nom d'un dépôt.
- `accent` : couleur hexadécimale à six chiffres ; invalide/absente → cuivre. Usage décoratif seulement ; le contraste des textes ne dépend pas de cette valeur.
- `background` : couleur hexadécimale à six chiffres ; invalide/absente → fond de média du type choisi. Appliquée à la surface derrière l'image et au repli, jamais au tunnel ou aux textes.
- `captions` : dictionnaire nom de fichier → texte ; entrée invalide ignorée. Sans légende, texte alternatif descriptif générique fondé sur le titre et l'index.
- Liens externes : seulement HTTP(S). Textes insérés comme texte ou échappés ; Markdown filtré par DOMPurify. Une image qui échoue est remplacée visuellement par une composition typographique. Les sections optionnelles vides ne laissent pas de trous.
- Ordre : `order` croissant, puis date décroissante. Même contrat côté collecteur et affichage. Catégories inconnues conservées et filtrables. Données absentes/inexploitables : message lisible avec possibilité de réessayer.

## 4. Architecture et exploitation

- Vite multipage, JavaScript natif en modules, Three.js chargé dynamiquement uniquement sur l'accueil, Marked et DOMPurify dans le bundle de détail. Dépendances verrouillées par lockfile, pas de CDN runtime.
- Navigation/pied de page partagés insérés dans le HTML au build et en développement. CSS partagé, fonctions de données pures, module catalogue, module détail, module 3D séparés.
- Images, données et CV copiés dans `dist/assets` avec chemins stables. Polices locales. HTML et JS servis sans secret GitHub.
- `npm run dev`, `npm run build`, `npm run preview`, `npm test`, `npm run test:integration`, `npm run check` documentés.
- Synchronisation GitHub quotidienne à minuit UTC et manuelle. Build/tests avant publication des données. Webhook seulement après changement, avec échec HTTP visible. Ne pas modifier les secrets ni déclencher un déploiement réel pendant les tests.
- Coolify : sortie statique `dist`, ou Dockerfile multistage Node/Nginx fourni. Port conteneur 80, publication existante 8085 à conserver. Vérifier les réglages réels avant bascule ; aucune supposition sur le build pack actuel.

## 5. Mouvement, robustesse et budgets

- Textes et actions HTML utilisables indépendamment de WebGL. Chargement 3D après les données, pas de modèle ou texture distante. Rendu à la demande sur scroll/redimensionnement/pointeur dans le tunnel ; animation de la brume sur le parvis, arrêtée hors écran et onglet caché. Densité de pixels plafonnée à 1,25 et tampon de rendu limité à 1,8 million de pixels.
- `prefers-reduced-motion: reduce` : présentation statique et sélection classique, sans section épinglée ni descente. Bascule en cours de session prise en compte. Perte de WebGL : conserver les panneaux HTML et le fond de secours. Les panneaux hors champ sont inertes afin de ne pas piéger la navigation clavier.
- Mobile : disposition en une colonne, aucun survol nécessaire, aucune barre horizontale à 375 px. Boutons principaux et contrôles tactiles de 44 px minimum.
- Grand écran : le document et la scène immersive occupent toute la largeur disponible ; aucune largeur maximale sur `body` ne doit révéler de bandes de fond latérales.
- Galerie : dialogue natif, Échap, boutons précédent/suivant, flèches clavier, retour du focus. Images différées sauf média principal. Aucun carrousel automatique.
- Budgets de build : JavaScript hors 3D inférieur à 150 Ko gzip au total ; chunk 3D inférieur à 200 Ko gzip. Vérification des poids réels documentée. Pas de score Lighthouse promis sans mesure.

## 6. Tests et critères d'acceptation

| Niveau                 | Scénarios                                                                                                                                                                                                                                 |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unitaire (Node)        | Caméra bornée et monotone ; plages de lecture ; panneaux hors champ inertes ; ancien format ; présentation valide/invalide ; tri ; sélection bornée ; catégorie professionnelle/inconnue ; liens dangereux ; légendes ; chemins de médias |
| Intégration collecteur | Métadonnées GitHub + `.portfolio` → JSON avec présentation ; imports sans réseau/effet de bord ; maintien du mode dry-run                                                                                                                 |
| Intégration DOM        | Catalogue réel et jeu de 30 projets ; filtres ; état vide/erreur ; texte hostile ; médias absents ; détail inconnu ; Markdown assaini                                                                                                     |
| Build                  | Six pages produites ; ressources référencées existantes avec casse exacte ; JSON/médias/CV copiés ; budgets JS                                                                                                                            |
| Navigateur             | Accueil et 3D ; mobile ; liens directs ; filtres ; galerie clavier ; reduced motion ; repli WebGL ; pages secondaires ; erreurs console                                                                                                   |

Livraison : spécification et contrat à jour, archive distante vérifiée, tests exécutés, build réussi, aperçu inspecté et limites restantes rapportées. Le nouveau projet au format historique doit apparaître sans modification du front-end. La fusion dans `main` publie le code source ; la bascule Coolify est une opération distincte décrite dans `DEPLOYMENT.md`.

## Évolution de l’ouverture — parvis dans la brume

L’accueil appartient au même monde nocturne que les projets. La caméra commence
à z=54 devant un parvis sombre. Un portail métallique éclairé à l’ambre, à z=3,
reste visible au centre entre le nom et le portrait. Des lignes au sol donnent
la perspective ; neuf nappes de brume translucides dérivent lentement. Le portrait
existant est encadré de métal cuivré, incliné vers le centre, avec une tranche
visible. Nom, biographie et repères occupent différentes profondeurs HTML 3D.
Les informations restent de vrais textes sélectionnables et accessibles.

Le premier déplacement couvre 66 unités, puis chaque étape intérieure 20 unités.
La trajectoire est continue à la première station (z=-12) et réversible. Les crans
existants restent actifs. Le bouton d’entrée cible la position exacte de la
première station, recalculée au redimensionnement. Le catalogue reste autonome ;
aucune connaissance des projets futurs n’est nécessaire pour cette ouverture.

La brume s’anime uniquement lorsque la scène est visible et l’onglet actif.
Le mode mouvement réduit conserve une présentation statique sans WebGL, sans
traversée et sans crans. Le contexte WebGL et ses ressources sont libérés au retrait.
Critères : portrait et nom visibles dès l’accueil, portail perceptible entre eux,
aucune rupture au raccord du tunnel, navigation aller/retour aux arrêts conservée,
contraste des textes et absence de débordement horizontal sur mobile.

## Fluidité et coût de rendu

Aimantation pilotée par requestAnimationFrame, durée 380–850 ms selon la distance,
courbe quintique avec vitesse et accélération nulles aux extrémités. La roue reste
native ; un nouveau geste (roue, tactile, pointeur, touche de déplacement) annule
immédiatement le recalage. Les liens et la préférence de mouvement réduit le
coupent également. Aucun délai artificiel de lecture dans la trajectoire.

Architecture statique regroupée en quatre maillages, un par matériau. Deux
lumières locales réutilisées à intensité variable ; nombre de lumières constant
pour éviter les variantes de shaders pendant la traversée. Une seule file de
rendu WebGL fusionne les demandes de scroll et de pointeur : au plus un rendu par
frame. La brume au repos est limitée à 30 rendus par seconde ; dans le tunnel
immobile, aucun rendu continu. Les panneaux cachés ne gardent pas de promotion GPU
forcée et ne reçoivent plus de modifications de style à chaque frame.

`?perf` active des compteurs locaux sur `.journey-environment[data-render-stats]` :
appels de rendu, triangles, temps CPU de soumission et dimensions du tampon. Aucune
télémétrie envoyée. Ce temps CPU ne mesure pas le temps GPU ni la fluidité totale.

## Parcours personnel

La page À propos présente une frise à deux lignes : formation et expérience.
Le BUT couvre 2023–2025 ; le cycle ingénieur ENSIIE couvre 2025–2028, avec 2028
explicitement prévisionnel. L'alternance EDF R&D commence en septembre 2025,
date corrigée directement par Louis, et reste indiquée « en cours » sans date de
fin inventée. Les cartes ENSIIE et EDF sont alignées pour rendre leur simultanéité
explicite. Sur mobile, une frise verticale conserve les dates et la mention
« en parallèle du cycle ingénieur ». La frise est HTML/CSS statique, sans charge 3D.
