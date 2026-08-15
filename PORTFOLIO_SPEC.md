# Comment ajouter un projet au portfolio

Pour qu'un de tes repos GitHub apparaisse automatiquement sur [tanchou.fr](https://tanchou.fr), tu dois simplement créer un dossier `.portfolio/` à la racine du repo avec les fichiers suivants.

## Structure

```
mon-projet/
├── .portfolio/
│   ├── portfolio.json      ← obligatoire
│   ├── cover.png           ← image de couverture (page principale)
│   ├── screenshot1.png     ← screenshots (page détail)
│   ├── screenshot2.jpg
│   └── ...
├── src/
├── README.md
└── ...
```

## portfolio.json — tous les champs

```json
{
  "title": "Nom du projet affiché",
  "description": "Description courte (1-2 phrases). Affichée sur la carte ET en haut de la page détail.",
  "longDescription": "# Titre\n\nDescription longue en **Markdown**. Supporte les titres, listes, code, etc.\n\nAffichée uniquement sur la page de détail du projet.",
  "category": "Personal",
  "status": "In Progress",
  "date": "2026-04",
  "tags": ["Python", "QML", "Raspberry Pi"],
  "featured": false,
  "order": 1,
  "links": {
    "github": "https://github.com/Tanchouteur/mon-projet",
    "demo": "https://demo.example.com",
    "docs": "https://docs.example.com"
  }
}
```

## Référence des champs

| Champ | Type | Obligatoire | Valeur par défaut | Description |
|---|---|---|---|---|
| `title` | string | ✅ | — | Nom du projet affiché sur le portfolio |
| `description` | string | ✅ | — | Description courte (1-2 phrases max) |
| `longDescription` | string | — | `""` | Description complète en **Markdown** |
| `category` | string | — | `"Personal"` | `"Personal"`, `"Academic"`, ou `"Professional"` |
| `status` | string | — | `"Completed"` | `"In Progress"`, `"Completed"`, ou `"Archived"` |
| `date` | string | — | Date de création du repo | Format `YYYY-MM` ou `YYYY` |
| `tags` | string[] | — | Topics GitHub + langage principal | Technologies utilisées |
| `featured` | boolean | — | `false` | Si `true`, la carte prend 2 colonnes dans la grille |
| `order` | number | — | `999` | Ordre d'affichage (plus petit = premier) |
| `links` | object | — | URL du repo GitHub | Liens externes (`github`, `demo`, `docs`, `website`) |

## Convention d'images

| Nom de fichier | Rôle |
|---|---|
| `cover.png` / `cover.jpg` / `cover.webp` | **Couverture** : affichée sur la carte de la page principale ET en hero de la page détail |
| Tout autre fichier image | **Screenshot** : affiché dans la galerie de la page détail uniquement |

Formats acceptés : `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg`, `.avif`

## Workflow

```bash
# 1. Dans ton repo, créer le dossier
mkdir .portfolio

# 2. Créer portfolio.json
cat > .portfolio/portfolio.json << 'EOF'
{
  "title": "Mon Projet",
  "description": "Description courte du projet.",
  "category": "Personal",
  "status": "In Progress",
  "tags": ["Python", "Flask"]
}
EOF

# 3. Ajouter une image de couverture
cp screenshot.png .portfolio/cover.png

# 4. Committer et pusher
git add .portfolio/
git commit -m "feat: add portfolio metadata"
git push

# → Le portfolio se mettra à jour dans les 6 heures (ou manuellement via GitHub Actions)
```

## Retirer un projet

Supprime simplement le dossier `.portfolio/` et push. Le projet disparaîtra au prochain build.

```bash
git rm -r .portfolio/
git commit -m "chore: remove from portfolio"
git push
```

## Tester le build localement

```bash
cd tanchouteur.github.io

# Sans authentification (60 req/h max)
node scripts/build-projects.js --dry-run

# Avec token GitHub (recommandé, 5000 req/h)
GITHUB_TOKEN=ghp_xxxxx node scripts/build-projects.js --dry-run

# Build réel (télécharge les images et génère projects.json)
GITHUB_TOKEN=ghp_xxxxx node scripts/build-projects.js
```

## GitHub Actions — Déclenchement manuel

Sur [github.com/Tanchouteur/tanchouteur.github.io/actions](https://github.com/Tanchouteur/tanchouteur.github.io/actions), clique sur le workflow **"Build Portfolio Projects"** → **"Run workflow"** pour forcer une mise à jour immédiate.

## Token GitHub Actions

Le workflow utilise `secrets.PORTFOLIO_GITHUB_TOKEN` si défini, sinon `secrets.GITHUB_TOKEN` (token automatique avec droits limités aux repos publics).

Si tu veux que le workflow puisse accéder à des repos privés futurs, crée un token personnel (PAT) avec le scope `repo` (lecture seule) et ajoute-le dans **Settings → Secrets → Actions** du repo portfolio sous le nom `PORTFOLIO_GITHUB_TOKEN`.
