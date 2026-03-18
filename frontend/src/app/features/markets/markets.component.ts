import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  ViewChildren,
  QueryList,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { TwelveDataService, StockQuote } from './twelve-data.service';

Chart.register(...registerables);

interface StockItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  history: number[];
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
export class MarketsComponent implements OnInit, OnDestroy {
  @ViewChildren('miniCanvas') miniCanvases!: QueryList<ElementRef<HTMLCanvasElement>>;
  @ViewChild('detailCanvas') detailCanvas?: ElementRef<HTMLCanvasElement>;

  private priceRefreshInterval?: ReturnType<typeof setInterval>;
  private readonly FAVORITES_KEY = 'fincoach_favorite_stocks';

  searchQuery         = '';
  activeCategory      = 'Tous';
  showFavoritesOnly   = false;
  favorites: Set<string> = new Set();
  selectedStock: StockItem | null = null;
  private detailChart?: Chart;
  isLoadingQuotes     = true;
  lastUpdate: Date | null = null;

  categories = ['Tous', 'Indices', 'Actions', 'Crypto', 'Matières premières', 'Devises'];

  allStocks: StockItem[] = [
    // Indices
    { symbol: 'CAC 40',     name: 'Bourse de Paris',          price: 0, change: 0, changePercent: 0, history: [], color: '#C9A84C', category: 'Indices' },
    { symbol: 'S&P 500',    name: "Standard & Poor's 500",    price: 0, change: 0, changePercent: 0, history: [], color: '#3B82F6', category: 'Indices' },
    { symbol: 'NASDAQ',     name: 'NASDAQ Composite',         price: 0, change: 0, changePercent: 0, history: [], color: '#8B5CF6', category: 'Indices' },
    { symbol: 'DAX',        name: 'Bourse de Francfort',      price: 0, change: 0, changePercent: 0, history: [], color: '#EAB308', category: 'Indices' },
    { symbol: 'FTSE 100',   name: 'Bourse de Londres',        price: 0, change: 0, changePercent: 0, history: [], color: '#14B8A6', category: 'Indices' },
    { symbol: 'NIKKEI 225', name: 'Bourse de Tokyo',          price: 0, change: 0, changePercent: 0, history: [], color: '#EF4444', category: 'Indices' },

    // Actions US
    { symbol: 'AAPL',  name: 'Apple Inc.',      price: 0, change: 0, changePercent: 0, history: [], color: '#8B5CF6', category: 'Actions' },
    { symbol: 'MSFT',  name: 'Microsoft Corp.', price: 0, change: 0, changePercent: 0, history: [], color: '#3B82F6', category: 'Actions' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.',   price: 0, change: 0, changePercent: 0, history: [], color: '#22C55E', category: 'Actions' },
    { symbol: 'AMZN',  name: 'Amazon.com Inc.', price: 0, change: 0, changePercent: 0, history: [], color: '#F97316', category: 'Actions' },
    { symbol: 'TSLA',  name: 'Tesla Inc.',      price: 0, change: 0, changePercent: 0, history: [], color: '#EF4444', category: 'Actions' },
    { symbol: 'NVDA',  name: 'NVIDIA Corp.',    price: 0, change: 0, changePercent: 0, history: [], color: '#22C55E', category: 'Actions' },
    { symbol: 'META',  name: 'Meta Platforms',  price: 0, change: 0, changePercent: 0, history: [], color: '#3B82F6', category: 'Actions' },
    // Actions FR
    { symbol: 'LVMH', name: 'LVMH Moet Hennessy', price: 0, change: 0, changePercent: 0, history: [], color: '#C9A84C', category: 'Actions' },
    { symbol: 'TTE',  name: 'TotalEnergies SE',   price: 0, change: 0, changePercent: 0, history: [], color: '#EF4444', category: 'Actions' },
    { symbol: 'AIR',  name: 'Airbus SE',           price: 0, change: 0, changePercent: 0, history: [], color: '#3B82F6', category: 'Actions' },
    { symbol: 'SAN',  name: 'Sanofi SA',           price: 0, change: 0, changePercent: 0, history: [], color: '#8B5CF6', category: 'Actions' },
    { symbol: 'BNP',  name: 'BNP Paribas',         price: 0, change: 0, changePercent: 0, history: [], color: '#14B8A6', category: 'Actions' },
    { symbol: 'OR',   name: "L'Oréal SA",           price: 0, change: 0, changePercent: 0, history: [], color: '#C9A84C', category: 'Actions' },

    // Crypto
    { symbol: 'BTC/EUR',  name: 'Bitcoin',   price: 0, change: 0, changePercent: 0, history: [], color: '#F97316', category: 'Crypto' },
    { symbol: 'ETH/EUR',  name: 'Ethereum',  price: 0, change: 0, changePercent: 0, history: [], color: '#8B5CF6', category: 'Crypto' },
    { symbol: 'SOL/EUR',  name: 'Solana',    price: 0, change: 0, changePercent: 0, history: [], color: '#14B8A6', category: 'Crypto' },
    { symbol: 'ADA/EUR',  name: 'Cardano',   price: 0, change: 0, changePercent: 0, history: [], color: '#3B82F6', category: 'Crypto' },
    { symbol: 'XRP/EUR',  name: 'Ripple',    price: 0, change: 0, changePercent: 0, history: [], color: '#22C55E', category: 'Crypto' },

    // Matières premières
    { symbol: 'XAU',   name: 'Or (Gold)',        price: 0, change: 0, changePercent: 0, history: [], color: '#C9A84C', category: 'Matières premières' },
    { symbol: 'XAG',   name: 'Argent (Silver)',  price: 0, change: 0, changePercent: 0, history: [], color: '#8892A4', category: 'Matières premières' },
    { symbol: 'WTI',   name: 'Pétrole brut WTI', price: 0, change: 0, changePercent: 0, history: [], color: '#F97316', category: 'Matières premières' },
    { symbol: 'BRENT', name: 'Pétrole Brent',    price: 0, change: 0, changePercent: 0, history: [], color: '#EAB308', category: 'Matières premières' },
    { symbol: 'GAS',   name: 'Gaz naturel',      price: 0, change: 0, changePercent: 0, history: [], color: '#3B82F6', category: 'Matières premières' },

    // Devises
    { symbol: 'EUR/USD', name: 'Euro / Dollar US',          price: 0, change: 0, changePercent: 0, history: [], color: '#3B82F6', category: 'Devises' },
    { symbol: 'GBP/EUR', name: 'Livre sterling / Euro',     price: 0, change: 0, changePercent: 0, history: [], color: '#22C55E', category: 'Devises' },
    { symbol: 'USD/JPY', name: 'Dollar US / Yen',           price: 0, change: 0, changePercent: 0, history: [], color: '#EF4444', category: 'Devises' },
    { symbol: 'EUR/CHF', name: 'Euro / Franc suisse',       price: 0, change: 0, changePercent: 0, history: [], color: '#14B8A6', category: 'Devises' },
  ];

  filteredStocks: StockItem[] = [];

  constructor(
    private router: Router,
    private twelveData: TwelveDataService,
  ) {}

  // ─────────────────────────────────────────────
  // Lifecycle
  // ─────────────────────────────────────────────

  ngOnInit(): void {
    this.loadFavorites();
    this.applyFilters();
    // 1. Charger les quotes en batch
    this.loadAllQuotes();
    // 2. Charger les time series pour les graphiques
    this.loadAllTimeSeries();
    // 3. Rafraîchir les prix toutes les 60s
    this.priceRefreshInterval = setInterval(() => this.refreshVisiblePrices(), 60_000);
  }

  ngOnDestroy(): void {
    if (this.priceRefreshInterval) clearInterval(this.priceRefreshInterval);
    this.allStocks.forEach(s => s.chart?.destroy());
    this.detailChart?.destroy();
  }

  // ─────────────────────────────────────────────
  // Chargement initial des données API
  // ─────────────────────────────────────────────

  /**
   * Charge les quotes pour tous les instruments en batch.
   */
  private loadAllQuotes(): void {
    const symbols = this.allStocks.map(s => s.symbol);
    this.isLoadingQuotes = true;

    this.twelveData.getQuotes(symbols).subscribe({
      next: (quotes) => {
        quotes.forEach((quote, symbol) => {
          const stock = this.allStocks.find(s => s.symbol === symbol);
          if (stock && quote.price > 0) {
            stock.price         = quote.price;
            stock.change        = quote.change;
            stock.changePercent = quote.changePercent;
          }
        });
        this.isLoadingQuotes = false;
        this.lastUpdate = new Date();
        this.applyFilters();
      },
      error: () => {
        this.isLoadingQuotes = false;
      },
    });
  }

  /**
   * Charge les séries temporelles (30 jours) pour construire les mini-graphiques.
   * Échelonné à raison de 1 appel toutes les 8s pour respecter la limite 8 req/min.
   */
  private loadAllTimeSeries(): void {
    let delay = 0;
    this.allStocks.forEach(stock => {
      setTimeout(() => {
        this.twelveData.getTimeSeries(stock.symbol, '1day', 30).subscribe(series => {
          if (series.length > 0) {
            stock.history = series.map(p => p.close);
            // Restituer le graphique si la carte est visible
            this.redrawMiniChart(stock);
          }
        });
      }, delay);
      delay += 8_000;
    });
  }

  /**
   * Refresh prix léger — seulement les 8 premiers instruments visibles.
   */
  private refreshVisiblePrices(): void {
    const visible = this.filteredStocks.slice(0, 8).map(s => s.symbol);
    if (!visible.length) return;

    this.twelveData.getPrices(visible).subscribe(prices => {
      prices.forEach((newPrice, symbol) => {
        const stock = this.allStocks.find(s => s.symbol === symbol);
        if (stock && newPrice > 0) {
          const old = stock.price;
          stock.price = newPrice;
          if (old > 0) {
            stock.change        = +(newPrice - old).toFixed(4);
            stock.changePercent = +((stock.change / old) * 100).toFixed(2);
          }
          if (stock.history.length > 0) {
            stock.history.push(newPrice);
            stock.history.shift();
            this.redrawMiniChart(stock);
          }
        }
      });
      this.lastUpdate = new Date();
    });
  }

  // ─────────────────────────────────────────────
  // Favoris
  // ─────────────────────────────────────────────

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
    this.favorites.has(stock.symbol)
      ? this.favorites.delete(stock.symbol)
      : this.favorites.add(stock.symbol);
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

  // ─────────────────────────────────────────────
  // Recherche & filtres
  // ─────────────────────────────────────────────

  onSearchChange(): void { this.applyFilters(); }

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
    setTimeout(() => this.initAllMiniCharts(), 100);
  }

