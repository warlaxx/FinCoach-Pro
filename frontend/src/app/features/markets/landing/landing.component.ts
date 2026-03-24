import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ViewChildren, QueryList, ElementRef, HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogoComponent } from '../../../shared/components/logo/logo.component';
import { Router, RouterLink } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { TwelveDataService } from '../twelve-data.service';

Chart.register(...registerables);

interface StockData {
  symbol: string; name: string; price: number;
  change: number; changePercent: number; history: number[];
  chart?: Chart; canvasId: string; color: string;
}

@Component({
  selector: 'app-landing', standalone: true,
  imports: [CommonModule, RouterLink, LogoComponent],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('stockCanvas') stockCanvases!: QueryList<ElementRef<HTMLCanvasElement>>;

  private priceRefreshInterval?: ReturnType<typeof setInterval>;
  private scrollObserver?: IntersectionObserver;
  private counterObserver?: IntersectionObserver;

  showcaseStep = 0;

  stats = [
    { value: 0, target: 12500, label: 'Utilisateurs actifs',  suffix: '+' },
    { value: 0, target: 98,    label: 'Taux de satisfaction', suffix: '%' },
    { value: 0, target: 4.9,   label: 'Note moyenne',         suffix: '/5' },
    { value: 0, target: 24,    label: 'IA disponible',         suffix: 'h/7' },
  ];

  showcaseItems = [
    {
      num: '01', icon: '📊',
      title: 'Score de santé financière',
      desc: "Une note de A à F basée sur votre situation réelle — revenus, dépenses, épargne, dettes. Comprenez où vous en êtes en un coup d'œil.",
    },
    {
      num: '02', icon: '🤖',
      title: 'Coach IA disponible 24h/24',
      desc: "Posez n'importe quelle question financière à notre assistant IA. Conseils sur mesure, explications claires, réponses instantanées.",
    },
    {
      num: '03', icon: '🎯',
      title: "Plan d'actions personnalisé",
      desc: "Votre feuille de route financière mise à jour chaque mois selon vos progrès. Réduire les dettes, épargner, investir — étape par étape.",
    },
  ];

  stocks: StockData[] = [
    { symbol: 'CAC 40',    name: 'Bourse de Paris',     price: 0, change: 0, changePercent: 0, history: [], canvasId: 'chart-cac',  color: '#22C55E' },
    { symbol: 'S&P 500',   name: 'Bourse USA',          price: 0, change: 0, changePercent: 0, history: [], canvasId: 'chart-sp',   color: '#22C55E' },
    { symbol: 'BTC/EUR',   name: 'Bitcoin',             price: 0, change: 0, changePercent: 0, history: [], canvasId: 'chart-btc',  color: '#22C55E' },
    { symbol: 'LVMH',      name: 'LVMH Moet Hennessy', price: 0, change: 0, changePercent: 0, history: [], canvasId: 'chart-lvmh', color: '#22C55E' },
    { symbol: 'ETH/EUR',   name: 'Ethereum',            price: 0, change: 0, changePercent: 0, history: [], canvasId: 'chart-eth',  color: '#22C55E' },
    { symbol: 'MSCI World',name: 'Indice Mondial',      price: 0, change: 0, changePercent: 0, history: [], canvasId: 'chart-msci', color: '#22C55E' },
  ];

  tickerStocks: { symbol: string; apiSymbol: string; price: number; change: number }[] = [
    { symbol: 'CAC 40',       apiSymbol: 'CAC 40',   price: 0, change: 0 },
    { symbol: 'S&P 500',      apiSymbol: 'S&P 500',  price: 0, change: 0 },
    { symbol: 'DAX',          apiSymbol: 'DAX',      price: 0, change: 0 },
    { symbol: 'NASDAQ',       apiSymbol: 'NASDAQ',   price: 0, change: 0 },
    { symbol: 'BTC',          apiSymbol: 'BTC/EUR',  price: 0, change: 0 },
    { symbol: 'ETH',          apiSymbol: 'ETH/EUR',  price: 0, change: 0 },
    { symbol: 'AAPL',         apiSymbol: 'AAPL',     price: 0, change: 0 },
    { symbol: 'MSFT',         apiSymbol: 'MSFT',     price: 0, change: 0 },
    { symbol: 'LVMH',         apiSymbol: 'LVMH',     price: 0, change: 0 },
    { symbol: 'TotalEnergies',apiSymbol: 'TTE',      price: 0, change: 0 },
    { symbol: 'Or (XAU)',     apiSymbol: 'XAU',      price: 0, change: 0 },
    { symbol: 'EUR/USD',      apiSymbol: 'EUR/USD',  price: 0, change: 0 },
  ];

  features = [
    { icon: '📊', title: 'Score de santé financière', desc: "Note de A à F basée sur votre situation réelle : revenus, dépenses, épargne, dettes." },
    { icon: '🤖', title: 'Coach IA personnalisé',      desc: "Posez vos questions financières à notre IA et recevez des conseils sur mesure 24h/24." },
    { icon: '🎯', title: "Plan d'actions concret",     desc: "Objectifs structurés : réduire les dettes, épargner, investir — étape par étape." },
    { icon: '💰', title: 'Suivi budgétaire',           desc: "Visualisez la répartition de vos dépenses et identifiez les postes à optimiser." },
    { icon: '📈', title: "Objectifs d'investissement", desc: "Définissez vos cibles et suivez votre progression mois après mois." },
    { icon: '🔒', title: 'Données sécurisées',         desc: "Connexion via Google, Microsoft ou Apple. Données privées et chiffrées." },
  ];

  constructor(private router: Router, private twelveData: TwelveDataService) {}

  ngOnInit(): void {
    this.loadQuotes();
    this.loadTimeSeries();
    this.priceRefreshInterval = setInterval(() => this.refreshPrices(), 60_000);
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.setupScrollAnimations();
      this.setupCounterAnimations();
    }, 120);
  }

  ngOnDestroy(): void {
    if (this.priceRefreshInterval) clearInterval(this.priceRefreshInterval);
    this.stocks.forEach(s => s.chart?.destroy());
    this.scrollObserver?.disconnect();
    this.counterObserver?.disconnect();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.updateShowcaseStep();
  }

  private updateShowcaseStep(): void {
    const wrapper = document.querySelector('.showcase-wrapper') as HTMLElement;
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    const totalScroll = wrapper.clientHeight - window.innerHeight;
    if (totalScroll <= 0) return;
    const scrolled = Math.max(0, -rect.top);
    const progress = Math.min(1, scrolled / totalScroll);
    this.showcaseStep = Math.min(
      this.showcaseItems.length - 1,
      Math.floor(progress * this.showcaseItems.length)
    );
  }

  private setupScrollAnimations(): void {
    this.scrollObserver = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.sr, .zi, .sl, .sr-right').forEach(el => {
      this.scrollObserver!.observe(el);
    });
  }

  private setupCounterAnimations(): void {
    this.counterObserver = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) {
          const idx = parseInt((e.target as HTMLElement).dataset['statIndex'] || '0');
          this.animateCounter(idx);
          this.counterObserver!.unobserve(e.target);
        }
      }),
      { threshold: 0.5 }
    );
    document.querySelectorAll('.counter-val').forEach(el => this.counterObserver!.observe(el));
  }

  private animateCounter(idx: number): void {
    const stat = this.stats[idx];
    if (!stat) return;
    const isDecimal = stat.target < 10;
    const steps = 50;
    let current = 0;
    const timer = setInterval(() => {
      current += stat.target / steps;
      if (current >= stat.target) {
        stat.value = stat.target;
        clearInterval(timer);
      } else {
        stat.value = isDecimal ? +current.toFixed(1) : Math.floor(current);
      }
    }, 1600 / steps);
  }

  formatStatValue(idx: number): string {
    const s = this.stats[idx];
    if (!s) return '';
    const v = s.value;
    if (s.target >= 1000) return v.toLocaleString('fr-FR');
    if (s.target < 10) return v.toFixed(1);
    return `${v}`;
  }

  goToLogin(): void { this.router.navigate(['/login']); }

  // ── Market data (unchanged) ────────────────────────────

  private loadQuotes(): void {
    const cardSymbols = this.stocks.map(s => s.symbol);
    const extra = [...new Set(this.tickerStocks.map(t => t.apiSymbol).filter(s => !cardSymbols.includes(s)))];
    this.twelveData.getQuotes([...cardSymbols, ...extra]).subscribe(quotes => {
      this.stocks.forEach(stock => {
        const q = quotes.get(stock.symbol);
        if (q && q.price > 0) { stock.price = q.price; stock.change = q.change; stock.changePercent = q.changePercent; }
      });
      this.tickerStocks.forEach(t => {
        const q = quotes.get(t.apiSymbol);
        if (q && q.price > 0) { t.price = q.price; t.change = q.changePercent; }
      });
    });
  }

  private loadTimeSeries(): void {
    let delay = 0;
    this.stocks.forEach(stock => {
      setTimeout(() => {
        this.twelveData.getTimeSeries(stock.symbol, '1day', 30).subscribe(series => {
          if (series.length > 0) {
            stock.history = series.map(p => p.close);
            if (stock.price === 0) stock.price = series[series.length - 1].close;
            this.renderChart(stock);
          }
        });
      }, delay);
      delay += 8_000;
    });
  }

  private refreshPrices(): void {
    const unique = [...new Set([...this.stocks.map(s => s.symbol), ...this.tickerStocks.map(t => t.apiSymbol)])];
    this.twelveData.getPrices(unique).subscribe(prices => {
      this.stocks.forEach(stock => {
        const p = prices.get(stock.symbol);
        if (p && p > 0) {
          const old = stock.price; stock.price = p;
          if (old > 0) { stock.change = +(p - old).toFixed(2); stock.changePercent = +((stock.change / old) * 100).toFixed(2); }
          if (stock.history.length > 0) { stock.history.push(p); stock.history.shift(); this.updateChart(stock); }
        }
      });
      this.tickerStocks.forEach(t => {
        const p = prices.get(t.apiSymbol);
        if (p && p > 0) { if (t.price > 0) t.change = +(((p - t.price) / t.price) * 100).toFixed(2); t.price = p; }
      });
    });
  }

  private renderChart(stock: StockData): void {
    const ref = this.stockCanvases.find((_, i) => this.stocks[i]?.symbol === stock.symbol);
    if (!ref?.nativeElement) { setTimeout(() => this.renderChart(stock), 200); return; }
    stock.chart?.destroy();
    const ctx = ref.nativeElement.getContext('2d');
    if (!ctx) return;
    const isPos = stock.changePercent >= 0;
    const col = isPos ? stock.color : '#EF4444';
    const grad = ctx.createLinearGradient(0, 0, 0, ref.nativeElement.height);
    grad.addColorStop(0, col + '33'); grad.addColorStop(1, col + '00');
    stock.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: stock.history.map((_, i) => `${i}`),
        datasets: [{ data: stock.history, borderColor: col, borderWidth: 2, fill: true, backgroundColor: grad, pointRadius: 0, tension: 0.4 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 300 },
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } },
      },
    });
  }

  private updateChart(stock: StockData): void {
    if (!stock.chart) return;
    const col = stock.changePercent >= 0 ? stock.color : '#EF4444';
    stock.chart.data.labels = stock.history.map((_, i) => `${i}`);
    stock.chart.data.datasets[0].data = stock.history;
    stock.chart.data.datasets[0].borderColor = col;
    stock.chart.update('none');
  }

  formatPrice(price: number): string {
    if (price <= 0) return '—';
    if (price >= 10000) return price.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    if (price >= 100)   return price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  }
}
