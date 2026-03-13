import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  ViewChild,
  ViewChildren,
  QueryList,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { TwelveDataService, StockQuote } from '../../services/twelve-data.service';

Chart.register(...registerables);

interface StockItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  history: number[];
  basePrice: number;
  color: string;
  category: string;
  chart?: Chart;
  apiLoaded: boolean;
  loading: boolean;
}

@Component({
  selector: 'app-markets',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './markets.component.html',
  styleUrls: ['./markets.component.scss'],
})
export class MarketsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('miniCanvas') miniCanvases!: QueryList<ElementRef<HTMLCanvasElement>>;
  @ViewChild('detailCanvas') detailCanvas?: ElementRef<HTMLCanvasElement>;

  private updateInterval?: ReturnType<typeof setInterval>;
  private refreshInterval?: ReturnType<typeof setInterval>;
  private readonly FAVORITES_KEY = 'fincoach_favorite_stocks';

  searchQuery = '';
  activeCategory = 'Tous';
  showFavoritesOnly = false;
  favorites: Set<string> = new Set();
  selectedStock: StockItem | null = null;
  private detailChart?: Chart;
  isLoading = true;
  lastUpdate: Date | null = null;

  categories = ['Tous', 'Indices', 'Actions', 'Crypto', 'Matieres premieres', 'Devises'];

  allStocks: StockItem[] = [
    // Indices
    { symbol: 'CAC 40', name: 'Bourse de Paris', price: 0, change: 0, changePercent: 0, history: [], basePrice: 8147, color: '#C9A84C', category: 'Indices', apiLoaded: false, loading: true },
    { symbol: 'S&P 500', name: 'Standard & Poor\'s 500', price: 0, change: 0, changePercent: 0, history: [], basePrice: 5248, color: '#3B82F6', category: 'Indices', apiLoaded: false, loading: true },
    { symbol: 'NASDAQ', name: 'NASDAQ Composite', price: 0, change: 0, changePercent: 0, history: [], basePrice: 16421, color: '#8B5CF6', category: 'Indices', apiLoaded: false, loading: true },
    { symbol: 'DAX', name: 'Bourse de Francfort', price: 0, change: 0, changePercent: 0, history: [], basePrice: 18432, color: '#EAB308', category: 'Indices', apiLoaded: false, loading: true },
    { symbol: 'FTSE 100', name: 'Bourse de Londres', price: 0, change: 0, changePercent: 0, history: [], basePrice: 7930, color: '#14B8A6', category: 'Indices', apiLoaded: false, loading: true },
    { symbol: 'NIKKEI 225', name: 'Bourse de Tokyo', price: 0, change: 0, changePercent: 0, history: [], basePrice: 39245, color: '#EF4444', category: 'Indices', apiLoaded: false, loading: true },

    // Actions
    { symbol: 'AAPL', name: 'Apple Inc.', price: 0, change: 0, changePercent: 0, history: [], basePrice: 189, color: '#8B5CF6', category: 'Actions', apiLoaded: false, loading: true },
    { symbol: 'MSFT', name: 'Microsoft Corp.', price: 0, change: 0, changePercent: 0, history: [], basePrice: 415, color: '#3B82F6', category: 'Actions', apiLoaded: false, loading: true },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 0, change: 0, changePercent: 0, history: [], basePrice: 155, color: '#22C55E', category: 'Actions', apiLoaded: false, loading: true },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 0, change: 0, changePercent: 0, history: [], basePrice: 182, color: '#F97316', category: 'Actions', apiLoaded: false, loading: true },
    { symbol: 'TSLA', name: 'Tesla Inc.', price: 0, change: 0, changePercent: 0, history: [], basePrice: 248, color: '#EF4444', category: 'Actions', apiLoaded: false, loading: true },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 0, change: 0, changePercent: 0, history: [], basePrice: 875, color: '#22C55E', category: 'Actions', apiLoaded: false, loading: true },
    { symbol: 'META', name: 'Meta Platforms', price: 0, change: 0, changePercent: 0, history: [], basePrice: 505, color: '#3B82F6', category: 'Actions', apiLoaded: false, loading: true },
    { symbol: 'LVMH', name: 'LVMH Moet Hennessy', price: 0, change: 0, changePercent: 0, history: [], basePrice: 712, color: '#C9A84C', category: 'Actions', apiLoaded: false, loading: true },
    { symbol: 'TTE', name: 'TotalEnergies SE', price: 0, change: 0, changePercent: 0, history: [], basePrice: 62, color: '#EF4444', category: 'Actions', apiLoaded: false, loading: true },
    { symbol: 'AIR', name: 'Airbus SE', price: 0, change: 0, changePercent: 0, history: [], basePrice: 158, color: '#3B82F6', category: 'Actions', apiLoaded: false, loading: true },
    { symbol: 'SAN', name: 'Sanofi SA', price: 0, change: 0, changePercent: 0, history: [], basePrice: 92, color: '#8B5CF6', category: 'Actions', apiLoaded: false, loading: true },
    { symbol: 'BNP', name: 'BNP Paribas', price: 0, change: 0, changePercent: 0, history: [], basePrice: 61, color: '#14B8A6', category: 'Actions', apiLoaded: false, loading: true },
    { symbol: 'OR', name: 'L\'Oreal SA', price: 0, change: 0, changePercent: 0, history: [], basePrice: 402, color: '#C9A84C', category: 'Actions', apiLoaded: false, loading: true },

    // Crypto
    { symbol: 'BTC/EUR', name: 'Bitcoin', price: 0, change: 0, changePercent: 0, history: [], basePrice: 61420, color: '#F97316', category: 'Crypto', apiLoaded: false, loading: true },
    { symbol: 'ETH/EUR', name: 'Ethereum', price: 0, change: 0, changePercent: 0, history: [], basePrice: 3247, color: '#8B5CF6', category: 'Crypto', apiLoaded: false, loading: true },
    { symbol: 'SOL/EUR', name: 'Solana', price: 0, change: 0, changePercent: 0, history: [], basePrice: 142, color: '#14B8A6', category: 'Crypto', apiLoaded: false, loading: true },
    { symbol: 'ADA/EUR', name: 'Cardano', price: 0, change: 0, changePercent: 0, history: [], basePrice: 0.62, color: '#3B82F6', category: 'Crypto', apiLoaded: false, loading: true },
    { symbol: 'XRP/EUR', name: 'Ripple', price: 0, change: 0, changePercent: 0, history: [], basePrice: 0.58, color: '#22C55E', category: 'Crypto', apiLoaded: false, loading: true },

    // Matieres premieres
    { symbol: 'XAU', name: 'Or (Gold)', price: 0, change: 0, changePercent: 0, history: [], basePrice: 2342, color: '#C9A84C', category: 'Matieres premieres', apiLoaded: false, loading: true },
    { symbol: 'XAG', name: 'Argent (Silver)', price: 0, change: 0, changePercent: 0, history: [], basePrice: 27, color: '#8892A4', category: 'Matieres premieres', apiLoaded: false, loading: true },
    { symbol: 'WTI', name: 'Petrole brut WTI', price: 0, change: 0, changePercent: 0, history: [], basePrice: 78, color: '#F97316', category: 'Matieres premieres', apiLoaded: false, loading: true },
    { symbol: 'BRENT', name: 'Petrole Brent', price: 0, change: 0, changePercent: 0, history: [], basePrice: 82, color: '#EAB308', category: 'Matieres premieres', apiLoaded: false, loading: true },
    { symbol: 'GAS', name: 'Gaz naturel', price: 0, change: 0, changePercent: 0, history: [], basePrice: 2.15, color: '#3B82F6', category: 'Matieres premieres', apiLoaded: false, loading: true },

    // Devises
    { symbol: 'EUR/USD', name: 'Euro / Dollar US', price: 0, change: 0, changePercent: 0, history: [], basePrice: 1.0842, color: '#3B82F6', category: 'Devises', apiLoaded: false, loading: true },
    { symbol: 'GBP/EUR', name: 'Livre sterling / Euro', price: 0, change: 0, changePercent: 0, history: [], basePrice: 1.1645, color: '#22C55E', category: 'Devises', apiLoaded: false, loading: true },
    { symbol: 'USD/JPY', name: 'Dollar US / Yen', price: 0, change: 0, changePercent: 0, history: [], basePrice: 151, color: '#EF4444', category: 'Devises', apiLoaded: false, loading: true },
    { symbol: 'EUR/CHF', name: 'Euro / Franc suisse', price: 0, change: 0, changePercent: 0, history: [], basePrice: 0.9632, color: '#14B8A6', category: 'Devises', apiLoaded: false, loading: true },
  ];

  filteredStocks: StockItem[] = [];

  constructor(
    private router: Router,
    private twelveData: TwelveDataService,
  ) {}

  ngOnInit(): void {
    this.loadFavorites();
    // Initialize with fallback data while API loads
    this.initFallbackHistories();
    this.applyFilters();
    // Fetch real data from TwelveData
    this.loadRealData();
    // Refresh prices every 60 seconds
    this.refreshInterval = setInterval(() => this.refreshPrices(), 60_000);
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initMiniCharts();
      this.startSimulatedUpdates();
    }, 150);
  }

  ngOnDestroy(): void {
    if (this.updateInterval) clearInterval(this.updateInterval);
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    this.allStocks.forEach(s => s.chart?.destroy());
    this.detailChart?.destroy();
  }

  // ========== API DATA LOADING ==========

  private loadRealData(): void {
    this.isLoading = true;
    const symbols = this.allStocks.map(s => s.symbol);

    this.twelveData.getQuotes(symbols).subscribe({
      next: (quotes) => {
        quotes.forEach((quote, symbol) => {
          const stock = this.allStocks.find(s => s.symbol === symbol);
          if (stock && quote.price > 0) {
            stock.price = quote.price;
            stock.change = quote.change;
            stock.changePercent = quote.changePercent;
            stock.basePrice = quote.price;
            stock.apiLoaded = true;
            stock.loading = false;
            // Re-generate history around real price
            stock.history = this.generateHistoryAround(quote.price, 50, quote.changePercent);
          }
        });
        this.isLoading = false;
        this.lastUpdate = new Date();
        this.applyFilters();
        setTimeout(() => this.initMiniCharts(), 100);
      },
      error: () => {
        this.isLoading = false;
        // Keep fallback data
        this.allStocks.forEach(s => s.loading = false);
      },
    });
  }

  private refreshPrices(): void {
    // Refresh only visible stocks to save API credits
    const symbols = this.filteredStocks
      .slice(0, 8) // Max 8 at a time
      .map(s => s.symbol);

    if (symbols.length === 0) return;

    this.twelveData.getPrices(symbols).subscribe(prices => {
      prices.forEach((price, symbol) => {
        const stock = this.allStocks.find(s => s.symbol === symbol);
        if (stock && price > 0) {
          const oldPrice = stock.price;
          stock.price = price;
          stock.change = +(price - stock.basePrice).toFixed(4);
          stock.changePercent = +((stock.change / stock.basePrice) * 100).toFixed(2);

          // Add new point to history
          stock.history.push(price);
          if (stock.history.length > 50) stock.history.shift();

          stock.apiLoaded = true;
        }
      });
      this.lastUpdate = new Date();
    });
  }

  private generateHistoryAround(price: number, points: number, trendPercent: number): number[] {
    const history: number[] = [];
    const startPrice = price * (1 - trendPercent / 100);
    history.push(startPrice);
    for (let i = 1; i < points; i++) {
      const last = history[i - 1];
      const trend = (price - startPrice) / points;
      const noise = (Math.random() - 0.5) * (price * 0.005);
      history.push(+(last + trend + noise).toFixed(4));
    }
    history[points - 1] = price;
    return history;
  }

  // ========== FAVORITES ==========

  private loadFavorites(): void {
    try {
      const saved = localStorage.getItem(this.FAVORITES_KEY);
      if (saved) this.favorites = new Set(JSON.parse(saved));
    } catch { /* ignore */ }
  }

  private saveFavorites(): void {
    localStorage.setItem(this.FAVORITES_KEY, JSON.stringify([...this.favorites]));
  }

  toggleFavorite(event: Event, stock: StockItem): void {
    event.stopPropagation();
    if (this.favorites.has(stock.symbol)) {
      this.favorites.delete(stock.symbol);
    } else {
      this.favorites.add(stock.symbol);
    }
    this.saveFavorites();
    if (this.showFavoritesOnly) this.applyFilters();
  }

  isFavorite(symbol: string): boolean {
    return this.favorites.has(symbol);
  }

  toggleFavoritesFilter(): void {
    this.showFavoritesOnly = !this.showFavoritesOnly;
    this.applyFilters();
  }

  // ========== SEARCH & FILTERS ==========

  onSearchChange(): void {
    this.applyFilters();
  }

  setCategory(cat: string): void {
    this.activeCategory = cat;
    this.applyFilters();
  }

  applyFilters(): void {
    let result = this.allStocks;

    if (this.activeCategory !== 'Tous') {
      result = result.filter(s => s.category === this.activeCategory);
    }

    if (this.showFavoritesOnly) {
      result = result.filter(s => this.favorites.has(s.symbol));
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(s =>
        s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
      );
    }

    this.filteredStocks = result;
    setTimeout(() => this.initMiniCharts(), 100);
  }

  // ========== DETAIL VIEW ==========

  selectStock(stock: StockItem): void {
    this.selectedStock = stock;
    // Fetch time series for detailed chart
    this.twelveData.getTimeSeries(stock.symbol, '1day', 50).subscribe(series => {
      if (series.length > 0) {
        stock.history = series.map(p => p.close);
        stock.price = series[series.length - 1].close;
      }
      setTimeout(() => this.initDetailChart(), 100);
    });
  }

  closeDetail(): void {
    this.detailChart?.destroy();
    this.detailChart = undefined;
    this.selectedStock = null;
  }

  // ========== FALLBACK DATA ==========

  private initFallbackHistories(): void {
    this.allStocks.forEach(stock => {
      stock.history = this.generateHistory(stock.basePrice, 50);
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
      history.push(+(last + drift).toFixed(4));
    }
    return history;
  }

  private startSimulatedUpdates(): void {
    // Light simulated updates between API refreshes for visual smoothness
    this.updateInterval = setInterval(() => {
      this.allStocks.forEach(stock => {
        const last = stock.history[stock.history.length - 1];
        const drift = (Math.random() - 0.48) * (last * 0.002);
        const newPoint = +(last + drift).toFixed(4);
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

      // Update detail chart
      if (this.selectedStock && this.detailChart) {
        const stock = this.selectedStock;
        const isPositive = stock.changePercent >= 0;
        const lineColor = isPositive ? stock.color : '#EF4444';
        this.detailChart.data.labels = stock.history.map((_, i) => i.toString());
        this.detailChart.data.datasets[0].data = stock.history;
        this.detailChart.data.datasets[0].borderColor = lineColor;
        this.detailChart.update('none');
      }
    }, 5000);
  }

  // ========== CHARTS ==========

  private initMiniCharts(): void {
    this.filteredStocks.forEach(s => {
      s.chart?.destroy();
      s.chart = undefined;
    });

    if (!this.miniCanvases) return;

    this.miniCanvases.forEach((canvasRef, index) => {
      const stock = this.filteredStocks[index];
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
          animation: { duration: 0 },
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: { x: { display: false }, y: { display: false } },
        },
      });
    });
  }

  private initDetailChart(): void {
    this.detailChart?.destroy();
    if (!this.selectedStock || !this.detailCanvas?.nativeElement) return;

    const stock = this.selectedStock;
    const ctx = this.detailCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const isPositive = stock.changePercent >= 0;
    const lineColor = isPositive ? stock.color : '#EF4444';

    const gradient = ctx.createLinearGradient(0, 0, 0, this.detailCanvas.nativeElement.height);
    gradient.addColorStop(0, lineColor + '33');
    gradient.addColorStop(1, lineColor + '00');

    this.detailChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: stock.history.map((_, i) => i.toString()),
        datasets: [{
          data: stock.history,
          borderColor: lineColor,
          borderWidth: 2.5,
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
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            mode: 'index',
            intersect: false,
            backgroundColor: '#111620',
            titleColor: '#F0F4FF',
            bodyColor: '#8892A4',
            borderColor: '#1E2738',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: (ctx) => `${this.formatPrice(ctx.raw as number)}`,
            },
          },
        },
        scales: {
          x: { display: false },
          y: {
            display: true,
            grid: { color: 'rgba(30,39,56,0.5)' },
            ticks: { color: '#4A5568', font: { size: 11 } },
          },
        },
        interaction: { mode: 'index', intersect: false },
      },
    });
  }

  // ========== UTILS ==========

  formatPrice(price: number): string {
    if (price >= 10000) return price.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    if (price >= 100) return price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 1) return price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return price.toLocaleString('fr-FR', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  }

  getMax(stock: StockItem): number {
    return Math.max(...stock.history);
  }

  getMin(stock: StockItem): number {
    return Math.min(...stock.history);
  }

  getLastUpdateTime(): string {
    if (!this.lastUpdate) return '';
    return this.lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
