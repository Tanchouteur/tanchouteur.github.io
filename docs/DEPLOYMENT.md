# Déployer le portfolio dans Coolify

Ce guide décrit une **nouvelle ressource en parallèle de l'ancienne**, puis un
basculement contrôlé. Il ne lance aucun déploiement. Les réglages exacts de la
ressource actuelle doivent être relevés dans ton Coolify avant de commencer :
Nexus documente `tanchou.fr` → Cloudflare Tunnel → VM Coolify, port hôte `8085`,
mais ne donne ni son Build Pack ni sa branche actuelle. Garde cette page ouverte
pendant la migration.

## 1. Préparer et noter l'existant

Dans Coolify, ouvre la ressource **Portfolio actuelle** et note : projet et
environnement, dépôt et branche, Build Pack, Dockerfile ou dossier publié, port
exposé, _Ports Mappings_, domaine, déploiement automatique, Healthcheck et
variables. Note son UUID et garde sa configuration : **Stop** conserve la ressource,
mais retire son conteneur et ses données non persistantes. Le portfolio est statique,
donc aucun volume applicatif n'est attendu ; vérifie tout de même le champ Storage.
La [documentation Coolify des opérations](https://coolify.io/docs/applications/operations/overview)
distingue Stop de la suppression de ressource.

Avant tout changement, ouvre `tanchou.fr`, la page d'un projet et le CV actuel.
Garde la branche d'archive `codex/archive-portfolio-2026-09-18` comme point de
retour, au commit `f544577a183e116a343be13a80ad9760c9ecb0a3`.

## 2. Créer la nouvelle ressource de test

Dans le même projet et environnement Coolify, choisis **+ New → Application →
Git Repository** et sélectionne `Tanchouteur/tanchouteur.github.io`. Utilise
la branche `codex/atelier-3d` pour ce test. Dans **Configuration → General** :

| Réglage                 | Valeur de test                                                                  |
| ----------------------- | ------------------------------------------------------------------------------- |
| Build Pack              | `Dockerfile` depuis le dépôt Git                                                |
| Base Directory          | `/`                                                                             |
| Dockerfile Location     | `/Dockerfile` (ou `Dockerfile` si ton interface attend un chemin relatif)       |
| Ports Exposes           | `80` — port interne de Nginx                                                    |
| Ports Mappings          | `<PORT_TEST_LIBRE>:80`, par exemple `8087:80` uniquement si 8087 est libre      |
| Domains                 | Vide pendant le test par port hôte                                              |
| Déploiement automatique | Désactivé pendant la validation                                                 |
| Variables               | Aucune nécessaire pour le site statique ; ne recopie pas de secrets inutilement |

Coolify distingue [port exposé interne et mappage sur l'hôte](https://coolify.io/docs/applications/configuration/general).
Le Dockerfile du dépôt construit les six pages avec `npm ci`, lance `npm run check`,
puis sert `dist/` sur `0.0.0.0:80`. Ne choisis pas « Dockerfile without Git » :
son contexte n'inclut pas les fichiers du dépôt nécessaires aux `COPY`.
Voir la [procédure Dockerfile officielle](https://coolify.io/docs/applications/builds/dockerfile).

Vérifie que le port de test est libre sur la VM, **Deploy**, puis lis les logs de
build et l'état de santé. Sur le LAN, ouvre `http://<IP_VM_COOLIFY>:<PORT_TEST_LIBRE>`.
Teste l'accueil, les crans, le catalogue et les filtres, `me.html`, `skills.html`,
`hardware.html`, `contact.html`, `project.html?id=SpotifySort`, le CV et plusieurs
images. Contrôle aussi la vue mobile et le mode « réduire les animations ».
L'ancienne ressource continue à servir `tanchou.fr` pendant cette étape.

## 3. Préparer le basculement

Contrôle la configuration du Cloudflare Tunnel : l'origine du hostname
`tanchou.fr` doit toujours être `http://<IP_VM_COOLIFY>:8085`. Ne change pas
le domaine, le DNS ou les ports de la box. Dans l'ancienne ressource Coolify,
désactive les déploiements automatiques avant toute fusion sur `main` ; sinon
elle pourrait reconstruire le nouveau code avec son ancien mode de service.

Le workflow GitHub quotidien `Build Portfolio Projects` est limité à `main` et
committe le JSON/médias après validation. Son secret `COOLIFY_WEBHOOK_URL`, s'il
est défini, doit pointer vers **la nouvelle ressource** à partir du basculement.
Relève le webhook de la nouvelle ressource, puis mets ce secret à jour au moment
du changement. Pendant le test sur `codex/atelier-3d`, le workflow quotidien
ne déploie pas cette branche.

## 4. Transférer le port 8085

1. Dans Coolify, clique **Stop** sur l'ancienne ressource. Vérifie qu'elle est
   arrêtée et que `8085` n'est plus occupé. C'est le début de la courte interruption.
2. Dans la nouvelle ressource, remplace `<PORT_TEST_LIBRE>:80` par `8085:80`.
   Conserve **Ports Exposes = 80**, puis redéploie.
3. Vérifie d'abord `http://<IP_VM_COOLIFY>:8085/`, ensuite `https://tanchou.fr/`.
   Contrôle les pages, la fiche directe, les images, le CV et le catalogue JSON.
4. Mets à jour `COOLIFY_WEBHOOK_URL` vers la nouvelle ressource si le secret existe.
   Active ses déploiements automatiques et garde ceux de l'ancienne désactivés.
5. Une fois le site public validé, fusionne `codex/atelier-3d` vers `main`, change
   la branche de la nouvelle ressource vers `main` et redéploie. Vérifie le commit
   déployé et relance une collecte manuelle **Build Portfolio Projects** sur `main`
   pour confirmer que la chaîne JSON → commit → webhook fonctionne.

Le mappage hôte est exclusif : les deux conteneurs ne peuvent pas lier `8085`
en même temps. Coolify indique aussi qu'un mappage hôte empêche son remplacement
progressif habituel. Voir [How Applications Work](https://coolify.io/docs/applications/how-applications-work).
Si tu préfères éviter cette interruption, il faut modifier temporairement l'origine
Cloudflare Tunnel vers le port de test, puis reprendre `8085` plus tard ; c'est une
autre stratégie, qui exige la maîtrise et la validation de la configuration du tunnel.

## 5. Retour arrière

Si la nouvelle ressource échoue après le transfert : **Stop** sur la nouvelle,
vérifie que `8085` est libéré, puis **Start** sur l'ancienne ressource conservée.
Vérifie `tanchou.fr`. Restaure le webhook GitHub vers l'ancienne uniquement si le
workflow doit encore la déployer ; désactive les déploiements automatiques de la
ressource en échec. Si `main` a déjà été fusionnée, ne redéploie pas l'ancien
mode de service sur le nouveau code : garde l'ancienne image/branche, ou utilise
la branche d'archive avec ses anciens réglages.

Ne supprime l'ancienne ressource qu'après plusieurs collectes quotidiennes réussies
et quand le retour arrière n'est plus nécessaire. La suppression n'est pas une
condition du basculement.

## Build et contrôles locaux

Node compatible avec `package.json` (`^22.22.2`, `^24.15.0` ou `>=26`) :

```sh
npm ci
npm run check
npm run preview
```

`check` exécute les tests unitaires, les tests d'intégration, le build Vite et la
validation des fichiers produits. La sortie publique est `dist/`. Le test du
collecteur emploie une API GitHub simulée ; il ne déclenche ni webhook ni
synchronisation réelle. Le Dockerfile multistage a été construit et les six pages,
le JSON et le CV ont été servis dans un conteneur de test sans port publié.
