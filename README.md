# Louis Tanchou — Portfolio Atelier

Portfolio statique : entrée 3D nocturne dans la brume, lueurs ambre/cuivre et pages éditoriales ivoire/graphite, scène Three.js progressive et catalogue alimenté automatiquement depuis GitHub.

## Développer

Node 22.22.2 minimum.

```sh
npm ci
npm run dev
npm run check
npm run preview
```

## Documentation

- [Spécification de refonte et critères d’acceptation](docs/REFONTE_SPEC.md)
- [Contrat `.portfolio/` pour ajouter un projet](PORTFOLIO_SPEC.md)
- [Déploiement en production Coolify et retour arrière](docs/DEPLOYMENT.md)
- [Rapport de validation](docs/VALIDATION.md)

Le catalogue est collecté chaque jour à minuit UTC. Le build public est dans `dist/` ; la 3D reste facultative. Les tests n’utilisent ni GitHub ni Coolify.

## Français et anglais

Le site publie les six pages en français à la racine et en anglais sous `/en/`. À la première visite d’une page française, la langue du navigateur choisit l’anglais si elle commence par `en`, sinon le français. Le sélecteur FR / EN conserve le choix dans `localStorage` et garde la page, les paramètres et l’ancre courants.

Les pages anglaises sont générées depuis les pages françaises et les traductions de `scripts/generate-english.mjs` avant `dev` et `build`. Les textes des sept projets sont dans `lib/projects-en.mjs`, séparés de `assets/data/projects.json` régénéré depuis GitHub. Pour un nouveau projet, ajoutez sa traduction dans ce fichier avant publication ; sans elle, la version anglaise affiche un texte d’attente anglais.

Le CV anglais publié est `assets/CV/CV_Louis_Tanchou-english.pdf`. Sa source éditable et son générateur restent dans `Nexus/vie-professionnelle/candidatures/anglais-general/`. Si le CV source est modifié, remplacez le PDF du portfolio par le nouvel export.

Version précédente : branche [`codex/archive-portfolio-2026-09-18`](https://github.com/Tanchouteur/tanchouteur.github.io/tree/codex/archive-portfolio-2026-09-18).
