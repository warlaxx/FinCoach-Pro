# 💰 FinCoach Pro

Application web de coaching financier personnel automatisé.
**Stack :** Java 17 + Spring Boot 3 (REST API) · Angular 17 · Docker Compose

---

## 🚀 Démarrage rapide (Docker)

### Prérequis
- Docker Desktop installé et démarré
- Git (pour cloner le projet)

### 1. Lancer l'application (mode démo sans IA)

```bash
# Cloner le projet
git clone <votre-repo>
cd fincoach

# Lancer les deux services
docker-compose up --build
```

Accéder à l'application : **http://localhost:4200**

Le backend API est disponible sur : **http://localhost:8080**

---

### 2. Activer l'IA conversationnelle (OpenAI)

Créez un fichier `.env` à la racine :

```env
OPENAI_API_KEY=sk-votre-cle-openai-ici
```

Puis relancez :

```bash
docker-compose up --build
```

> Sans clé API, l'assistant utilise des réponses prédéfinies intelligentes.

---

## 🏗️ Structure du projet

```
fincoach/
├── backend/                    # Spring Boot REST API
│   ├── src/main/java/com/fincoach/
│   │   ├── FinCoachApplication.java
│   │   ├── config/             # CORS
│   │   ├── controller/         # REST endpoints
│   │   ├── model/              # Entités JPA
│   │   ├── service/            # Logique métier + IA
│   │   └── dto/                # DTOs
│   ├── src/main/resources/
│   │   └── application.properties
│   └── Dockerfile
│
├── frontend/                   # Angular 17 SPA
│   ├── src/app/
│   │   ├── app.component.ts    # Shell + navigation
│   │   ├── app.routes.ts       # Routing
│   │   ├── models/             # Interfaces TypeScript
│   │   ├── services/           # ApiService HTTP
│   │   └── components/
│   │       ├── dashboard/      # Tableau de bord + profil financier
│   │       ├── action-plan/    # Gestion des objectifs
│   │       └── chat/           # Assistant IA conversationnel
│   ├── src/styles.scss         # Thème global (dark luxury)
│   ├── nginx.conf
│   └── Dockerfile
│
└── docker-compose.yml
```

---

## 🔌 API REST – Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/dashboard/{userId}` | Tableau de bord complet |
| GET | `/api/profile/{userId}` | Profil financier |
| POST | `/api/profile` | Créer/mettre à jour le profil |
| GET | `/api/actions/{userId}` | Liste des actions |
| POST | `/api/actions` | Créer une action |
| PUT | `/api/actions/{id}/status` | Mettre à jour le statut/progrès |
| DELETE | `/api/actions/{id}` | Supprimer une action |
| GET | `/api/chat/{userId}` | Historique du chat |
| POST | `/api/chat` | Envoyer un message |
| DELETE | `/api/chat/{userId}` | Effacer l'historique |

**Console H2 (dev)** : http://localhost:8080/h2-console

---

## 🛠️ Développement local (sans Docker)

### Backend
```bash
cd backend
./mvnw spring-boot:run
# API disponible sur http://localhost:8080
```

### Frontend
```bash
cd frontend
npm install --legacy-peer-deps
npm start
# App disponible sur http://localhost:4200
```

---

## ⚙️ Configuration avancée

### Passer à PostgreSQL (production)

Remplacez dans `application.properties` :

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/fincoach
spring.datasource.driver-class-name=org.postgresql.Driver
spring.datasource.username=fincoach
spring.datasource.password=votre_mot_de_passe
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
```

Et ajoutez dans `pom.xml` :
```xml
<dependency>
  <groupId>org.postgresql</groupId>
  <artifactId>postgresql</artifactId>
</dependency>
```

### Authentification utilisateurs

Pour la production, intégrez **Spring Security + JWT** ou **OAuth2** (Google/GitHub).
Remplacez `userId = 'user-demo'` dans `ApiService` par l'ID de l'utilisateur connecté.

---

## 📦 Technologies utilisées

| Composant | Technologie |
|-----------|-------------|
| Backend | Java 17, Spring Boot 3.2, Spring Data JPA |
| Base de données | H2 (dev), PostgreSQL (prod) |
| Frontend | Angular 17, TypeScript 5.4 |
| UI | SCSS custom, design system dark luxury |
| IA | OpenAI GPT-4o Mini (optionnel) |
| Containerisation | Docker, Docker Compose, Nginx |

---

## 🔮 Prochaines étapes (Roadmap)

- [ ] Authentification JWT / OAuth2
- [ ] Graphiques Chart.js (évolution mensuelle)
- [ ] Notifications email (objectifs atteints)
- [ ] Export PDF du bilan financier
- [ ] Module simulateur de crédit / retraite
- [ ] PWA (Progressive Web App)

---

*FinCoach Pro – Business model complet disponible dans le document FinCoachPro_BusinessModel.docx*
