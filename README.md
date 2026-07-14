# AzulLink — MVP Écotourisme Khénifra

Plateforme d'écotourisme immersif connectant voyageurs, prestataires locaux et
richesses naturelles/culturelles de la région de Khénifra.

## Stack technique
- Node.js + Express (serveur)
- EJS (templates server-side)
- lowdb (base de données JSON fichier — simple et suffisante pour un MVP)
- Bootstrap 5 + Bootstrap Icons (interface)
- Leaflet + OpenStreetMap (carte interactive, sans clé API)
- Service Worker basique (mode hors-connexion)

## Lancer en local
```bash
npm install
npm run seed     # initialise la base avec des données de démo
npm start        # démarre le serveur sur http://localhost:3000
```

## Comptes de démonstration
| Rôle | Email | Mot de passe |
|---|---|---|
| Administrateur | admin@azulink.ma | admin123 |
| Prestataire | prestataire@azulink.ma | provider123 |
| Voyageur | voyageur@azulink.ma | voyageur123 |

## Déploiement (Render.com — gratuit)
1. Créez un compte sur https://render.com (connexion via GitHub).
2. New + → Web Service → connectez ce dépôt GitHub.
3. Build command : `npm install && npm run seed`
4. Start command : `npm start`
5. Déployez — Render fournit une URL publique en HTTPS.

## Structure du projet
```
server.js          point d'entrée
routes/             routes Express (public, auth, réservation, espaces voyageur/prestataire/admin)
views/              templates EJS
public/             CSS, JS, manifest PWA, service worker
data/               base de données (lowdb) + script de seed
middleware/         authentification par session
```
