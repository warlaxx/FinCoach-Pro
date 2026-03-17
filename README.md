# FinCoach Pro

Application web de coaching financier personnel automatisé.
**Stack :** Java 21 + Spring Boot 3.2 · Angular 17 · PostgreSQL · Docker Compose

---

## Démarrage rapide (Docker)

### Prérequis
- Docker Desktop installé et démarré
- Git (pour cloner le projet)

### 1. Configurer l'environnement

```bash
cp .env.example .env
# Éditez .env avec vos valeurs (SMTP, OAuth2, etc.)
```

### 2. Lancer l'application

```bash
docker-compose up --build
```

- Frontend : **http://localhost:4200**
- Backend API : **http://localhost:8080**

---

## Développement local (sans Docker)

### Backend
```bash
cd backend
# .env est lu automatiquement au démarrage (DotenvEnvironmentPostProcessor)
./mvnw spring-boot:run
```

### Frontend
```bash
cd frontend
npm install --legacy-peer-deps
npm start
```

> Copiez `src/environments/environment.example.ts` en `environment.ts` et `environment.development.ts` si besoin.

---

## Variables d'environnement

Le fichier `.env` doit être placé dans `backend/` (ou à la racine du projet).
Il est chargé automatiquement au démarrage Spring Boot — pas besoin d'`export`.

| Variable | Description |
|----------|-------------|
| `POSTGRES_DB/USER/PASSWORD` | Credentials PostgreSQL |
| `JWT_SECRET` | Clé Base64 256-bit pour signer les tokens |
| `MAIL_HOST/PORT/USERNAME/PASSWORD` | SMTP (Resend, Gmail, SendGrid…) |
| `OPENAI_API_KEY` | Clé OpenAI (optionnel — démo sans clé) |
| `GOOGLE_CLIENT_ID/SECRET` | OAuth2 Google |
| `MICROSOFT_CLIENT_ID/SECRET` | OAuth2 Microsoft |
| `APPLE_CLIENT_ID/TEAM_ID/KEY_ID/PRIVATE_KEY` | Sign in with Apple |
| `FRONTEND_URL` | URL de redirection après OAuth2 (défaut : `http://localhost:4200`) |
| `TWELVEDATA_API_KEY` | Données boursières temps réel |

---

## Structure du projet

```
fincoach/
├── backend/                         # Spring Boot REST API
│   ├── src/main/java/com/fincoach/
│   │   ├── config/                  # Security, CORS, DotenvLoader
│   │   ├── controller/              # REST endpoints
│   │   ├── dto/                     # DTOs (Auth, Profile, Chat…)
│   │   ├── model/                   # Entités JPA
│   │   ├── repository/              # Spring Data repositories
│   │   ├── security/                # JWT, OAuth2, Apple secret
│   │   └── service/                 # Logique métier + IA
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   ├── db/migration/            # Flyway (V1–V4)
│   │   └── META-INF/spring/         # EnvironmentPostProcessor registration
│   └── Dockerfile
│
├── frontend/                        # Angular 17 SPA
│   ├── src/app/
│   │   ├── components/              # dashboard, chat, action-plan, auth, settings
│   │   ├── services/                # Auth, Chat, Profile, ActionPlan, TwelveData
│   │   └── models/                  # Interfaces TypeScript
│   ├── src/environments/            # environment.ts + environment.development.ts
│   └── Dockerfile
│
├── .env.example                     # Template des variables d'environnement
└── docker-compose.yml
```

---

## API REST – Endpoints

### Auth
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/register` | Inscription email/password |
| POST | `/api/auth/login` | Connexion email/password → JWT |
| GET | `/api/auth/verify-email` | Vérification d'email (lien envoyé par mail) |
| POST | `/api/auth/resend-verification` | Renvoi du lien de vérification |
| PUT | `/api/auth/profile` | Mise à jour profil (nom, âge, mot de passe) |
| GET | `/login/oauth2/code/google` | Callback OAuth2 Google |
| GET | `/login/oauth2/code/microsoft` | Callback OAuth2 Microsoft |
| GET | `/login/oauth2/code/apple` | Callback Sign in with Apple |

### Données
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/profile/{userId}` | Profil financier |
| POST | `/api/profile` | Créer/mettre à jour le profil |
| GET | `/api/actions/{userId}` | Liste des plans d'action |
| POST | `/api/actions` | Créer un plan d'action |
| PUT | `/api/actions/{id}/status` | Mettre à jour statut/progrès |
| DELETE | `/api/actions/{id}` | Supprimer un plan d'action |
| GET | `/api/chat/{userId}` | Historique du chat |
| POST | `/api/chat` | Envoyer un message à l'IA |
| DELETE | `/api/chat/{userId}` | Effacer l'historique |

---

## Technologies

| Composant | Technologie |
|-----------|-------------|
| Backend | Java 21, Spring Boot 3.2.3, Spring Data JPA, Flyway |
| Sécurité | Spring Security, JWT (jjwt 0.12.6), OAuth2 (Google, Microsoft, Apple) |
| Base de données | PostgreSQL |
| Mail | Spring Mail — SMTP (Resend par défaut) |
| Frontend | Angular 17, TypeScript 5.4 |
| UI | SCSS custom, thème dark luxury |
| IA | OpenAI GPT-4o Mini (optionnel — réponses démo sans clé) |
| Bourse | TwelveData API (données temps réel) |
| Containerisation | Docker, Docker Compose, Nginx |
| CI | GitHub Actions (build + lint backend & frontend) |

---

## Fonctionnalités implémentées

- [x] Inscription / connexion email + password
- [x] Vérification d'email (lien SMTP)
- [x] OAuth2 : Google, Microsoft, Sign in with Apple
- [x] JWT stateless (access token)
- [x] Paramètres de compte (nom, âge, changement de mot de passe)
- [x] Profil financier & score
- [x] Plans d'action
- [x] Chat IA (OpenAI ou réponses démo)
- [x] Données boursières temps réel (TwelveData)
- [x] Chargement automatique du `.env` au démarrage (sans Docker ni export)
- [x] CI GitHub Actions (backend Maven + frontend TypeScript)

## Roadmap

- [ ] Graphiques Chart.js (évolution mensuelle)
- [ ] Export PDF du bilan financier
- [ ] Module simulateur de crédit / retraite
- [ ] Notifications email (objectifs atteints)
- [ ] PWA (Progressive Web App)
