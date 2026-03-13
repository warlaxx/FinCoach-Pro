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
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';

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
  imports: [CommonModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('stockCanvas') stockCanvases!: QueryList<ElementRef<HTMLCanvasElement>>;

  private tickerInterval?: ReturnType<typeof setInterval>;
  private chartInterval?: ReturnType<typeof setInterval>;

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
      name: 'LVMH Moët Hennessy',
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

  features = [
    {
      icon: '📊',
      title: 'Score de santé financière',
      desc: 'Obtenez une note de A à F basée sur votre situation réelle : revenus, dépenses, épargne, dettes.',
    },
    {
      icon: '🤖',
      title: 'Coach IA personnalisé',
      desc: 'Posez vos questions financières à notre assistant IA et recevez des conseils sur mesure 24h/24.',
    },
    {
      icon: '🎯',
      title: 'Plan d'actions concret',
      desc: 'Suivez vos objectifs financiers avec un plan structuré : réduire les dettes, épargner, investir.',
    },
    {
      icon: '💰',
      title: 'Suivi budgétaire',
      desc: 'Visualisez la répartition de vos dépenses et identifiez les postes à optimiser en un coup d'œil.',
    },
    {
      icon: '📈',
      title: 'Objectifs d'investissement',
      desc: 'Définissez vos cibles d'investissement et suivez votre progression mois après mois.',
    },
    {
      icon: '🔒',
      title: 'Données sécurisées',
      desc: 'Connexion via Google, Microsoft ou Apple. Vos données restent privées et chiffrées.',
    },
  ];

  testimonials = [
    {
      name: 'Sophie M.',
      role: 'Ingénieure, Lyon',
      text: 'En 3 mois, j'ai économisé 400 € de plus par mois grâce au plan d'actions FinCoach. Le score financier m'a vraiment ouvert les yeux.',
      score: 'A',
    },
    {
      name: 'Thomas R.',
      role: 'Entrepreneur, Paris',
      text: 'L'assistant IA répond à toutes mes questions fiscales. C'est comme avoir un conseiller financier personnel disponible à tout moment.',
      score: 'B',
    },
    {
      name: 'Marie-Claire D.',
      role: 'Infirmière, Bordeaux',
      text: 'J'ai remboursé mes crédits à la consommation en suivant les recommandations. Mon taux d'endettement est passé de 38% à 12%.',
      score: 'A',
    },
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.initHistories();
    this.startTickerUpdates();
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
    this.stocks.forEach((s) => s.chart?.destroy());
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

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
