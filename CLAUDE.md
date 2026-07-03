# FinCoach Pro

Coaching financier personnel automatisé par IA — l'utilisateur suit son profil
financier, gère ses objectifs (action plans), discute avec un assistant IA, et
consulte des données de marché en temps réel. FinCoach Pro est un outil d'aide
à la décision, **non un conseiller financier agréé** (disclaimer à conserver
partout où c'est pertinent : pricing, exports PDF, etc.).

Repo : github.com/warlaxx/FinCoach-Pro · branche principale `main`.
Board Notion : "🗂️ Board — Tickets FinCoach Pro" (tickets `TICKET-N`).

## Stack

- Backend : Node.js 20, Express 4, TypeScript, PostgreSQL 16 via Prisma.
- Frontend : Angular 21, SCSS (thème dark monochrome noir/blanc), Chart.js, Three.js.
- Auth : JWT + OAuth2 (Google, Microsoft, Apple).
- IA : OpenAI GPT-4o Mini (mode démo sans clé API).
- Marchés : TwelveData REST API (34 instruments).
- CI/CD : GitHub Actions + review Claude/CodeRabbit automatique.

## Business model — plans d'abonnement

| Feature | 🆓 Freemium | 💎 Pro (9,99 €/mois) | 🏆 Premium (19,99 €/mois) |
|---|---|---|---|
| Profil financier | ✅ | ✅ | ✅ |
| Score financier A–F | ✅ | ✅ | ✅ |
| Objectifs (action plans) | 3 max | Illimité | Illimité |
| Assistant IA | 10 msg/jour | 100 msg/jour | Illimité |
| Page Markets | Données J-1 | Temps réel | Temps réel |
| Graphiques 30j | ❌ | ✅ | ✅ |
| Export PDF bilan | ❌ | ✅ | ✅ |
| Simulateur crédit | ❌ | ✅ | ✅ |
| Notifications email | ❌ | ✅ | ✅ |
| Support prioritaire | ❌ | ❌ | ✅ |

- Toggle mensuel/annuel : −20 % sur l'annuel.
- Paiement récurrent : Stripe Checkout (TICKET-15, pas encore intégré — le CTA
  Pro/Premium redirige vers `/register?plan=...` en attendant).
- Quotas appliqués côté backend par `PlanService` (lit le plan en DB, jamais
  depuis le JWT qui peut être périmé 24h) ; réponse API `{ code: 'UPGRADE_REQUIRED' }`
  déclenche une modale d'upgrade globale côté Angular.
- Page `/pricing` publique (sans connexion) : cartes de plans, tableau
  comparatif, témoignages, FAQ — conçue pour la conversion.

## Roadmap (voir aussi le board Notion)

Fait : auth JWT/OAuth2, email verification, dashboard + score A–F, action
plans, chat IA, page Markets, landing page, settings, plans/quotas (TICKET-16),
pricing page (TICKET-14), CI/CD.

À venir : Stripe (TICKET-15), notifications email objectifs atteints, export
PDF bilan (TICKET-32), simulateur crédit/retraite, PWA, déploiement
fincoach.pro (TICKET-27).

Cible de mise en production publique : fincoach.pro, prod visée Janvier 2027.
