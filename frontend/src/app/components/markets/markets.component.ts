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
  private readonly FAVORITES_KEY = 'fincoach_favorite_stocks';

  searchQuery = '';
  activeCategory = 'Tous';
  showFavoritesOnly = false;
  favorites: Set<string> = new Set();
  selectedStock: StockItem | null = null;
  private detailChart?: Chart;

  categories = ['Tous', 'Indices', 'Actions', 'Crypto', 'Matieres premieres', 'Devises'];

  allStocks: StockItem[] = [
    // Indices
    { symbol: 'CAC 40', name: 'Bourse de Paris', price: 8147.23, change: 0, changePercent: 0, history: [], basePrice: 8147, color: '#C9A84C', category: 'Indices' },
    { symbol: 'S&P 500', name: 'Standard & Poor\'s 500', price: 5248.80, change: 0, changePercent: 0, history: [], basePrice: 5248, color: '#3B82F6', category: 'Indices' },
    { symbol: 'NASDAQ', name: 'NASDAQ Composite', price: 16421.00, change: 0, changePercent: 0, history: [], basePrice: 16421, color: '#8B5CF6', category: 'Indices' },
    { symbol: 'DAX', name: 'Bourse de Francfort', price: 18432.10, change: 0, changePercent: 0, history: [], basePrice: 18432, color: '#EAB308', category: 'Indices' },
    { symbol: 'FTSE 100', name: 'Bourse de Londres', price: 7930.50, change: 0, changePercent: 0, history: [], basePrice: 7930, color: '#14B8A6', category: 'Indices' },
    { symbol: 'NIKKEI 225', name: 'Bourse de Tokyo', price: 39245.60, change: 0, changePercent: 0, history: [], basePrice: 39245, color: '#EF4444', category: 'Indices' },
    { symbol: 'MSCI World', name: 'Indice Mondial', price: 3591.20, change: 0, changePercent: 0, history: [], basePrice: 3591, color: '#14B8A6', category: 'Indices' },

    // Actions
    { symbol: 'AAPL', name: 'Apple Inc.', price: 189.42, change: 0, changePercent: 0, history: [], basePrice: 189, color: '#8B5CF6', category: 'Actions' },
    { symbol: 'MSFT', name: 'Microsoft Corp.', price: 415.18, change: 0, changePercent: 0, history: [], basePrice: 415, color: '#3B82F6', category: 'Actions' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 155.72, change: 0, changePercent: 0, history: [], basePrice: 155, color: '#22C55E', category: 'Actions' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 182.30, change: 0, changePercent: 0, history: [], basePrice: 182, color: '#F97316', category: 'Actions' },
    { symbol: 'TSLA', name: 'Tesla Inc.', price: 248.50, change: 0, changePercent: 0, history: [], basePrice: 248, color: '#EF4444', category: 'Actions' },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 875.30, change: 0, changePercent: 0, history: [], basePrice: 875, color: '#22C55E', category: 'Actions' },
    { symbol: 'META', name: 'Meta Platforms', price: 505.60, change: 0, changePercent: 0, history: [], basePrice: 505, color: '#3B82F6', category: 'Actions' },
    { symbol: 'LVMH', name: 'LVMH Moet Hennessy', price: 712.40, change: 0, changePercent: 0, history: [], basePrice: 712, color: '#C9A84C', category: 'Actions' },
    { symbol: 'TTE', name: 'TotalEnergies SE', price: 62.84, change: 0, changePercent: 0, history: [], basePrice: 62, color: '#EF4444', category: 'Actions' },
    { symbol: 'AIR', name: 'Airbus SE', price: 158.92, change: 0, changePercent: 0, history: [], basePrice: 158, color: '#3B82F6', category: 'Actions' },
    { symbol: 'SAN', name: 'Sanofi SA', price: 92.45, change: 0, changePercent: 0, history: [], basePrice: 92, color: '#8B5CF6', category: 'Actions' },
    { symbol: 'BNP', name: 'BNP Paribas', price: 61.20, change: 0, changePercent: 0, history: [], basePrice: 61, color: '#14B8A6', category: 'Actions' },
    { symbol: 'OR', name: 'L\'Oreal SA', price: 402.30, change: 0, changePercent: 0, history: [], basePrice: 402, color: '#C9A84C', category: 'Actions' },

    // Crypto
    { symbol: 'BTC/EUR', name: 'Bitcoin', price: 61420.50, change: 0, changePercent: 0, history: [], basePrice: 61420, color: '#F97316', category: 'Crypto' },
    { symbol: 'ETH/EUR', name: 'Ethereum', price: 3247.90, change: 0, changePercent: 0, history: [], basePrice: 3247, color: '#8B5CF6', category: 'Crypto' },
    { symbol: 'SOL/EUR', name: 'Solana', price: 142.80, change: 0, changePercent: 0, history: [], basePrice: 142, color: '#14B8A6', category: 'Crypto' },
    { symbol: 'ADA/EUR', name: 'Cardano', price: 0.62, change: 0, changePercent: 0, history: [], basePrice: 0.62, color: '#3B82F6', category: 'Crypto' },
    { symbol: 'XRP/EUR', name: 'Ripple', price: 0.58, change: 0, changePercent: 0, history: [], basePrice: 0.58, color: '#22C55E', category: 'Crypto' },
    { symbol: 'DOT/EUR', name: 'Polkadot', price: 7.85, change: 0, changePercent: 0, history: [], basePrice: 7.85, color: '#EF4444', category: 'Crypto' },
    { symbol: 'AVAX/EUR', name: 'Avalanche', price: 38.40, change: 0, changePercent: 0, history: [], basePrice: 38, color: '#EF4444', category: 'Crypto' },

    // Matieres premieres
    { symbol: 'XAU', name: 'Or (Gold)', price: 2342.10, change: 0, changePercent: 0, history: [], basePrice: 2342, color: '#C9A84C', category: 'Matieres premieres' },
    { symbol: 'XAG', name: 'Argent (Silver)', price: 27.85, change: 0, changePercent: 0, history: [], basePrice: 27, color: '#8892A4', category: 'Matieres premieres' },
    { symbol: 'WTI', name: 'Petrole brut WTI', price: 78.50, change: 0, changePercent: 0, history: [], basePrice: 78, color: '#F97316', category: 'Matieres premieres' },
    { symbol: 'BRENT', name: 'Petrole Brent', price: 82.30, change: 0, changePercent: 0, history: [], basePrice: 82, color: '#EAB308', category: 'Matieres premieres' },
    { symbol: 'GAS', name: 'Gaz naturel', price: 2.15, change: 0, changePercent: 0, history: [], basePrice: 2.15, color: '#3B82F6', category: 'Matieres premieres' },

    // Devises
    { symbol: 'EUR/USD', name: 'Euro / Dollar US', price: 1.0842, change: 0, changePercent: 0, history: [], basePrice: 1.0842, color: '#3B82F6', category: 'Devises' },
    { symbol: 'GBP/EUR', name: 'Livre sterling / Euro', price: 1.1645, change: 0, changePercent: 0, history: [], basePrice: 1.1645, color: '#22C55E', category: 'Devises' },
    { symbol: 'USD/JPY', name: 'Dollar US / Yen', price: 151.42, change: 0, changePercent: 0, history: [], basePrice: 151, color: '#EF4444', category: 'Devises' },
    { symbol: 'EUR/CHF', name: 'Euro / Franc suisse', price: 0.9632, change: 0, changePercent: 0, history: [], basePrice: 0.9632, color: '#14B8A6', category: 'Devises' },
  ];

  filteredStocks: StockItem[] = [];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadFavorites();
    this.initHistories();
    this.applyFilters();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initMiniCharts();
      this.startUpdates();
    }, 150);
  }

  ngOnDestroy(): void {
    if (this.updateInterval) clearInterval(this.updateInterval);
    this.allStocks.forEach(s => s.chart?.destroy());
    this.detailChart?.destroy();
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

    // Re-init charts after filter changes
    setTimeout(() => this.initMiniCharts(), 100);
  }

  // ========== DETAIL VIEW ==========

  selectStock(stock: StockItem): void {
    this.selectedStock = stock;
    setTimeout(() => this.initDetailChart(), 100);
  }

  closeDetail(): void {
    this.detailChart?.destroy();
    this.detailChart = undefined;
    this.selectedStock = null;
  }

  // ========== DATA ==========

  private initHistories(): void {
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

  private startUpdates(): void {
    this.updateInterval = setInterval(() => {
      this.allStocks.forEach(stock => {
        const last = stock.history[stock.history.length - 1];
        const drift = (Math.random() - 0.48) * (last * 0.004);
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
    }, 3000);
  }

  // ========== CHARTS ==========

  private initMiniCharts(): void {
    // Destroy previous charts
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

  goHome(): void {
    this.router.navigate(['/']);
  }
}