  // ─────────────────────────────────────────────
  // Vue détail
  // ─────────────────────────────────────────────

  selectStock(stock: StockItem): void {
    this.selectedStock = stock;
    // Charger time series 1min pour affichage détaillé
    this.twelveData.getTimeSeries(stock.symbol, '1h', 48).subscribe(series => {
      if (series.length > 0) {
        stock.history = series.map(p => p.close);
        if (stock.price === 0) stock.price = series[series.length - 1].close;
      }
      setTimeout(() => this.initDetailChart(), 100);
    });
  }

  closeDetail(): void {
    this.detailChart?.destroy();
    this.detailChart = undefined;
    this.selectedStock = null;
  }

  // ─────────────────────────────────────────────
  // Graphiques Chart.js
  // ─────────────────────────────────────────────

  private initAllMiniCharts(): void {
    this.filteredStocks.forEach(s => {
      s.chart?.destroy();
      s.chart = undefined;
    });
    if (!this.miniCanvases) return;

    this.miniCanvases.forEach((canvasRef, index) => {
      const stock = this.filteredStocks[index];
      if (!stock || !canvasRef?.nativeElement || stock.history.length === 0) return;
      this.buildMiniChart(stock, canvasRef.nativeElement);
    });
  }

  private redrawMiniChart(stock: StockItem): void {
    const index = this.filteredStocks.indexOf(stock);
    if (index === -1 || !this.miniCanvases) return;
    const canvasRef = this.miniCanvases.get(index);
    if (!canvasRef?.nativeElement) return;

    stock.chart?.destroy();
    stock.chart = undefined;
    this.buildMiniChart(stock, canvasRef.nativeElement);
  }

