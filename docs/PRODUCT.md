# AFTERGLOW — dossier de produit et critères de sortie

**Propriétaire** : LayAdam corp · **Plateforme** : Android portrait 9:16 ·
**Positionnement** : puzzle hybride / arcade accessible · **Date** : 10/11/2026.

## Promesse en trois secondes

> Glisse sur les néons de même couleur. Une grande chaîne explose et rallume un
> immeuble. Peux-tu faire renaître la ville entière ?

### Boucles de rétention

| Période | Récompense ludique | Implémentation v1 |
| --- | --- | --- |
| 15–60 secondes | Chaîne lumineuse, explosion, score | Oui |
| 3–5 minutes | Objectifs, étoiles, nouvelle rue | Oui |
| Plusieurs sessions | Restauration de la cité, thèmes | Oui, visuel procédural |
| Quotidienne | Grille du jour reproductible, score à partager | Oui, local |
| Long terme | 80 niveaux, huit quartiers | Oui, génération déterministe |

**Différenciation :** des chaînes traçables à un doigt déclenchent une
réanimation visible de la même métropole. C'est une combinaison de mécaniques
connues et d'une mise en scène particulière, pas une invention garantie inédite.

## Public et monétisation

- Joueurs occasionnels 13+, sessions brèves et commandes sans apprentissage long.
- Première phase : expérience entièrement gratuite et hors ligne.
- Pour une sortie commerciale, étudier un achat unique de thèmes, ou des
  publicités récompensées facultatives uniquement après un test de rétention.
- Pas de points d'énergie payants, pas de paiement nécessaire pour finir le jeu.
- Les paiements éventuels devront être intégrés via Google Play Billing,
  testés en bac à sable et couverts par une nouvelle déclaration de données.

## Distribution et qualité : définition de « prêt à publier »

- [x] Base de jeu et rendu natif Android conçu pour la lecture hors ligne.
- [x] Gestion des 80 niveaux, défis, progression, effets et paramètres.
- [x] Tests unitaires déterministes du moteur (80 niveaux / 560 coups).
- [ ] APK Android compilée par GitHub Actions, artefact téléchargé et vérifié.
- [ ] Installation/désinstallation/mise à jour sur un Samsung Galaxy récent.
- [ ] Contrôle du plein écran immersif et des gestes système sur Android 16.
- [ ] Revue graphique réelle sur téléphones 720p, 1080p, 1440p.
- [ ] 100 parties humaines, validation du taux d'échec et de la difficulté.
- [ ] Tests de perte/reprise, langue, accessibilité, performances et batterie.
- [ ] Test AAB de release avec une clé sécurisée et Play App Signing.
- [ ] Icône, captures magasin, vidéo de présentation et déclaration Play Console.
- [ ] Bêta fermée, collecte consentie des retours, résolution des bugs critiques.

## Hypothèses à mesurer en bêta

- Compréhension du geste en moins de 20 secondes.
- Au moins trois parties volontaires lors de la première session.
- Moins de 1 % de sessions avec erreur bloquante.
- Rétention J1 à comparer à la médiane mobile du rapport GameAnalytics 2026,
  environ 22 % (données 2025) ; objectif expérimental initial : 35 %.
- Progression J7/J30, durée de session, partage organique, sans télémétrie
  intrusive et seulement après choix d'un dispositif de mesure respectueux.

Ces cibles sont des **hypothèses de produit**, pas des chiffres observés ni des
promesses de revenus. La réputation du jeu dépendra des tests et des corrections.

## Risques et limites connus

1. Le moteur de campagne est procédural, pas encore une sélection de niveaux
   travaillés à la main : l'équilibrage doit être confirmé avec des joueurs.
2. L'apparence actuelle est en Canvas et CSS. Elle est soignée mais le rendu
   de chaque Android/WebView n'a pas été inspecté visuellement.
3. L'application n'a pour l'instant ni serveur, ni classement mondial,
   ni monétisation — choix volontaire pour une V1 stable et vérifiable.
4. Les thèmes n'ont aucun avantage sur la difficulté. La campagne est rejouable.

## Bande-annonce courte à produire

**0–2 s** : métropole sombre, écran « ALLUME CETTE VILLE ».
**2–5 s** : doigt reliant six cristaux, onde de choc, 100 fenêtres qui
s'illuminent. **5–8 s** : vue de la ville après plusieurs niveaux. **8–11 s** :
défi du jour, score et appel à battre ce score.

Créer les vidéos à partir de véritables captures du jeu testé, pas de scènes
publicitaires impossibles à reproduire en jeu.
