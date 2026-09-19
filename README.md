# Louis Tanchou — Atelier

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
- [Build, Coolify et retour arrière](docs/DEPLOYMENT.md)
- [Rapport de validation](docs/VALIDATION.md)

Le catalogue est collecté chaque jour à minuit UTC. Le build public est dans `dist/` ; la 3D reste facultative. Les tests n’utilisent ni GitHub ni Coolify.

Version précédente : branche [`codex/archive-portfolio-2026-09-18`](https://github.com/Tanchouteur/tanchouteur.github.io/tree/codex/archive-portfolio-2026-09-18).
