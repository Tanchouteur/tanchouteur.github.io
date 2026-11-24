# Atelier — Spécification de refonte

Statut : deuxième refonte visuelle du 24 novembre 2026, à la demande de Louis
(« ça fait pas fini, la 3D laisse à désirer ; effet wow, informations faciles à
trouver »). Elle remplace le parvis, le tunnel et les crans de septembre 2026.
Le contrat de données, l’architecture statique et le déploiement sont inchangés.
Version de septembre : historique Git de `main` avant cette refonte.

## 1. Objectif et périmètre

Un portfolio mémorable pour les recruteurs techniques, lisible rapidement, dont les projets restent alimentés automatiquement par les dossiers `.portfolio/` des dépôts GitHub. Refonte de l'accueil, du catalogue, des fiches, d'Expertise, À propos, Lab et Contact. Aucun backend supplémentaire. Aucun changement de domaine ni de tunnel.

Archive de référence : branche GitHub `codex/archive-portfolio-2026-09-18`, commit `f544577a183e116a343be13a80ad9760c9ecb0a3`. Refonte développée sur `codex/atelier-3d`, puis fusionnée dans `main`. Les fichiers système `.DS_Store` ne font pas partie de l'archive.

## 2. Direction artistique et navigation

- Un seul univers sur toutes les pages : nuit chaude `#0b0908`, texte ivoire
  `#f3ebe1`, accents ambre `#f2a765` et cuivre `#d9804d`, grain léger. Plus de
  pages ivoire séparées de l’accueil sombre. Jamais de citron.
- Typographie locale, servie par le bundle : Geist (texte et titres), Geist Mono
  (repères, métadonnées), Instrument Serif italique pour les mots mis en valeur.
  Aucune police système de repli visible dans les maquettes.
- En-tête collant et translucide sur toutes les pages : monogramme, navigation
  Projets, Expertise, À propos, Lab, Contact, sélecteur FR / EN et bouton CV
  toujours visible. Menu mobile avec `aria-expanded`, lien d’évitement, focus
  visible, page active annoncée.
- Accueil, premier écran : statut (élève-ingénieur ENSIIE, apprenti EDF R&D),
  nom, phrase de présentation, actions Voir les projets / CV / Contact et trois
  repères (formation, alternance, terrain de jeu). L’essentiel se lit sans défiler.
- Scène 3D « le tout et les parties » : un processeur en vue éclatée à quatre
  couches (substrat, interposeur, puce, capot cuivré gravé) au-dessus d’un champ
  de particules ambrées. Au défilement, l’identité s’efface, les couches
  s’écartent et chaque couche reçoit une étiquette HTML reliée par un trait :
  Infrastructure & déploiement, Embarqué & bas niveau, Logiciel & données,
  Interfaces & produits. La métaphore résume l’expertise de skills.html.
- Section épinglée de 270 svh (230 svh sous 900 px), défilement natif, ni crans
  ni capture de roue. Les projets suivent immédiatement la scène.
- Sélection : trois projets `featured` en grandes rangées alternées, média avec
  halo de la couleur d’accent du projet et inclinaison au pointeur. Puis
  catalogue complet filtrable, barre de filtres collante. Puis parcours abrégé
  avec portrait et frise courte, et appel au contact.
- Fiche, Expertise, À propos, Lab, Contact : mêmes composants (cartes, titres,
  boutons). Contenus inchangés sur le fond ; pas de coordonnées privées, pas de
  promesse de disponibilité.

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
- `background` : couleur hexadécimale à six chiffres ; invalide/absente → fond de média du type choisi. Appliquée à la surface derrière l'image et au repli, jamais à la scène ou aux textes.
- `captions` : dictionnaire nom de fichier → texte ; entrée invalide ignorée. Sans légende, texte alternatif descriptif générique fondé sur le titre et l'index.
- Liens externes : seulement HTTP(S). Textes insérés comme texte ou échappés ; Markdown filtré par DOMPurify. Une image qui échoue est remplacée visuellement par une composition typographique. Les sections optionnelles vides ne laissent pas de trous.
- Ordre : `order` croissant, puis date décroissante. Même contrat côté collecteur et affichage. Catégories inconnues conservées et filtrables. Données absentes/inexploitables : message lisible avec possibilité de réessayer.

