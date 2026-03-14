import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChildren,
  QueryList,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { forkJoin } from 'rxjs';
import { TwelveDataService } from '../../services/twelve-data.service';

Chart.register(...registerables);

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  history: number[];
  chart?: Chart;
  canvasId: string;
  color: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('stockCanvas') stockCanvases!: QueryList<ElementRef<HTMLCanvasElement>>;

  private priceRefreshInterval?: ReturnType<typeof setInterval>;

  // Les 6 cartes marchés
  stocks: StockData[] = [
    { symbol: 'CAC 40',    name: 'Bourse de Paris',      price: 0, change: 0, changePercent: 0, history: [], canvasId: 'chart-cac',  color: '#C9A84C' },
    { symbol: 'S&P 500',   name: 'Bourse USA',           price: 0, change: 0, changePercent: 0, history: [], canvasId: 'chart-sp',   color: '#3B82F6' },
    { symbol: 'BTC/EUR',   name: 'Bitcoin',              price: 0, change: 0, changePercent: 0, history: [], canvasId: 'chart-btc',  color: '#F97316' },
    { symbol: 'LVMH',      name: 'LVMH Moet Hennessy',  price: 0, change: 0, changePercent: 0, history: [], canvasId: 'chart-lvmh', color: '#22C55E' },
    { symbol: 'ETH/EUR',   name: 'Ethereum',             price: 0, change: 0, changePercent: 0, history: [], canvasId: 'chart-eth',  color: '#8B5CF6' },
    { symbol: 'MSCI World',name: 'Indice Mondial',       price: 0, change: 0, changePercent: 0, history: [], canvasId: 'chart-msci', color: '#14B8A6' },
  ];

  // Ticker du haut — symboles affichés + symboles API
  tickerStocks: { symbol: string; apiSymbol: string; price: number; change: number }[] = [
    { symbol: 'CAC 40',       apiSymbol: 'CAC 40',    price: 0, change: 0 },
    { symbol: 'S&P 500',      apiSymbol: 'S&P 500',   price: 0, change: 0 },
    { symbol: 'DAX',          apiSymbol: 'DAX',       price: 0, change: 0 },
    { symbol: 'NASDAQ',       apiSymbol: 'NASDAQ',    price: 0, change: 0 },
    { symbol: 'BTC',          apiSymbol: 'BTC/EUR',   price: 0, change: 0 },
    { symbol: 'ETH',          apiSymbol: 'ETH/EUR',   price: 0, change: 0 },
    { symbol: 'AAPL',         apiSymbol: 'AAPL',      price: 0, change: 0 },
    { symbol: 'MSFT',         apiSymbol: 'MSFT',      price: 0, change: 0 },
    { symbol: 'LVMH',         apiSymbol: 'LVMH',      price: 0, change: 0 },
    { symbol: 'TotalEnergies',apiSymbol: 'TTE',       price: 0, change: 0 },
    { symbol: 'Or (XAU)',     apiSymbol: 'XAU',       price: 0, change: 0 },
    { symbol: 'EUR/USD',      apiSymbol: 'EUR/USD',   price: 0, change: 0 },
  ];

  features = [
    { icon: '📊', title: 'Score de santé financière',    desc: "Obtenez une note de A à F basée sur votre situation réelle : revenus, dépenses, épargne, dettes." },
    { icon: '🤖', title: 'Coach IA personnalisé',        desc: "Posez vos questions financières à notre assistant IA et recevez des conseils sur mesure 24h/24." },
    { icon: '🎯', title: "Plan d'actions concret",       desc: "Suivez vos objectifs financiers avec un plan structuré : réduire les dettes, épargner, investir." },
    { icon: '💰', title: 'Suivi budgétaire',             desc: "Visualisez la répartition de vos dépenses et identifiez les postes à optimiser en un coup d'oeil." },
    { icon: '📈', title: "Objectifs d'investissement",   desc: "Définissez vos cibles d'investissement et suivez votre progression mois après mois." },
    { icon: '🔒', title: 'Données sécurisées',           desc: "Connexion via Google, Microsoft ou Apple. Vos données restent privées et chiffrées." },
  ];

  constructor(
    private router: Router,
    private twelveData: TwelveDataService,
  ) {}

  // ─────────────────────────────────────────────
  // Lifecycle
  // ─────────────────────────────────────────────

  ngOnInit(): void {
    this.loadQuotes();
    this.loadTimeSeries();
    // Refresh prix léger toutes les 60s
    this.priceRefreshInterval = setInterval(() => this.refreshPrices(), 60_000);
  }

  ngAfterViewInit(): void {
    // Les charts seront initialisés après réception des time series
  }

  ngOnDestroy(): void {
    if (this.priceRefreshInterval) clearInterval(this.priceRefreshInterval);
    this.stocks.forEach(s => s.chart?.destroy());
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  // ─────────────────────────────────────────────
  // Chargement des données réelles
  // ─────────────────────────────────────────────

  /**
   * Charge les quotes (prix + variation) pour cartes ET ticker en batch.
   * Tous les symboles uniques en 1-2 appels API.
   */
  private loadQuotes(): void {
    // Symboles uniques pour les cartes
    const cardSymbols = this.stocks.map(s => s.symbol);
    // Symboles uniques pour le ticker (dédupliqués par rapport aux cartes)
    const tickerApiSymbols = [...new Set(
      this.tickerStocks
        .map(t => t.apiSymbol)
        .filter(sym => !cardSymbols.includes(sym))
    )];

    const allSymbols = [...cardSymbols, ...tickerApiSymbols];

    this.twelveData.getQuotes(allSymbols).subscribe(quotes => {
      // Mettre à jour les cartes
      this.stocks.forEach(stock => {
        const q = quotes.get(stock.symbol);
        if (q && q.price > 0) {
          stock.price         = q.price;
          stock.change        = q.change;
          stock.changePercent = q.changePercent;
        }
      });

      // Mettre à jour le ticker
      this.tickerStocks.forEach(ticker => {
        const q = quotes.get(ticker.apiSymbol);
        if (q && q.price > 0) {
          ticker.price  = q.price;
          ticker.change = q.changePercent;
        }
      });
    });
  }

  /**
   * Charge les séries temporelles (30 jours) pour chaque carte.
   * Appelé une fois au démarrage — affiche les vraies courbes historiques.
   */
  private loadTimeSeries(): void {
    let delay = 0;
    this.stocks.forEach(stock => {
      // Échelonner les appels pour ne pas dépasser 8 req/min
      setTimeout(() => {
        this.twelveData.getTimeSeries(stock.symbol, '1day', 30).subscribe(series => {
          if (series.length > 0) {
            stock.history = series.map(p => p.close);
            // Si le prix n'est pas encore arrivé via les quotes, on prend le dernier point
            if (stock.price === 0) {
              stock.price = series[series.length - 1].close;
            }
            this.renderChart(stock);
          }
        });
      }, delay);
      delay += 8_000; // 1 appel toutes les 8s pour rester dans 8 req/min
    });
  }

  /**
   * Refresh léger : récupère seulement les prix courants (1 appel pour tout le monde).
   */
  private refreshPrices(): void {
    const allApiSymbols = [
      ...this.stocks.map(s => s.symbol),
      ...this.tickerStocks.map(t => t.apiSymbol),
    ];
    const unique = [...new Set(allApiSymbols)];

    this.twelveData.getPrices(unique).subscribe(prices => {
      this.stocks.forEach(stock => {
        const newPrice = prices.get(stock.symbol);
        if (newPrice && newPrice > 0) {
          const old = stock.price;
          stock.price = newPrice;
          if (old > 0) {
            stock.change        = +(newPrice - old).toFixed(2);
            stock.changePercent = +((stock.change / old) * 100).toFixed(2);
          }
          // Ajouter le nouveau point au graphique
          if (stock.history.length > 0) {
            stock.history.push(newPrice);
            stock.history.shift();
            this.updateChart(stock);
          }
        }
      });

      this.tickerStocks.forEach(ticker => {
        const newPrice = prices.get(ticker.apiSymbol);
        if (newPrice && newPrice > 0) {
          if (ticker.price > 0) {
            ticker.change = +(((newPrice - ticker.price) / ticker.price) * 100).toFixed(2);
          }
          ticker.price = newPrice;
        }
      });
    });
  }

  // ─────────────────────────────────────────────
  // Gestion des graphiques Chart.js
  // ─────────────────────────────────────────────

  private renderChart(stock: StockData): void {
    const canvasRef = this.stockCanvases.find((_, i) => this.stocks[i]?.symbol === stock.symbol);
    if (!canvasRef?.nativeElement) {
      // Attendre que la vue soit prête
      setTimeout(() => this.renderChart(stock), 200);
      return;
    }

    stock.chart?.destroy();

    const canvas = canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isPositive  = stock.changePercent >= 0;
    const lineColor   = isPositive ? stock.color : '#EF4444';
    const gradient    = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, lineColor + '33');
    gradient.addColorStop(1, lineColor + '00');

    stock.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: stock.history.map((_, i) => i.toString()),
        datasets: [{
          data: stock.history,
          borderColor: lineColor,
          borderWidth: 2,
          fill: true,
          backgroundColor: gradient,
          pointRadius: 0,
          tension: 0.4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } },
      },
    });
  }

  private updateChart(stock: StockData): void {
    if (!stock.chart) return;
    const isPositive = stock.changePercent >= 0;
    const lineColor  = isPositive ? stock.color : '#EF4444';
    stock.chart.data.labels                    = stock.history.map((_, i) => i.toString());
    stock.chart.data.datasets[0].data          = stock.history;
    stock.chart.data.datasets[0].borderColor   = lineColor;
    stock.chart.update('none');
  }

  // ─────────────────────────────────────────────
  // Utilitaires
  // ─────────────────────────────────────────────

  formatPrice(price: number): string {
    if (price <= 0)    return '—';
    if (price >= 10000) return price.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    if (price >= 100)   return price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  }
}
