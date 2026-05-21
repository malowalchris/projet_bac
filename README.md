# Mes Courses Faciles - Plateforme E-Commerce Marketplace B2C

Ce projet est une refonte complète et certifiée d'une application e-commerce multi-magasin (initialement en PHP/HTML) vers une architecture moderne utilisant **Next.js 15**, **React 19**, **Tailwind CSS 4**, et **Prisma 6**.

## 🚀 État du Projet

L'application a été auditée et migrée vers un socle technique robuste. Les fonctionnalités clés implémentées incluent :
- **Audit & Certification** : Analyse approfondie des failles legacy et validation par tests unitaires/intégration.
- **Frontend Instantané** : Utilisation de Skeletons (`loading.tsx`) et optimisation Next/Image pour une fluidité maximale.
- **Logique Métier B2C** : Gestion de panier multi-magasins (un panier par magasin) conforme au cahier des charges.
- **Admin Dashboard** : Gestion des commandes et statistiques de vente.
- **Paiements Mobiles** : Préparation de l'intégration Airtel Money / Moov Money.
- **Performance** : Optimisation des composants avec React Server Components et gestion asynchrone des données.

## 🛠 Structure du Projet

- `/mes-courses-faciles-app` : Application principale Next.js.
- `AUDIT_FINAL_ET_ROADMAP.md` : Rapport d'audit détaillé et stratégie de migration.
- `/Assets`, `/view` : Anciens fichiers sources (Legacy) pour référence.

## 🏁 Démarrage Rapide

1. Entrez dans le dossier de l'application :
   ```bash
   cd mes-courses-faciles-app
   ```

2. Installez les dépendances :
   ```bash
   npm install
   ```

3. Configurez la base de données (MySQL via XAMPP) :
   - Assurez-vous que MySQL est lancé dans votre panneau XAMPP.
   - Créez une base de données nommée `mes_courses_faciles` dans phpMyAdmin.
   - Configurez l'environnement :
   ```bash
   # Sur Windows (PowerShell)
   copy .env.example .env

   # Sur Linux/Mac
   cp .env.example .env

   npx prisma generate
   npx prisma db push
   ```

4. Lancez le serveur de développement :
   ```bash
   npm run dev
   ```

## 🔒 Sécurité
Contrairement à l'ancienne version, les mots de passe sont hachés avec `bcrypt` et les requêtes SQL sont sécurisées via l'ORM Prisma, éliminant les risques d'injection SQL identifiés lors de l'audit.