## 4. Architecture et exploitation

- Vite multipage, modules natifs. `hero.mjs` (contrôleur léger) charge
  dynamiquement `scene.mjs` (Three.js, post-traitement bloom) uniquement sur
  l’accueil. Fonctions pures de la scène dans `lib/hero.mjs`. Marked et
  DOMPurify dans le bundle de détail. Polices via `@fontsource`, sans CDN.
- Navigation/pied de page partagés insérés au build et en développement.
  Les pages anglaises sont générées depuis le français ; toute phrase française
  nouvelle doit être ajoutée au dictionnaire de `scripts/generate-english.mjs`.
- Images, données et CV copiés dans `dist/assets` avec chemins stables.
- Synchronisation GitHub, Coolify, Dockerfile et port 8085 : inchangés
  (voir `DEPLOYMENT.md`).

## 5. Mouvement, robustesse et budgets

- Textes et actions en HTML réel, utilisables sans WebGL. Textures de la scène
  générées en canvas, aucun modèle ni texture distante.
- Rendu continu seulement quand le héros est visible et l’onglet actif ; arrêt
  hors écran. Densité de pixels ≤ 1,5 (1,25 sous 760 px) et tampon ≤ 2,4 Mpx ;
  sous 760 px, moins de particules et pas de MSAA.
- `prefers-reduced-motion: reduce` : aucun import 3D, héros statique avec image
  de secours `atelier-core.webp`, couches affichées en liste, pas d’apparitions
  animées. Bascule en cours de session prise en compte (scène libérée).
  Échec de chargement 3D : image de secours et texte intacts.
- Apparitions au défilement seulement si IntersectionObserver et mouvement
  complet sont disponibles ; sinon tout est visible d’emblée.
- Mobile : une colonne, aucun survol nécessaire, pas de débordement à 375 px,
  cibles tactiles de 44 px.
- Galerie : dialogue natif, Échap, précédent/suivant, flèches, retour du focus.
- Budgets gzip : JavaScript hors 3D < 150 Ko ; chunk 3D < 200 Ko.

## 6. Tests et critères d'acceptation

| Niveau                 | Scénarios                                                                                                                                                                                                                                 |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unitaire (Node)        | État du héros borné et monotone ; ordre des couches ; budget de pixels ; lissage ; ancien format ; présentation valide/invalide ; tri ; sélection bornée ; catégorie professionnelle/inconnue ; liens dangereux ; légendes ; chemins de médias |
| Intégration collecteur | Métadonnées GitHub + `.portfolio` → JSON avec présentation ; imports sans réseau/effet de bord ; maintien du mode dry-run                                                                                                                 |
| Intégration DOM        | Héros immersif, mouvement réduit, bascule et échec 3D ; catalogue réel et jeu de 30 projets ; filtres ; état vide/erreur ; texte hostile ; médias absents ; détail inconnu ; Markdown assaini                                                                                                     |
| Build                  | Six pages produites ; ressources référencées existantes avec casse exacte ; JSON/médias/CV copiés ; budgets JS                                                                                                                            |
| Navigateur             | Accueil et 3D ; mobile ; liens directs ; filtres ; galerie clavier ; reduced motion ; repli WebGL ; pages secondaires ; erreurs console                                                                                                   |

Livraison : spécification et contrat à jour, archive distante vérifiée, tests exécutés, build réussi, aperçu inspecté et limites restantes rapportées. Le nouveau projet au format historique doit apparaître sans modification du front-end. La fusion dans `main` publie le code source ; la bascule Coolify est une opération distincte décrite dans `DEPLOYMENT.md`.

## Parcours personnel

La page À propos présente une frise à deux lignes : formation et expérience.
Le BUT couvre 2023–2025 ; le cycle ingénieur ENSIIE couvre 2025–2028, avec 2028
explicitement prévisionnel. L'alternance EDF R&D commence en septembre 2025,
date corrigée directement par Louis, et reste indiquée « en cours » sans date de
fin inventée. Les cartes ENSIIE et EDF sont alignées pour rendre leur simultanéité
explicite. Sur mobile, une frise verticale conserve les dates et la mention
« en parallèle du cycle ingénieur ». La frise est HTML/CSS statique, sans charge 3D.
