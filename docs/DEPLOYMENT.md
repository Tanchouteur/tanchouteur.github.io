# Déployer le portfolio en production avec Coolify

Cette procédure remplace la ressource Coolify actuelle par une nouvelle application
de production. Le code à déployer est sur `main`. Le trafic public suit le chemin
`tanchou.fr` → Cloudflare Tunnel → VM Coolify, port hôte `8085`, tel que documenté
dans Nexus. Les deux applications ne peuvent pas utiliser `8085` simultanément :
prévois une courte interruption entre l'arrêt de l'ancienne et le démarrage de la
nouvelle. Aucune ressource de préproduction ni aucun port temporaire n'est requis.

## 1. Relever la configuration actuelle

Dans Coolify, ouvre l'application qui sert `tanchou.fr` et note son nom, son UUID,
son projet/environnement, son dépôt et sa branche, son Build Pack, ses ports,
ses domaines, ses variables, son état de déploiement automatique et ses éventuels
volumes. Ne la supprime pas : elle servira au retour arrière. Le portfolio est un
site statique, mais vérifie quand même le stockage configuré avant de l'arrêter.

Vérifie que `main` contient la refonte et que le workflow GitHub Actions
**Validate portfolio** est passé. La branche
`codex/archive-portfolio-2026-09-18` conserve l'ancienne version au commit
`f544577a183e116a343be13a80ad9760c9ecb0a3`. Ouvre le site public, une fiche
projet et le CV pour avoir un point de comparaison.

Dans l'ancienne application, désactive le déploiement automatique depuis Git. Une
mise à jour de `main` ne doit pas reconstruire l'ancienne ressource pendant la
bascule. Si le secret GitHub Actions `COOLIFY_WEBHOOK_URL` pointe encore vers elle,
évite de lancer **Build Portfolio Projects** avant d'avoir remplacé ce secret.

## 2. Configurer la nouvelle application de production

Dans le projet et l'environnement Coolify destinés au portfolio, sélectionne
**+ New → Application → Git Repository**, puis le dépôt
`Tanchouteur/tanchouteur.github.io`, branche `main`. Configure :

| Réglage | Valeur de production |
| --- | --- |
| Build Pack | `Dockerfile` depuis Git |
| Base Directory | `/` |
| Dockerfile Location | `/Dockerfile` ou `Dockerfile` selon la forme demandée par l'interface |
| Ports Exposes | `80` (Nginx dans le conteneur) |
| Ports Mappings | `8085:80` (VM → conteneur) |
| Domains | Vide si `tanchou.fr` continue d'arriver directement sur le port hôte `8085` par Cloudflare Tunnel |
| Déploiement automatique Git | Désactivé : le workflow quotidien utilisera le webhook de cette nouvelle application |
| Variables et stockage | Aucun secret ni volume nécessaire au conteneur statique |

Le [Dockerfile depuis Git](https://coolify.io/docs/applications/builds/dockerfile)
copie le dépôt, exécute `npm ci` et `npm run check`, puis sert `dist/` avec Nginx
sur le port interne 80. **Ports Exposes** désigne ce port interne ; **Ports
Mappings** publie `8085` sur la VM. Voir les
[réglages généraux Coolify](https://coolify.io/docs/applications/configuration/general).
Ne lance pas encore **Deploy** tant que l'ancienne application occupe `8085`.

Dans Cloudflare Tunnel, confirme que l'origine de `tanchou.fr` pointe toujours
vers `http://<IP_VM_COOLIFY>:8085`. Le domaine et la configuration du tunnel ne
changent pas dans cette procédure.

## 3. Basculer le trafic public

1. Dans Coolify, clique **Stop** sur l'ancienne application. Attends son arrêt et
   vérifie que le port hôte `8085` est libéré. Le site est momentanément indisponible.
2. Dans la nouvelle application, clique **Deploy**. Suis les logs jusqu'à la fin
   du build et vérifie que le conteneur est sain. Si le build échoue, applique
   immédiatement la procédure de retour arrière ci-dessous.
3. Ouvre `http://<IP_VM_COOLIFY>:8085/` depuis le réseau local, puis
   `https://tanchou.fr/`. Vérifie l'accueil et le tunnel, le catalogue et ses
   filtres, `me.html`, `skills.html`, `hardware.html`, `contact.html`, une fiche
   `project.html?id=SpotifySort`, le CV, les images et
   `/assets/data/projects.json`. Vérifie aussi le rendu mobile et le mode
   « réduire les animations ».
4. Dans Coolify, relève le **Deploy Webhook** de la nouvelle application. Dans
   les secrets GitHub Actions du dépôt portfolio, remplace la valeur de
   `COOLIFY_WEBHOOK_URL` par cette URL. Ne copie jamais cette URL dans Git ou dans
   les logs. Garde le déploiement automatique Git désactivé pour éviter deux
   déploiements lors du commit quotidien des données.
5. Lance manuellement **Build Portfolio Projects** sur `main`. Si les données
   changent, le workflow valide le build, pousse le nouveau JSON et les médias,
   puis appelle le webhook Coolify. Vérifie le nouveau commit dans le déploiement
   et le catalogue public. Si rien ne change, le workflow n'appelle pas le
   webhook : c'est le comportement attendu. Les futures modifications de code
   nécessitent un **Deploy** manuel dans Coolify, sauf si tu choisis plus tard
   un déclenchement Git unique à la place du webhook.

Le [modèle de déploiement Coolify](https://coolify.io/docs/core/build-deployment-model)
confirme qu'un mappage de port hôte impose un remplacement avec arrêt préalable,
et non un remplacement progressif. La commande **Stop** conserve la ressource
Coolify pour le retour arrière ; elle ne préserve pas les données non persistantes
du conteneur. Voir les [opérations Coolify](https://coolify.io/docs/applications/operations/overview).

## 4. Retour arrière

Si le nouveau site ne démarre pas ou ne sert pas correctement `tanchou.fr`, clique
**Stop** sur la nouvelle application et attends que `8085` soit libre. Clique
ensuite **Start** sur l'ancienne, sans la redéployer depuis `main`, puis revérifie
le site public. Restaure `COOLIFY_WEBHOOK_URL` vers l'ancien webhook seulement si
tu veux reprendre les déploiements de cette ancienne ressource. Si elle doit être
reconstruite, utilise sa branche et sa configuration antérieures, ou la branche
d'archive, après avoir vérifié leur compatibilité.

Conserve l'ancienne application arrêtée tant que plusieurs collectes quotidiennes
n'ont pas été validées en production. Supprime-la ensuite seulement lorsque ce
retour arrière n'est plus utile.

## Contrôles avant publication du code

Utilise une version de Node compatible avec `package.json` (`^22.22.2`,
`^24.15.0` ou `>=26`) :

```sh
npm ci
npm run check
```

`check` exécute les tests unitaires et d'intégration, le build Vite et la
validation des six pages produites. Le build Docker répète ces contrôles avant
de publier `dist/`. Le collecteur testé localement utilise une API GitHub simulée ;
la vraie synchronisation des dépôts est effectuée par **Build Portfolio Projects**
sur `main`.
