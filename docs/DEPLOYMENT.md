# Build et mise en production

## Commandes

Node >= 22.22.2. Installer les versions verrouillées avec `npm ci`.

```sh
npm run dev
npm run check
npm run preview
```

`check` exécute les tests unitaires, les tests d'intégration, le build Vite et la validation des fichiers produits. La validation vérifie explicitement la casse des noms, même sur macOS. Les tests du collecteur injectent une API GitHub simulée : aucun token, aucun accès réseau, aucun déploiement.

La sortie publique est **dist/**. Ne pas servir directement la racine du dépôt après cette refonte : les modules et inclusions HTML ont besoin du build. Les ressources statiques sont copiées à leurs URL historiques ; Vite produit séparément les bundles versionnés.

## Coolify

Nexus documente `tanchou.fr` → Cloudflare Tunnel → VM Coolify, publication sur le port 8085. Le build pack, la branche et les paramètres exacts de l'application n'ont pas été inspectés dans Coolify. La bascule de production n'est pas effectuée par cette refonte.

Deux configurations possibles :

- Build statique : `npm ci && npm run build`, dossier publié `dist`.
- Dockerfile fourni : build multistage incluant `npm run check`, serveur Nginx sur le port conteneur **80**. Conserver la publication hôte **8085** vers ce port et le tunnel existant.

Avant bascule : vérifier le build pack existant, configurer la sortie ou le Dockerfile, prévisualiser les six pages et une fiche directe, vérifier le CV et les images. Fusionner la branche validée vers la branche suivie par Coolify puis vérifier le déploiement. Aucun changement de DNS, tunnel ou ouverture de port n'est requis.

## Collecte automatique

Le workflow de collecte s'exécute chaque jour à minuit UTC ou manuellement. Il lit les `.portfolio/`, actualise JSON et médias, installe les dépendances et exécute `npm run check` **avant** le commit et le webhook. Un échec de test empêche la publication. Le webhook utilise GET, conformément à l'appel prioritaire historique ; il échoue explicitement sur erreur HTTP (aucun message trompeur de succès).

Le workflow de collecte est limité à `main` : un essai manuel sur une branche de développement ne doit pas modifier le catalogue public. La CI de validation fonctionne sur la branche de refonte et les pull requests. Aucun appel au webhook Coolify n'a été fait pendant l'implémentation.

## Retour arrière

La branche distante `codex/archive-portfolio-2026-09-18` conserve la version avant refonte au commit `f544577a183e116a343be13a80ad9760c9ecb0a3`.

Pour revenir à cette version, déployer cette branche **avec l'ancien mode de service statique à la racine**. L'archive ne contient ni Vite ni le nouveau Dockerfile ; il faut donc restaurer également les réglages du build pack précédent. Ne pas forcer un reset de `main`.