  private buildMiniChart(stock: StockItem, canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    if (!ctx || stock.history.length === 0) return;

    const isPositive = stock.changePercent >= 0;
    const lineColor  = isPositive ? stock.color : '#EF4444';
    const gradient   = ctx.createLinearGradient(0, 0, 0, canvas.height);
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
  }

  private initDetailChart(): void {
    this.detailChart?.destroy();
    if (!this.selectedStock || !this.detailCanvas?.nativeElement) return;
    if (this.selectedStock.history.length === 0) return;

    const stock  = this.selectedStock;
    const ctx    = this.detailCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const isPositive = stock.changePercent >= 0;
    const lineColor  = isPositive ? stock.color : '#EF4444';
    const gradient   = ctx.createLinearGradient(0, 0, 0, this.detailCanvas.nativeElement.height);
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
              label: (c) => `${this.formatPrice(c.raw as number)}`,
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

  // ─────────────────────────────────────────────
  // Utilitaires
  // ─────────────────────────────────────────────

  formatPrice(price: number): string {
    if (price <= 0)     return '—';
    if (price >= 10000) return price.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    if (price >= 100)   return price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 1)     return price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return price.toLocaleString('fr-FR', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  }

  getMax(stock: StockItem): number { return stock.history.length ? Math.max(...stock.history) : 0; }
  getMin(stock: StockItem): number { return stock.history.length ? Math.min(...stock.history) : 0; }

  getLastUpdateTime(): string {
    if (!this.lastUpdate) return '';
    return this.lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  goHome(): void { this.router.navigate(['/']); }
}
