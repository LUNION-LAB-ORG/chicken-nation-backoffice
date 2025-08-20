# Chicken Nation Dashboard

Interface d'administration pour la plateforme Chicken Nation, développée avec Next.js, TypeScript et Tailwind CSS.

## Fonctionnalités

- **Authentification** : Système de connexion sécurisé pour les administrateurs
- **Gestion des menus** : Interface pour ajouter, modifier et supprimer des produits
- **Gestion des commandes** : Suivi et traitement des commandes en temps réel
- **Gestion des réservations** : Système de réservation de tables
- **Statistiques** : Tableaux de bord avec analyses des ventes et performances

## Technologies utilisées

- **Next.js 15** : Framework React avec rendu côté serveur
- **TypeScript** : Typage statique pour un code plus robuste
- **Tailwind CSS** : Framework CSS utilitaire pour un design responsive
- **Lucide React** : Bibliothèque d'icônes SVG
- **Zustand** : Gestion d'état global

## Structure du projet

```
chicken-nation/
├── src/
│   ├── app/                    # Routes de l'application
│   │   ├── login/              # Page de connexion
│   │   └── (authenticated)/    # Routes protégées
│   ├── components/             # Composants réutilisables
│   │   ├── auth/               # Composants d'authentification
│   │   └── ui/                 # Composants d'interface
│   ├── lib/                    # Utilitaires et fonctions
│   ├── store/                  # Gestion d'état global
│   └── assets/                 # Ressources statiques
├── public/                     # Fichiers publics
│   ├── images/                 # Images
│   └── fonts/                  # Polices
└── tailwind.config.js          # Configuration Tailwind
```

## Installation
 1. Cloner le dépôt
    
2. Installer les dépendances
   ```bash
   npm install
   ```

3. Lancer le serveur de développement
   ```bash
   npm run dev
   ```

4. Ouvrir [http://localhost:3020](http://localhost:3020) dans votre navigateur
 
## Déploiement

Le projet peut être déployé sur Vercel  

```bash
npm run build
npm start
```

## Licence

Propriétaire - Tous droits réservés © Chicken Nation

## ✅ Corrections récentes

### Permissions RBAC mises à jour pour ADMIN et MANAGER

**Changements ADMIN :**
- ✅ **Restaurants** : Peut maintenant créer, modifier et supprimer des restaurants
- ✅ **Menus/Plats** : Peut maintenant créer, modifier et supprimer des menus  
- ✅ **Commentaires clients** : Peut voir tous les commentaires des clients
- ✅ **Catégories/Suppléments** : Peut maintenant modifier (en plus de créer/supprimer)

**Changements MANAGER :**
- ❌ **Module Restaurants** : N'apparaît plus dans la sidebar (les managers ne gèrent que leur propre restaurant, pas la liste globale)
- ✅ **Autres permissions** : Conserve l'accès aux commandes, clients, utilisateurs de son restaurant

**Modules concernés :**
- `src/utils/rbac.ts` - Matrice des permissions mise à jour
- `src/components/auth/AccessControl.tsx` - Permissions interface mises à jour  
- `src/hooks/useRBAC.ts` - Ajout de `canViewClientComments()`
- `src/components/gestion/Sidebar.tsx` - Utilise déjà les permissions RBAC

**Test des permissions :**
- ADMIN : Voit le module "Restaurants" dans la sidebar et peut créer/modifier/supprimer
- MANAGER : Ne voit plus le module "Restaurants" dans la sidebar
- Tous les autres modules conservent leurs permissions selon la matrice RBAC

### Problème de sélection des clients résolu
"# chicken-nation-dashboard" 
