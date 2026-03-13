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
  basePrice: number;
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

  private tickerInterval?: ReturnType<typeof setInterval>;
  private chartInterval?: ReturnType<typeof setInterval>;
  private refreshInterval?: ReturnType<typeof setInterval>;

  stocks: StockData[] = [
    {
      symbol: 'CAC 40',
      name: 'Bourse de Paris',
      price: 8147.23,
      change: +42.15,
      changePercent: +0.52,
      history: [],
      canvasId: 'chart-cac',
      color: '#C9A84C',
      basePrice: 8147,
    },
    {
      symbol: 'S&P 500',
      name: 'Bourse USA',
      price: 5248.80,
      change: -18.32,
      changePercent: -0.35,
      history: [],
      canvasId: 'chart-sp',
      color: '#3B82F6',
      basePrice: 5248,
    },
    {
      symbol: 'BTC/EUR',
      name: 'Bitcoin',
      price: 61_420.50,
      change: +1204.80,
      changePercent: +2.00,
      history: [],
      canvasId: 'chart-btc',
      color: '#F97316',
      basePrice: 61420,
    },
    {
      symbol: 'LVMH',
      name: 'LVMH Moet Hennessy',
      price: 712.40,
      change: +9.60,
      changePercent: +1.36,
      history: [],
      canvasId: 'chart-lvmh',
      color: '#22C55E',
      basePrice: 712,
    },
    {
      symbol: 'ETH/EUR',
      name: 'Ethereum',
      price: 3247.90,
      change: -52.10,
      changePercent: -1.58,
      history: [],
      canvasId: 'chart-eth',
      color: '#8B5CF6',
      basePrice: 3247,
    },
    {
      symbol: 'MSCI World',
      name: 'Indice Mondial',
      price: 3591.20,
      change: +12.40,
      changePercent: +0.35,
      history: [],
      canvasId: 'chart-msci',
      color: '#14B8A6',
      basePrice: 3591,
    },
  ];

  tickerStocks = [
    { symbol: 'CAC 40', price: 8147.23, change: +0.52 },
    { symbol: 'S&P 500', price: 5248.80, change: -0.35 },
    { symbol: 'DAX', price: 18_432.10, change: +0.78 },
    { symbol: 'NASDAQ', price: 16_421.00, change: -0.12 },
    { symbol: 'BTC', price: 61_420.50, change: +2.00 },
    { symbol: 'ETH', price: 3247.90, change: -1.58 },
    { symbol: 'AAPL', price: 189.42, change: +0.94 },
    { symbol: 'MSFT', price: 415.18, change: +1.22 },
    { symbol: 'LVMH', price: 712.40, change: +1.36 },
    { symbol: 'TotalEnergies', price: 62.84, change: -0.41 },
    { symbol: 'Or (XAU)', price: 2342.10, change: +0.68 },
    { symbol: 'EUR/USD', price: 1.0842, change: -0.11 },
  ];

  // Mapping ticker symbols to TwelveData-friendly symbols
  private tickerApiMap: Record<string, string> = {
    'CAC 40': 'CAC 40',
    'S&P 500': 'S&P 500',
    'DAX': 'DAX',
    'NASDAQ': 'NASDAQ',
    'BTC': 'BTC/EUR',
    'ETH': 'ETH/EUR',
    'AAPL': 'AAPL',
    'MSFT': 'MSFT',
    'LVMH': 'LVMH',
    'TotalEnergies': 'TTE',
    'Or (XAU)': 'XAU',
    'EUR/USD': 'EUR/USD',
  };

  features = [
    {
      icon: '📊',
      title: 'Score de sante financiere',
      desc: 'Obtenez une note de A a F basee sur votre situation reelle : revenus, depenses, epargne, dettes.',
    },
    {
      icon: '🤖',
      title: 'Coach IA personnalise',
      desc: 'Posez vos questions financieres a notre assistant IA et recevez des conseils sur mesure 24h/24.',
    },
    {
      icon: '🎯',
      title: "Plan d'actions concret",
      desc: "Suivez vos objectifs financiers avec un plan structure : reduire les dettes, epargner, investir.",
    },
    {
      icon: '💰',
      title: 'Suivi budgetaire',
      desc: "Visualisez la repartition de vos depenses et identifiez les postes a optimiser en un coup d'oeil.",
    },
    {
      icon: '📈',
      title: "Objectifs d'investissement",
      desc: "Definissez vos cibles d'investissement et suivez votre progression mois apres mois.",
    },
    {
      icon: '🔒',
      title: 'Donnees securisees',
      desc: 'Connexion via Google, Microsoft ou Apple. Vos donnees restent privees et chiffrees.',
    },
  ];

  constructor(
    private router: Router,
    private twelveData: TwelveDataService,
  ) {}

  ngOnInit(): void {
    this.initHistories();
    this.startTickerUpdates();
    this.loadRealMarketData();
    // Refresh every 2 minutes
    this.refreshInterval = setInterval(() => this.loadRealMarketData(), 120_000);
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initCharts();
      this.startChartUpdates();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.tickerInterval) clearInterval(this.tickerInterval);
    if (this.chartInterval) clearInterval(this.chartInterval);
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    this.stocks.forEach((s) => s.chart?.destroy());
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  // ========== LOAD REAL DATA ==========

  private loadRealMarketData(): void {
    // Load quotes for market cards
    const cardSymbols = this.stocks.map(s => s.symbol);
    this.twelveData.getQuotes(cardSymbols).subscribe(quotes => {
      quotes.forEach((quote, symbol) => {
        const stock = this.stocks.find(s => s.symbol === symbol);
        if (stock && quote.price > 0) {
          stock.price = quote.price;
          stock.change = quote.change;
          stock.changePercent = quote.changePercent;
          stock.basePrice = quote.price;
          // Re-generate history around real price
          stock.history = this.generateHistoryAround(quote.price, 30, quote.changePercent);

          if (stock.chart) {
            const isPositive = stock.changePercent >= 0;
            const lineColor = isPositive ? stock.color : '#EF4444';
            stock.chart.data.labels = stock.history.map((_, i) => i.toString());
            stock.chart.data.datasets[0].data = stock.history;
            stock.chart.data.datasets[0].borderColor = lineColor;
            stock.chart.update('none');
          }
        }
      });

      // Also update ticker with real prices
      this.updateTickerFromQuotes(quotes);
    });
  }

  private updateTickerFromQuotes(quotes: Map<string, any>): void {
    for (const ticker of this.tickerStocks) {
      const apiSymbol = this.tickerApiMap[ticker.symbol];
      if (apiSymbol) {
        const quote = quotes.get(apiSymbol);
        if (quote && quote.price > 0) {
          ticker.price = quote.price;
          ticker.change = quote.changePercent;
        }
      }
    }
  }

  private generateHistoryAround(price: number, points: number, trendPercent: number): number[] {
    const history: number[] = [];
    const startPrice = price * (1 - trendPercent / 100);
    history.push(startPrice);
    for (let i = 1; i < points; i++) {
      const last = history[i - 1];
      const trend = (price - startPrice) / points;
      const noise = (Math.random() - 0.5) * (price * 0.003);
      history.push(+(last + trend + noise).toFixed(4));
    }
    history[points - 1] = price;
    return history;
  }

  // ========== EXISTING METHODS ==========

  private initHistories(): void {
    this.stocks.forEach((stock) => {
      stock.history = this.generateHistory(stock.basePrice, 30);
      stock.price = stock.history[stock.history.length - 1];
      const first = stock.history[0];
      stock.change = +(stock.price - first).toFixed(2);
      stock.changePercent = +((stock.change / first) * 100).toFixed(2);
    });
  }

  private generateHistory(base: number, points: number): number[] {
    const history: number[] = [base];
    for (let i = 1; i < points; i++) {
      const last = history[i - 1];
      const drift = (Math.random() - 0.48) * (last * 0.008);
      history.push(+(last + drift).toFixed(2));
    }
    return history;
  }

  private initCharts(): void {
    this.stockCanvases.forEach((canvasRef, index) => {
      const stock = this.stocks[index];
      if (!stock || !canvasRef?.nativeElement) return;

      const canvas = canvasRef.nativeElement;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const isPositive = stock.changePercent >= 0;
      const lineColor = isPositive ? stock.color : '#EF4444';

      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, lineColor + '33');
      gradient.addColorStop(1, lineColor + '00');

      stock.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: stock.history.map((_, i) => i.toString()),
          datasets: [
            {
              data: stock.history,
              borderColor: lineColor,
              borderWidth: 2,
              fill: true,
              backgroundColor: gradient,
              pointRadius: 0,
              tension: 0.4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 300 },
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: {
            x: { display: false },
            y: { display: false },
          },
        },
      });
    });
  }

  private startTickerUpdates(): void {
    this.tickerInterval = setInterval(() => {
      this.tickerStocks = this.tickerStocks.map((s) => {
        const delta = (Math.random() - 0.49) * 0.15;
        const newChange = +(s.change + delta).toFixed(2);
        const newPrice = +(s.price * (1 + delta / 100)).toFixed(2);
        return { ...s, price: newPrice, change: newChange };
      });
    }, 2500);
  }

  private startChartUpdates(): void {
    this.chartInterval = setInterval(() => {
      this.stocks.forEach((stock) => {
        const last = stock.history[stock.history.length - 1];
        const drift = (Math.random() - 0.48) * (last * 0.004);
        const newPoint = +(last + drift).toFixed(2);
        stock.history.push(newPoint);
        stock.history.shift();

        stock.price = newPoint;
        const first = stock.history[0];
        stock.change = +(newPoint - first).toFixed(2);
        stock.changePercent = +((stock.change / first) * 100).toFixed(2);

        if (stock.chart) {
          const isPositive = stock.changePercent >= 0;
          const lineColor = isPositive ? stock.color : '#EF4444';
          stock.chart.data.labels = stock.history.map((_, i) => i.toString());
          stock.chart.data.datasets[0].data = stock.history;
          stock.chart.data.datasets[0].borderColor = lineColor;
          stock.chart.update('none');
        }
      });
    }, 3000);
  }

  formatPrice(price: number): string {
    if (price >= 10000) return price.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    if (price >= 100) return price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  }
}
