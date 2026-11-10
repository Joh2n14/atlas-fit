# ATLAS Fit — application de musculation personnelle

Version 1.3.1 — Novembre 2026

Cette application est **gratuite**, sans abonnement, sans publicité, sans compte, et conçue pour iPhone, iPad et navigateur de bureau.

## Fonctionnalités

- 84 exercices couvrant 10 groupes musculaires, avec conseils techniques, recherche, filtres et favoris.
- Huit démonstrations animées dans la bibliothèque, disponibles hors ligne. Les positions de départ et de fin sont affichées côte à côte si la réduction des animations est activée.
- Génération d'un programme hebdomadaire de 2 à 6 séances, selon l'objectif, le niveau, la durée et le matériel.
- Modification du programme : ajout/retrait d'exercices, nombre de séries, régénération.
- Séances actives : charges en kg, répétitions ou secondes, séries validées, notes et minuteur de repos.
- Historique, volume des charges, courbe de performance par exercice, estimation du 1RM (formule d'Epley) et répartition des séries par muscle principal.
- Relevés du poids corporel, export/import de sauvegarde JSON.
- Journal nutritionnel, recherche de références alimentaires et calcul par quantité consommée.
- Fonctionnement hors ligne après la première visite réussie de l'application installée via HTTPS.

## Installation gratuite iPhone / iPad avec GitHub Pages

L'application utilise des fichiers HTML, CSS et JavaScript statiques. Aucun serveur applicatif ni base de données n'est requis.

1. Créer un compte gratuit sur [github.com](https://github.com/) (si nécessaire).
2. Créer un nouveau dépôt **public** nommé `atlas-fit` (sur GitHub Free, Pages nécessite un dépôt public).
3. Décompresser l'archive ZIP de l'application.
4. Sur GitHub, ouvrir le dépôt puis cliquer **Add file → Upload files**. Transférer les fichiers de l’archive à la racine du dépôt, dont `index.html`, `app.js`, `data.js`, `exercise-demos.js`, `atlas-v3.js`, `nutrition-smart.js`, `manifest.webmanifest`, `sw.js` et les deux icônes.
5. Valider le téléversement avec **Commit changes**.
6. Ouvrir **Settings → Pages → Build and deployment**. Sous **Source**, choisir **Deploy from a branch**, puis sélectionner **main** et **/(root)**, puis **Save**.
7. Ouvrir l'URL HTTPS affichée dans **Settings → Pages → Visit site** après publication.
8. Sur iPhone ou iPad, ouvrir cette URL dans **Safari**, puis **Partager → Sur l'écran d'accueil → Ajouter**. Selon iOS, choisir éventuellement **Ouvrir comme app web**.
9. Lancer ATLAS Fit depuis son icône. Créer son profil et son programme.

Pour passer de la version 1.3 à la version 1.3.1, ajouter `exercise-demos.js` et remplacer `index.html`, `app.js`, `sw.js` et `README.md` à la racine du dépôt. Conserver la même adresse de publication pour retrouver les données locales.

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

## Recherche nutritionnelle

Dans **Nutrition**, saisis un nom (« 2 tranches de jambon »), un nom avec une marque (« jambon Monique Ranou »), une marque en sélectionnant **Marque exacte**, ou le code-barres du paquet. La recherche par nom classe en tête les résultats de la page référencés en France. Les enseignes proviennent des fiches collaboratives et peuvent être absentes ou anciennes.

L’application distingue une portion déclarée sur la fiche et le poids moyen calculé si le conditionnement indique à la fois le nombre de tranches et le poids total. Une portion indiquée uniquement en grammes ne suffit pas à établir le poids d’une tranche. Si le poids manque, saisis la quantité d’après l’emballage ou une pesée. La fiche reste liée dans le journal. En cas de panne, utilise la saisie manuelle, l’exemple ou tes favoris. Le lien vers la recherche sur Open Food Facts permet aussi de retrouver un code-barres à saisir.

### Sources et droits d’accès vérifiés le 10 novembre 2026

| Source | Accès retenu |
| --- | --- |
| **Open Food Facts** | API publique en lecture. Base sous ODbL et contenus individuels sous DbCL. Attribution et lien vers la fiche dans l’application. Aucun visuel de produit réutilisé. [Documentation API](https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/) · [Licences](https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/tutorials/license-be-on-the-legal-side/) |
| **Jow** | Aucune API publique documentée trouvée pour ce besoin. Les CGU réservent la plateforme aux consommateurs et prévoient une autorisation expresse pour réutiliser les contenus de Jow. La page de partenariat donne un point de contact. Une intégration demanderait un accord couvrant les champs, le mode d’accès, les quotas et les droits sur les contenus des marchands. [CGU Jow](https://jow.fr/lp/misc/cgu-v8-20260518) · [Partenariats](https://jow.fr/pages/misc/devenir-partenaire) |
| **Intermarché** | Aucune API publique de catalogue avec droit de réutilisation identifiée. Les articles 5 et 7 limitent l’usage des contenus et prévoient une autorisation écrite préalable pour les réutiliser hors cadre privé. [CGU Intermarché](https://www.intermarche.com/informations-legales/conditions-generales-utilisation) |
| **Carrefour, Auchan, E.Leclerc** | Aucune API publique documentée et autorisée identifiée pour réutiliser les fiches des catalogues grand public. [CGU Carrefour](https://www.carrefour.fr/conditions-generales-utilisation) · [CGU Auchan](https://www.auchan.fr/cgu/ep-cgu) · [Catalogue E.Leclerc](https://faq.e.leclerc/hc/fr/articles/360014892877-Comment-consulter-le-catalogue-et-les-promotions-E-Leclerc) |

Open Food Facts reçoit les termes recherchés ou le code-barres lorsqu’une recherche est lancée. Le journal, le profil et les favoris restent dans le stockage local du navigateur. Les résultats sont mis en mémoire pour la session. Le site reste statique, sans clé ni compte tiers.

La recherche textuelle utilise le point d’accès historique documenté `/cgi/search.pl`. Il a répondu aux essais, avec des indisponibilités ponctuelles. Le moteur dédié Search-a-licious a refusé les requêtes navigateur provenant de GitHub Pages lors des essais. La recherche par marque et la lecture des fiches utilisent les routes v2 documentées. L’application espace les recherches textuelles et traite les délais d’attente et les quotas. [Référence des points d’accès Open Food Facts](https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/ref-cheatsheet/)

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
