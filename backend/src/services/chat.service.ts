import { CONSTANTS } from '../config/constants';
import { ChatMessage } from '@prisma/client';
import OpenAI from 'openai';

/**
 * AI chat service — exact port of Java AiChatService.java.
 *
 * Demo mode: If OPENAI_API_KEY is not configured (or equals "demo"),
 * keyword-matched static responses are returned so the app remains
 * fully functional without an API key.
 */

const SYSTEM_PROMPT = `Tu es FinCoach, un assistant financier personnel expert et bienveillant.
Tu aides les utilisateurs français à améliorer leur santé financière.
Tu donnes des conseils pratiques, concis et personnalisés sur :
- La gestion du budget mensuel
- Le remboursement des dettes (méthode avalanche, boule de neige)
- L'épargne et les fonds d'urgence
- Les placements adaptés aux débutants (livret A, PEL, assurance-vie)
- La réduction des dépenses superflues

Ton ton est encourageant, simple et concret. Tu utilises des chiffres et exemples réels.
Tu réponds toujours en français. Tes réponses font 2-4 paragraphes maximum.`;

const DEMO_RESPONSES: [string, string][] = [
  [
    'budget|dépense',
    `Pour maîtriser votre budget, appliquez la règle 50/30/20 : 50% pour les besoins essentiels (loyer, alimentation, transport), 30% pour les envies personnelles, et 20% pour l'épargne.

Commencez par noter toutes vos dépenses pendant 1 mois. Vous serez souvent surpris de voir où va votre argent. Les abonnements oubliés et les achats impulsifs sont les premiers postes à optimiser.`,
  ],
  [
    'dette|crédit|rembours',
    `Il existe deux stratégies efficaces pour rembourser vos dettes :

**Méthode Avalanche** : Payez d'abord la dette avec le taux d'intérêt le plus élevé. C'est la plus économique mathématiquement.

**Méthode Boule de neige** : Commencez par la plus petite dette pour avoir des victoires rapides et rester motivé. Pour commencer, arrêtez de contracter de nouvelles dettes et versez le minimum sur toutes sauf une.`,
  ],
  [
    'épargne|économiser',
    `Le secret de l'épargne est de vous payer en premier : dès réception de votre salaire, virez automatiquement 10-20% sur un livret d'épargne avant de dépenser quoi que ce soit.

Commencez par un fonds d'urgence équivalent à 3-6 mois de charges. Le Livret A (taux garanti) est parfait pour cela. Une fois ce coussin constitué, explorez le PEL ou l'assurance-vie pour faire fructifier votre épargne.`,
  ],
  [
    'placement|investir|investissement',
    `Pour débuter en investissement, voici la hiérarchie conseillée :

1. **Fonds d'urgence** (Livret A) : 3-6 mois de charges, toujours accessible
2. **Épargne retraite** (PER) : déductions fiscales avantageuses
3. **Assurance-vie** en fonds euros : capital garanti, disponible
4. **ETF World** en assurance-vie : exposition boursière diversifiée à faibles frais

N'investissez en bourse que l'argent dont vous n'avez pas besoin avant 8-10 ans.`,
  ],
];

const DEMO_DEFAULT = `Excellente question ! La clé d'une bonne santé financière repose sur trois piliers : **dépenser moins que vous ne gagnez**, **constituer une épargne de précaution**, et **éliminer progressivement vos dettes**.

Pour personnaliser mes conseils à votre situation, renseignez votre profil financier dans le tableau de bord. Je pourrai alors vous donner des recommandations précises adaptées à vos revenus et objectifs.`;

class ChatService {
  private openai: OpenAI | null = null;

  private get isDemoMode(): boolean {
    const key = process.env.OPENAI_API_KEY;
    return !key || key === 'demo' || key.trim() === '';
  }

  private getOpenAiClient(): OpenAI {
    if (!this.openai) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        timeout: CONSTANTS.OPENAI_TIMEOUT_MS,
      });
    }
    return this.openai;
  }

  async chat(history: ChatMessage[], userMessage: string): Promise<string> {
    if (this.isDemoMode) {
      console.info('[ChatService] OpenAI API key not configured — returning demo response.');
      return this.buildDemoResponse(userMessage);
    }

    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: SYSTEM_PROMPT },
      ];

      // Include only the last CHAT_HISTORY_WINDOW messages
      const start = Math.max(0, history.length - CONSTANTS.CHAT_HISTORY_WINDOW);
      for (let i = start; i < history.length; i++) {
        const msg = history[i];
        messages.push({ role: msg.role as 'user' | 'assistant', content: msg.content });
      }
      messages.push({ role: 'user', content: userMessage });

      const completion = await this.getOpenAiClient().chat.completions.create({
        model: CONSTANTS.OPENAI_MODEL,
        messages,
        max_tokens: CONSTANTS.OPENAI_MAX_TOKENS,
        temperature: CONSTANTS.OPENAI_TEMPERATURE,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error('OpenAI returned empty content.');

      console.info(`[ChatService] OpenAI response received (${content.length} chars).`);
      return content;
    } catch (err) {
      console.error('[ChatService] OpenAI request failed, falling back to demo:', err);
      return this.buildDemoResponse(userMessage);
    }
  }

  private buildDemoResponse(question: string): string {
    const lower = question.toLowerCase();
    for (const [keywords, response] of DEMO_RESPONSES) {
      for (const keyword of keywords.split('|')) {
        if (lower.includes(keyword)) return response;
      }
    }
    return DEMO_DEFAULT;
  }
}

export const chatService = new ChatService();
