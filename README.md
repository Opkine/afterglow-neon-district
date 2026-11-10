# AFTERGLOW — Neon District

Jeu Android de puzzle à réactions en chaîne — **© 2026 LayAdam corp.**

> Une cité plongée dans le noir. Reliez trois cristaux ou plus, déclenchez des
> réactions spectaculaires et rallumez progressivement les quartiers.

## Version 1.1.0 — refonte graphique et sonore

La base jouable comprend :

- Commandes tactiles par glissement et système de chemins de couleur.
- Cristaux vectoriels facettés, relief, reflets, halos, chute animée et ondes de choc.
- Ondes spéciales pour les chaînes de 6+ et 9+ cristaux, combos et vibrations.
- 80 niveaux de campagne générés par des graines déterministes.
- Objectifs de deux couleurs, nombre de coups, étoiles et éclats.
- Ville cyberpunk en profondeur : architecture à trois plans, enseignes, lune,
  brumes atmosphériques, véhicules, reflets et éclairage progressif des quartiers.
- 10 effets sonores libres CC0 mixés par Howler.js, musique électro-ambient
  originale, réglages séparés musique/SFX et célébrations canvas-confetti.
- Typographie Inter locale, entièrement hors connexion.
- Défi quotidien déterministe, score et partage natif si disponible.
- Trois ambiances visuelles, avec déblocage uniquement par la monnaie gagnée.
- Sauvegarde automatique après chaque coup et reprise hors connexion.
- Interface tactile portrait, règles, options d'accessibilité et réinitialisation.
- Projet Android natif embarquant l'intégralité du jeu dans une WebView locale.

La **version Android 1.0.0 de développement** a été compilée avec succès par GitHub
Actions le 10 novembre 2026. La V1.1.0 ajoute les améliorations détaillées ci-dessus.
Ce dépôt ne constitue pas à lui seul une publication Google Play. L'installation
sur appareils physiques, la signature de production, la qualité graphique finale
et l'équilibrage doivent être validés avant de parler de version commerciale terminée.

## Jouer en local

```bash
python3 -m http.server 8765 --directory game
```

Ouvrir `http://127.0.0.1:8765/` dans un navigateur récent. Le jeu n'accède à
aucun service distant ; ses fichiers peuvent être mis en cache par la couche
Android pour un usage intégralement hors ligne.

## Obtenir une APK avec GitHub Actions

1. Dans le dépôt, ouvrir l'onglet **Actions**.
2. Choisir **Android APK** puis **Run workflow**.
3. Attendre le statut vert : les sources HTML/CSS/JS sont intégrées à l'APK.
4. Télécharger l'artefact **AFTERGLOW-v1.1-Android-debug-APK**.
5. Extraire `app-debug.apk` et l'installer sur un smartphone Android compatible.

**Attention :** APK de test (clé de débogage), pas APK commercial signé. Une
clé Android debug régénérée sur un nouveau runner CI peut empêcher une mise à
jour par-dessus une ancienne version : une signature stable est indispensable
pour les futures mises à jour sans désinstallation ni perte de sauvegarde. La
signature Play App Signing, la génération d'un fichier AAB de release, les tests
Samsung et la fiche Play Store restent à finaliser. L'application cible l'API 36
(Android 16), avec Android 8.0 comme version minimale.

## Organisation

```text
game/                      Jeu et ressources 100 % locaux, dépendances embarquées
android/                   Conteneur Android natif et interface immersive
.github/workflows/android.yml Compilation automatique APK de test
tests/                     Tests moteur et scénario de navigation mobile
docs/                      Dossier produit, stratégie et critères de sortie
THIRD_PARTY.md             Bibliothèques et licences redistribuées
```

## Tests

```bash
node tests/engine.cjs
```

Les tests du moteur couvrent le parcours de 80 niveaux et au moins 560 coups,
la chute des cristaux, le rendu Canvas avec contexte simulé, la persistance, la
graine quotidienne et les récompenses. `tests/smoke.cjs` est un test visuel
Playwright supplémentaire, à exécuter dans un environnement autorisant Chromium
et avec le serveur local actif.

## Confidentialité et propriété

- Aucune publicité, aucun achat réel et aucune bibliothèque de suivi.
- Aucune permission Internet : tout se joue et se sauvegarde localement.
- L'unique permission Android déclarée est la vibration (option désactivable).
- **Code visible publiquement, mais sans licence open source pour le moment.**
  © 2026 LayAdam corp. Tous droits réservés. Le choix d'une licence libre ou
  commerciale doit être fait par le titulaire des droits.

Voir [docs/PRODUCT.md](docs/PRODUCT.md) pour le produit cible et la grille QA,
et [PRIVACY.md](PRIVACY.md) pour la confidentialité. Les bibliothèques et sons
tiers sont documentés dans [THIRD_PARTY.md](THIRD_PARTY.md).
