# ASTRA TIDE — Les Jardins du Vide

Jeu Android autonome et original de LayAdam corp. **Prototype jouable de la nouvelle série**, version `0.1.0-preview`, entièrement hors ligne.

## Le principe

Le joueur n'échange pas des tuiles et ne contrôle pas directement un héros : son doigt devient un **champ gravitationnel** qui attire des étoiles vivantes. Il doit courber leurs trajectoires afin de les guider vers des portails de la bonne couleur. Si une étoile entre dans une mauvaise destination, rencontre une anomalie ou tombe hors de la scène, une vie est perdue.

La simulation fonctionne en temps réel et les trajectoires continuent de vivre quand le joueur retire son doigt. La **pulsation astrale**, alimentée par des captures successives, propulse temporairement toutes les étoiles vers leurs portails.

## Contenu de cette première édition

- 24 chapitres aux paramètres progressifs ; une, puis deux, puis trois destinations.
- Courants latéraux, singularités mouvantes et pluies de météores à partir des chapitres avancés.
- Défi quotidien basé sur une graine déterministe à la date du jour en France.
- Combos, score, trois étoiles de maîtrise, récompenses en éclats et 24 constellations à révéler.
- Atelier d'améliorations : diamètre du champ, bouclier absorbant, harmonies de couleur.
- Illustration de fond originale, illustration interactive des constellations, particules, réactions lumineuses, musique et effets procéduraux.
- Tutorial tactile, pause, vibrations, réglages d'accessibilité, sauvegarde locale et restauration de la partie.
- APK Android immersive, sans compte, publicité, serveur, paiement, SDK de suivi ou connexion réseau.

## Construire

```bash
node --test tests/engine.cjs tests/assets.cjs
mkdir -p android/app/src/main/assets/game
cp -R game/. android/app/src/main/assets/game/
gradle -p android :app:assembleDebug
```

Nécessite JDK 17, Android SDK 36, Gradle 8.13. La CI GitHub Actions construit automatiquement un APK debug d'essai sur la branche `astra-tide`.

## Limites et suite de production

Cette version est **jouable mais pas une version commerciale finale**. L'équilibrage de tous les niveaux, la rétention à moyen terme, la validation sur différentes gammes de téléphones, l'accessibilité approfondie, les effets animés 3D et une musique enregistrée par un compositeur restent à valider. Les 24 chapitres partagent encore la mécanique principale. Le jeu ne promet pas d'originalité absolue ni de succès commercial garanti. Une release Google Play nécessitera un AAB signé avec clé privée sécurisée, des captures Play Store, une fiche de confidentialité et des tests humains.

© 2026 LayAdam corp. Tous droits réservés sur le code et l'identité visuelle originaux, sauf dépendances identifiées. Aucun asset tiers n'est utilisé dans la version de base.
