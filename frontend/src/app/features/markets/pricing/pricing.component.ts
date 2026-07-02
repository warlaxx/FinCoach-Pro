import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { LogoComponent } from '../../../shared/components/logo/logo.component';

interface PlanCard {
  id: 'FREEMIUM' | 'PRO' | 'PREMIUM';
  icon: string;
  name: string;
  tagline: string;
  monthlyPrice: number; // €/month, 0 = free
  popular: boolean;
  cta: string;
  features: string[];
}

interface ComparisonRow {
  feature: string;
  freemium: string;
  pro: string;
  premium: string;
}

interface FaqItem {
  question: string;
  answer: string;
  open: boolean;
}

/**
 * Public pricing page — TICKET-14.
 * Accessible without authentication (SEO + conversion).
 */
@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, RouterLink, LogoComponent],
  templateUrl: './pricing.component.html',
  styleUrls: ['./pricing.component.scss'],
})
export class PricingComponent {
  /** Annual billing applies a 20% discount */
  readonly ANNUAL_DISCOUNT = 0.2;

  billing: 'monthly' | 'annual' = 'monthly';

  plans: PlanCard[] = [
    {
      id: 'FREEMIUM',
      icon: '🆓',
      name: 'Freemium',
      tagline: 'Pour découvrir votre santé financière',
      monthlyPrice: 0,
      popular: false,
      cta: 'Commencer gratuitement',
      features: [
        'Profil financier complet',
        'Score financier A–F',
        '3 objectifs (action plans)',
        '10 messages IA par jour',
        'Données de marché J-1',
      ],
    },
    {
      id: 'PRO',
      icon: '💎',
      name: 'Pro',
      tagline: 'Pour reprendre le contrôle, sérieusement',
      monthlyPrice: 9.99,
      popular: true,
      cta: "S'abonner Pro",
      features: [
        'Tout le plan Freemium',
        'Objectifs illimités',
        '100 messages IA par jour',
        "Graphiques d'évolution 30 jours",
        'Export PDF de votre bilan',
        'Simulateur crédit & épargne',
        'Notifications email',
      ],
    },
    {
      id: 'PREMIUM',
      icon: '🏆',
      name: 'Premium',
      tagline: "L'expérience complète, sans aucune limite",
      monthlyPrice: 19.99,
      popular: false,
      cta: "S'abonner Premium",
      features: [
        'Tout le plan Pro',
        'Assistant IA illimité',
        'Données de marché temps réel',
        'Support prioritaire',
      ],
    },
  ];

  comparison: ComparisonRow[] = [
    { feature: 'Profil financier',        freemium: '✅',        pro: '✅',         premium: '✅' },
    { feature: 'Score financier A–F',     freemium: '✅',        pro: '✅',         premium: '✅' },
    { feature: 'Objectifs (action plans)', freemium: '3 max',    pro: 'Illimité',   premium: 'Illimité' },
    { feature: 'Assistant IA',            freemium: '10 msg/jour', pro: '100 msg/jour', premium: 'Illimité' },
    { feature: 'Page Marchés',            freemium: 'Données J-1', pro: 'Temps réel', premium: 'Temps réel' },
    { feature: 'Graphiques 30 jours',     freemium: '—',         pro: '✅',         premium: '✅' },
    { feature: 'Export PDF du bilan',     freemium: '—',         pro: '✅',         premium: '✅' },
    { feature: 'Simulateur crédit',       freemium: '—',         pro: '✅',         premium: '✅' },
    { feature: 'Notifications email',     freemium: '—',         pro: '✅',         premium: '✅' },
    { feature: 'Support prioritaire',     freemium: '—',         pro: '—',          premium: '✅' },
  ];

  faq: FaqItem[] = [
    {
      question: 'Puis-je annuler mon abonnement à tout moment ?',
      answer:
        "Oui. Vous pouvez annuler en un clic depuis vos paramètres : votre plan reste actif jusqu'à la fin de la période déjà payée, sans frais cachés ni engagement.",
      open: false,
    },
    {
      question: "Y a-t-il une période d'essai ?",
      answer:
        'Le plan Freemium est gratuit pour toujours — c\'est le meilleur moyen d\'essayer FinCoach Pro. Vous passez au plan Pro uniquement quand vous en avez besoin.',
      open: false,
    },
    {
      question: 'Que se passe-t-il si je repasse au plan gratuit ?',
      answer:
        'Vos données restent intactes. Vous retrouvez simplement les limites du Freemium (3 objectifs, 10 messages IA/jour). Rien n\'est supprimé.',
      open: false,
    },
    {
      question: 'Mes données financières sont-elles en sécurité ?',
      answer:
        'Oui. Vos données sont chiffrées en transit, stockées en Europe et ne sont jamais revendues. Vous pouvez les exporter ou supprimer votre compte à tout moment (RGPD).',
      open: false,
    },
    {
      question: 'FinCoach Pro remplace-t-il un conseiller financier ?',
      answer:
        "Non. FinCoach Pro est un outil d'aide à la décision qui vous donne une vision claire et des pistes concrètes — pas un conseiller financier agréé.",
      open: false,
    },
  ];

  testimonials = [
    {
      quote:
        "En 3 mois, mon score est passé de D à B. Le plan d'actions m'a enfin fait ouvrir un Livret A et couper 4 abonnements inutiles.",
      author: 'Sarah M.',
      role: 'Abonnée Pro depuis 2025',
    },
    {
      quote:
        "Le coach IA répond mieux que mon banquier, et à 23h un dimanche. L'export PDF m'a servi pour mon dossier de prêt immobilier.",
      author: 'Karim B.',
      role: 'Abonné Premium',
    },
    {
      quote:
        "J'ai commencé en gratuit, je suis passée Pro au bout de 2 semaines. 9,99 € pour arrêter de finir chaque mois à découvert : rentabilisé.",
      author: 'Élodie T.',
      role: 'Abonnée Pro',
    },
  ];

  constructor(private router: Router) {}

  /** Displayed €/month price for the current billing period */
  priceFor(plan: PlanCard): string {
    if (plan.monthlyPrice === 0) return '0';
    const monthly =
      this.billing === 'annual'
        ? plan.monthlyPrice * (1 - this.ANNUAL_DISCOUNT)
        : plan.monthlyPrice;
    return monthly.toFixed(2).replace('.', ',');
  }

  /** Total billed per year on annual billing */
  annualTotalFor(plan: PlanCard): string {
    const total = plan.monthlyPrice * 12 * (1 - this.ANNUAL_DISCOUNT);
    return total.toFixed(2).replace('.', ',');
  }

  toggleFaq(item: FaqItem): void {
    item.open = !item.open;
  }

  /**
   * Freemium → direct registration.
   * Pro/Premium → registration too for now: Stripe Checkout arrives with
   * TICKET-15 and will replace this navigation.
   */
  selectPlan(plan: PlanCard): void {
    this.router.navigate(['/register'], {
      queryParams: plan.id === 'FREEMIUM' ? {} : { plan: plan.id.toLowerCase() },
    });
  }
}
