# PALIMPSESTE — Les Objets Mentent

**Dossier 001 : La disparue de la chambre 307** · Jeu d'enquête narratif pour Android · © 2026 LayAdam corp.

Une expérience entièrement distincte des projets AFTERGLOW et ASTRA TIDE, avec graphismes peints originaux, interface de carnet d'enquête, jeu d'exploration et reconstruction de souvenirs.

## Expérience jouable

- Trois environnements originaux, illustration gouache cinématographique : chambre 307, grand hall, verrière.
- Douze objets manipulables, chacun ayant quatre scènes de mémoire à consulter sur une ligne de temps.
- Preuves à consigner au moment exact du souvenir significatif.
- Guide interactif dès la première enquête et bouton « COMMENT JOUER » toujours disponible.
- **Aide graduelle** pour chacun des douze objets : trois indices à la demande, du conseil discret à l'explication précise.
- Mise en évidence des instants où une preuve peut être consignée ; le joueur n'a plus à deviner si le curseur est au bon endroit.
- **Carnet orienté objectifs** : cinq preuves déterminantes, au moins six souvenirs au total, prochaine piste localisée et repère directement souligné dans le décor.
- Aide à la déduction en trois niveaux, ciblée sur la réponse encore incorrecte.
- Deux témoins illustrés (Nina et Louis) avec trois questions chacun.
- Carnet d'enquête persistant et carte des lieux non linéaire.
- Déduction finale sur trois axes (responsable, mobile, preuve), conditionnée par des indices essentiels.
- Deux fins narratives différentes selon le choix du joueur.
- Bandes-son originales intégrées, transitions musicales entre les lieux, bruitages propres aux objets, vibrations et sauvegarde locale.
- Fonctionnement Android immersif autonome, sans connexion, compte, publicité, achat ni suivi.

## Mise à jour Android v0.4.0 — Ambiances de lieux vivantes

- **Trois compositions originales entièrement réarrangées, nettement plus longues** : Chambre 307 (88 s, valse d’ombres), Grand hall (91 s, jazz noir rythmé), Jardin sous verre (93 s, folk/chambre onirique). Elles sont jouées depuis l’APK, même hors connexion. Chaque piste contient des arrangements plus fournis, de nouvelles sections mélodiques et davantage d’instruments et de percussions ; génération reproductible via `tools/arrange_v4.py`.
- **Changement automatique à chaque lieu** : quand on quitte la chambre pour le hall puis le jardin, la musique passe à son thème avec un fondu croisé de 1,4 seconde. Pas de liste musicale à manipuler pendant l’exploration.
- **Import musical supprimé** intégralement, y compris le sélecteur de documents Android, l’accès aux contenus utilisateur et le stockage de morceaux dans l’application.
- **17 bruitages intégrés en Ogg Vorbis**, entre 0,9 et 3,4 secondes : mécanisme d’horloge, valise, papier, vent, registre, cloche, pluie, télégramme, appareil photo, trousseau, porte, découverte d’indice, curseur temporel, notification, témoignage, résolution et erreur. Génération reproductible via `tools/foley_v4.py`. Les différentes preuves déclenchent des signatures sonores différentes.
- **Animation Canvas 2D dédiée à chaque lieu**, au-dessus des illustrations, sans bloquer les objets à toucher : pluie en mouvement et lumière instable dans la chambre, lustres et poussières éclairées dans le hall, dizaines de lucioles, pétales et rayons lumineux sous la verrière. Effets de lumière et transitions de scènes plus visibles. L’animation se limite à 30 images/seconde et respecte l’option d’animations réduites d’Android.
- Volumes séparés et deux interrupteurs musique/bruitages. Notifications et confirmation restent intégrées au jeu, sans boîtes de dialogue système.
- Pour préserver les anciennes préversions signées avec des clés temporaires, installation côte à côte sous `com.layadam.palimpseste.preview04` (« PALIMPSESTE V0.4 »). Cette nouvelle préversion démarre avec sa propre sauvegarde.

## Mise à jour Android v0.3.0 (historique)

- Trois premiers morceaux instrumentaux de 37 à 43 secondes et import musical personnel, **remplacés dans la v0.4**.
- Réglages distincts du volume de la musique et des bruitages ; interrupteurs indépendants pour les désactiver.
- Douze identités sonores différentes pour les objets inspectés : mécanique, papier, clochette, serrure, télégramme, pluie, etc.
- Décors animés discrètement (flammes lumineuses, poussières, lucioles, transitions de scènes), portraits et souvenirs vivants, révélations mises en scène ; réduction des animations respectée.
- Notifications contextuelles dans le jeu et **confirmation personnalisée** pour recommencer, sans fenêtre système de navigateur.
- Écran final défilant avec illustration de fond maintenue sur toute sa hauteur.

L'APK de test est signé automatiquement sur GitHub Actions avec une clé de débogage éphémère. Les préversions v0.3 et v0.4 s’installent chacune à côté des anciennes applications afin d’éviter tout risque de perte de sauvegarde. Une clé de signature durable sera nécessaire avant la publication et pour les vraies mises à jour. Les aides et musiques intégrées fonctionnent sans Internet.

## Construire et tester

```sh
node --test tests/*.cjs
mkdir -p android/app/src/main/assets/game
cp -R game/. android/app/src/main/assets/game/
gradle -p android :app:assembleDebug
```

JDK 17, Gradle 8.13, SDK Android 36. La branche `palimpseste` déclenche une compilation APK de test sur GitHub Actions.

## État du projet

Cette édition est un **premier dossier complet sur le plan logique et narratif** et une **version de démonstration technique**, pas un jeu commercial final ni une promesse de succès. L'illustration des scènes est fixe avec couches et hotspots interactifs ; le projet n'a pas encore de personnages animés en mouvement, voix enregistrées, scènes cinématiques multi-plans ni dizaines d'enquêtes. La qualité perçue et l'ergonomie réelle doivent être validées sur téléphone. La suite devra privilégier de nouveaux systèmes d'investigation et une histoire solide plutôt que multiplier artificiellement le nombre de niveaux.

## Direction artistique

Illustrations originales générées par imagegen pour ce projet, puis intégrées sous forme de ressources WebP : chambres, hall et verrière de l'Hôtel des Écumes, portraits de Nina et Louis. Les interactions et l'interface sont originales et codées sur mesure. Aucune ressource de AFTERGLOW ou ASTRA TIDE n'est chargée.

Tous droits réservés LayAdam corp., 2026. Aucun asset ni SDK tiers n'est redistribué ; les dépendances AndroidX et outils de build restent soumis à leurs licences respectives.
