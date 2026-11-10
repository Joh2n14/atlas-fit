# ATLAS Fit — application de musculation personnelle

Version 1.0 — Novembre 2026

Cette application est **gratuite**, sans abonnement, sans publicité, sans compte, et conçue pour iPhone, iPad et navigateur de bureau.

## Fonctionnalités

- 84 exercices couvrant 10 groupes musculaires, avec conseils techniques, recherche, filtres et favoris.
- Génération d'un programme hebdomadaire de 2 à 6 séances, selon l'objectif, le niveau, la durée et le matériel.
- Modification du programme : ajout/retrait d'exercices, nombre de séries, régénération.
- Séances actives : charges en kg, répétitions ou secondes, séries validées, notes et minuteur de repos.
- Historique, volume des charges, courbe de performance par exercice, estimation du 1RM (formule d'Epley) et répartition des séries par muscle principal.
- Relevés du poids corporel, export/import de sauvegarde JSON.
- Fonctionnement hors ligne après la première visite réussie de l'application installée via HTTPS.

## Installation gratuite iPhone / iPad avec GitHub Pages

L'application utilise des fichiers HTML, CSS et JavaScript statiques. Aucun serveur applicatif ni base de données n'est requis.

1. Créer un compte gratuit sur [github.com](https://github.com/) (si nécessaire).
2. Créer un nouveau dépôt **public** nommé `atlas-fit` (sur GitHub Free, Pages nécessite un dépôt public).
3. Décompresser l'archive ZIP de l'application.
4. Sur GitHub, ouvrir le dépôt puis cliquer **Add file → Upload files**. Transférer les fichiers du dossier (dont `index.html`, `app.js`, `data.js`, `manifest.webmanifest`, `sw.js`, `icon-192.png`, `icon-512.png`, `.nojekyll`). Les placer **à la racine** du dépôt, pas dans un sous-dossier `atlas-fit`.
5. Valider le téléversement avec **Commit changes**.
6. Ouvrir **Settings → Pages → Build and deployment**. Sous **Source**, choisir **Deploy from a branch**, puis sélectionner **main** et **/(root)**, puis **Save**.
7. Ouvrir l'URL HTTPS affichée dans **Settings → Pages → Visit site** après publication.
8. Sur iPhone ou iPad, ouvrir cette URL dans **Safari**, puis **Partager → Sur l'écran d'accueil → Ajouter**. Selon iOS, choisir éventuellement **Ouvrir comme app web**.
9. Lancer ATLAS Fit depuis son icône. Créer son profil et son programme.

Documentation officielle :
- [GitHub — Créer un site GitHub Pages](https://docs.github.com/fr/pages/getting-started-with-github-pages/creating-a-github-pages-site)
- [GitHub — Configurer la source de publication](https://docs.github.com/fr/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Apple — Ajouter un site à l'écran d'accueil](https://support.apple.com/fr-fr/guide/iphone/iph42ab2f3a7/ios)

### Tester sur ordinateur

Ouvrir `index.html` depuis un petit serveur local (par exemple `python -m http.server 8000` dans le dossier et `http://localhost:8000`), ou utiliser l'HTML de démonstration autonome fourni séparément. Pour installer l'application sur l'écran d'accueil et bénéficier du mode hors ligne, il faut la servir via HTTPS.

## Sauvegardes et confidentialité

Les données d'entraînement restent dans l'espace de stockage local du navigateur / de l'application web sur l'appareil utilisé. Elles ne sont **pas transmises au serveur** par le code ATLAS Fit et ne sont **pas synchronisées** automatiquement entre les appareils. Le navigateur peut effacer ce stockage : utilisez régulièrement **Profil → Exporter JSON**. Pour transférer des données d'un appareil à l'autre, exportez depuis le premier puis utilisez **Importer JSON** sur le second.

**Attention : ne publiez jamais votre fichier de sauvegarde JSON dans le dépôt GitHub public.** Le dépôt public ne doit contenir que le code, les images de l'icône et les fichiers statiques fournis dans l'archive.

Le code public n'inclut pas vos données personnelles. L'hébergeur peut collecter des données techniques de consultation selon ses propres règles.

## Limites de cette première version

- Pas de vidéos ni animations des exercices ; les indications sont textuelles.
- Pas de synchronisation cloud, compte, Apple Santé, Apple Watch ou notifications push.
- Le poids corporel est suivi mais **ne sert pas à déduire automatiquement la charge** adaptée à chaque exercice.
- La durée visée des séances est indicative et non garantie par la longueur du programme.
- Le suivi des charges externes n'inclut pas le poids du corps dans le « volume ».
- Le programme est général et ne remplace pas l'évaluation d'un professionnel en cas de douleur, blessure ou maladie.

## Référence méthodologique

Currier B. S. et coll. (2026), « American College of Sports Medicine Position Stand. Resistance Training Prescription for Muscle Function, Hypertrophy, and Physical Performance in Healthy Adults: An Overview of Reviews », *Medicine & Science in Sports & Exercise*, 58(4), 851–872. DOI : [10.1249/MSS.0000000000003897](https://pubmed.ncbi.nlm.nih.gov/41843416/).

Le programme est une proposition pratique conçue pour ATLAS Fit, pas la reproduction directe des protocoles de cette revue scientifique. Il ne promet pas de résultat individuel.

## Structure

- `index.html` : interface et CSS responsive
- `data.js` : bibliothèque d'exercices
- `app.js` : gestion du programme, séances, historique et statistiques
- `manifest.webmanifest` : installation en application web
- `sw.js` : ressources accessibles hors ligne
- `icon-192.png`, `icon-512.png` : icônes
- `.nojekyll` : hébergement statique GitHub Pages

Aucune bibliothèque externe, aucun service payant et aucune clé API.
