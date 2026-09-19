# Validation de la refonte — 18 septembre 2026

## Périmètre livré

Accueil immersif nocturne avec portrait, nom en relief, parvis dans la brume,
entrée accélérée dans le tunnel et stations avec crans. Catalogue, fiches de projet,
Expertise, À propos, Lab et Contact refondus. Alimentation autonome `.portfolio/`
conservée, contrat enrichi de champs de présentation facultatifs.

## Preuves de validation

| Exigence                                | Preuve                                                                                                                                                                                                    |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Archive distante                        | `git ls-remote` confirme `codex/archive-portfolio-2026-09-18` au SHA `f544577a183e116a343be13a80ad9760c9ecb0a3`.                                                                                          |
| Données autonomes et rétrocompatibilité | Tests de collecte GitHub simulée jusqu'au contrat front-end ; dry-run sans écriture ; arrêt sur erreur API ; formats historiques, nouvelles catégories et 30 projets inconnus couverts.                   |
| Sécurité du contenu                     | Tests des URL, chemins, texte hostile et Markdown assaini ; liens publics de dépôts privés exclus.                                                                                                        |
| Parcours et crans                       | Tests de caméra monotone/bornée, raccord extérieur-intérieur, plage de lecture, direction des crans et panneau final. Contrôleur DOM testé au scroll, redimensionnement et changement de préférence.      |
| Mouvement réduit et secours             | Test sans import 3D en mouvement réduit, restauration des liens/catalogue ; import tardif/échoué ; échec réel de construction du renderer sans environnement WebGL avec contrôleur de secours utilisable. |
| Accueil rendu                           | Inspection à 1272 × 720 et 390 × 844 : nom, portrait, portail, bouton visibles. Largeur du document égale au viewport mobile.                                                                             |
| Navigation dans la scène                | Bouton d'entrée et geste court de défilement arrivent exactement à la première station (opacité 1, transformation nulle). Retour au début vérifié.                                                        |
| Galerie accessible                      | Dans le navigateur : ouverture de la première image, flèche droite vers 2/4, Échap, retour du focus sur la vignette d'origine.                                                                            |
| Pages secondaires                       | Expertise, À propos, Lab et Contact inspectés sur le build final à 333 px sans débordement horizontal. Menu mobile ouvert puis fermé avec Échap et focus restitué. Aucune erreur console observée.        |
| Build                                   | `npm run check` : tests unitaires/intégration, six pages, sept projets, fichiers et casse des chemins, budgets gzip.                                                                                      |
| Livraison Coolify                       | `docker build -t portfolio-atelier:validation .` réussi. `nginx -t` réussi et HTTP 200 sur les six pages, la fiche avec identifiant, le JSON et le CV depuis un conteneur éphémère sans port exposé.      |

Les résultats finaux sont de **15 tests unitaires et 12 tests d'intégration**.
JavaScript gzip : 31,6 Kio hors scène et 130,9 Kio pour la 3D différée,
sous les plafonds respectifs de 150 et 200 Kio. Vite émet un avertissement sur
la taille brute du module Three.js ; le budget compressé vérifié est respecté.

## Limites et exploitation

- Pas de mesure Lighthouse ni de benchmark sur un téléphone physique. Le contrôle
  mobile utilise un viewport de navigateur. Une perte GPU réelle en cours de session
  n'a pas été provoquée ; le chemin d'échec de création et l'indépendance du HTML
  sont testés, et le gestionnaire de perte de contexte libère le décor.
- Les tests de collecte utilisent une API simulée : ils ne déclenchent ni synchronisation
  réelle, ni webhook, ni modification des dépôts sources.
- Les réglages actuels de Coolify n'ont pas été inspectés. Le port 8085 provient de Nexus.
  Le Dockerfile et la procédure de bascule sont fournis ; leur activation relève du
  déploiement, qui n'est pas effectué ici. `main` reste inchangé.

La spécification consolidée est dans `REFONTE_SPEC.md`, le contrat dans
`../PORTFOLIO_SPEC.md` et les commandes de livraison/retour arrière dans `DEPLOYMENT.md`.

## Révision fluidité et parcours

Le recalage utilise une courbe quintique interruptible, sans zone morte dans le
scroll. Test d'intégration supplémentaire : position intermédiaire progressive,
annulation par nouveau geste, arrivée exacte, annulation en mouvement réduit.
La géométrie statique est fusionnée par matériau ; le nombre de lumières reste
constant ; les demandes de rendu sont regroupées ; le tampon est plafonné.

Mesure locale via `?perf` à 1440 × 900 : 20 appels de rendu à l'accueil,
10 à une station intérieure, temps CPU moyen de soumission observé de 0,36 ms
et 0,27 ms respectivement. La brume au repos tourne à 30 rendus/s. Ces relevés
ne constituent pas une mesure GPU ni une promesse de fréquence d'affichage.

La page À propos possède désormais une frise formation/expérience. La date de
l'alternance a été corrigée en septembre 2025 sur instruction de Louis. Les
cartes ENSIIE et EDF sont alignées, et la simultanéité est écrite explicitement.
La date de 2028 est marquée prévisionnelle.

Le Dockerfile a été reconstruit avec succès après ces derniers ajustements.
La suite `npm run check` a été relancée après ceux-ci avec succès.
La frise a été inspectée à 390 px, sans débordement visible.
