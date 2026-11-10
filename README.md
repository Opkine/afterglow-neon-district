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
- Ambiance acoustique originale procédurale hors ligne, vibrations et sauvegarde locale.
- Fonctionnement Android immersif autonome, sans connexion, compte, publicité, achat ni suivi.

## Mise à jour Android v0.2.0

L'APK de test est signé automatiquement sur GitHub Actions avec une clé de débogage éphémère. **Pour ne pas risquer de perdre les sauvegardes de la v0.1.0, la v0.2.0 s'installe à côté de l'ancienne application** sous le nom « PALIMPSESTE AIDE » (package indépendant `com.layadam.palimpseste.preview02`). La progression commence donc à zéro dans cette nouvelle version ; ne désinstallez pas l'ancienne tant que vous souhaitez conserver sa sauvegarde. Une clé de signature durable sera nécessaire avant la publication et pour les vraies mises à jour. Les aides fonctionnent sans Internet.

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
