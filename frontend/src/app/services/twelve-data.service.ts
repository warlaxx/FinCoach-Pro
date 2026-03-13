import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin, timer, Subject, BehaviorSubject } from 'rxjs';
import { map, catchError, switchMap, shareReplay, takeUntil } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  currency: string;
}

export interface TimeSeriesPoint {
  datetime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Mapping of display symbols to TwelveData API symbols
const SYMBOL_MAP: Record<string, string> = {
  // Indices
  'CAC 40': 'CAC40',
  'S&P 500': 'SPX',
  'NASDAQ': 'IXIC',
  'DAX': 'DAX',
  'FTSE 100': 'FTSE',
  'NIKKEI 225': 'N225',
  'MSCI World': 'URTH',

  // Actions FR (Euronext Paris)
  'LVMH': 'MC',
  'TTE': 'TTE',
  'AIR': 'AIR',
  'SAN': 'SAN',
  'BNP': 'BNP',
  'OR': 'OR',

  // Actions US
  'AAPL': 'AAPL',
  'MSFT': 'MSFT',
  'GOOGL': 'GOOGL',
  'AMZN': 'AMZN',
  'TSLA': 'TSLA',
  'NVDA': 'NVDA',
  'META': 'META',

  // Crypto
  'BTC/EUR': 'BTC/EUR',
  'ETH/EUR': 'ETH/EUR',
  'SOL/EUR': 'SOL/EUR',
  'ADA/EUR': 'ADA/EUR',
  'XRP/EUR': 'XRP/EUR',
  'DOT/EUR': 'DOT/EUR',
  'AVAX/EUR': 'AVAX/EUR',

  // Commodities
  'XAU': 'XAU/USD',
  'XAG': 'XAG/USD',
  'WTI': 'CL',
  'BRENT': 'BZ',
  'GAS': 'NG',

  // Forex
  'EUR/USD': 'EUR/USD',
  'GBP/EUR': 'GBP/EUR',
  'USD/JPY': 'USD/JPY',
  'EUR/CHF': 'EUR/CHF',
};

@Injectable({
  providedIn: 'root',
})
export class TwelveDataService {
  private baseUrl = environment.twelveDataBaseUrl;
  private apiKey = environment.twelveDataApiKey;
  private destroy$ = new Subject<void>();

  // Cache for quotes to avoid hammering the API
  private quoteCache = new Map<string, { data: StockQuote; timestamp: number }>();
  private readonly CACHE_TTL = 30_000; // 30 seconds

  constructor(private http: HttpClient) {}

  /**
   * Get the TwelveData API symbol for a display symbol
   */
  getApiSymbol(displaySymbol: string): string {
    return SYMBOL_MAP[displaySymbol] || displaySymbol;
  }

  /**
   * Fetch real-time price for a single symbol
   */
  getPrice(displaySymbol: string): Observable<number> {
    const apiSymbol = this.getApiSymbol(displaySymbol);
    const url = `${this.baseUrl}/price?symbol=${encodeURIComponent(apiSymbol)}&apikey=${this.apiKey}`;

    return this.http.get<any>(url).pipe(
      map(res => {
        if (res.code || res.status === 'error') {
          throw new Error(res.message || 'API error');
        }
        return parseFloat(res.price);
      }),
      catchError(err => {
        console.warn(`[TwelveData] Price error for ${displaySymbol}:`, err.message);
        return of(0);
      })
    );
  }

  /**
   * Fetch quote (price + change + change%) for a single symbol
   */
  getQuote(displaySymbol: string): Observable<StockQuote | null> {
    const apiSymbol = this.getApiSymbol(displaySymbol);

    // Check cache
    const cached = this.quoteCache.get(displaySymbol);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return of(cached.data);
    }

    const url = `${this.baseUrl}/quote?symbol=${encodeURIComponent(apiSymbol)}&apikey=${this.apiKey}`;

    return this.http.get<any>(url).pipe(
      map(res => {
        if (res.code || res.status === 'error') {
          console.warn(`[TwelveData] Quote error for ${displaySymbol}:`, res.message);
          return null;
        }
        const quote: StockQuote = {
          symbol: displaySymbol,
          name: res.name || displaySymbol,
          price: parseFloat(res.close) || 0,
          change: parseFloat(res.change) || 0,
          changePercent: parseFloat(res.percent_change) || 0,
          previousClose: parseFloat(res.previous_close) || 0,
          open: parseFloat(res.open) || 0,
          high: parseFloat(res.fifty_two_week?.high) || parseFloat(res.high) || 0,
          low: parseFloat(res.fifty_two_week?.low) || parseFloat(res.low) || 0,
          volume: parseInt(res.volume) || 0,
          currency: res.currency || 'USD',
        };
        this.quoteCache.set(displaySymbol, { data: quote, timestamp: Date.now() });
        return quote;
      }),
      catchError(err => {
        console.warn(`[TwelveData] Quote error for ${displaySymbol}:`, err.message);
        return of(null);
      })
    );
  }

  /**
   * Fetch quotes for multiple symbols in batches to respect rate limits
   * TwelveData free plan: 8 credits/min, 800/day
   * We batch symbols in groups of 8 max
   */
  getQuotes(displaySymbols: string[]): Observable<Map<string, StockQuote>> {
    const batchSize = 8;
    const batches: string[][] = [];

    for (let i = 0; i < displaySymbols.length; i += batchSize) {
      batches.push(displaySymbols.slice(i, i + batchSize));
    }

    // Process batches sequentially with delays to respect rate limits
    return new Observable<Map<string, StockQuote>>(subscriber => {
      const results = new Map<string, StockQuote>();
      let batchIndex = 0;

      const processBatch = () => {
        if (batchIndex >= batches.length) {
          subscriber.next(results);
          subscriber.complete();
          return;
        }

        const batch = batches[batchIndex];
        const apiSymbols = batch.map(s => this.getApiSymbol(s));
        const symbolStr = apiSymbols.map(s => encodeURIComponent(s)).join(',');
        const url = `${this.baseUrl}/quote?symbol=${symbolStr}&apikey=${this.apiKey}`;

        this.http.get<any>(url).pipe(
          catchError(err => {
            console.warn(`[TwelveData] Batch quote error:`, err.message);
            return of({});
          })
        ).subscribe(res => {
          if (batch.length === 1) {
            // Single symbol response is not wrapped in an object
            const displaySym = batch[0];
            if (res && !res.code && res.status !== 'error') {
              const quote = this.parseQuoteResponse(displaySym, res);
              if (quote) results.set(displaySym, quote);
            }
          } else {
            // Multi-symbol response
            for (let i = 0; i < batch.length; i++) {
              const displaySym = batch[i];
              const apiSym = apiSymbols[i];
              const data = res[apiSym];
              if (data && !data.code && data.status !== 'error') {
                const quote = this.parseQuoteResponse(displaySym, data);
                if (quote) results.set(displaySym, quote);
              }
            }
          }

          batchIndex++;
          if (batchIndex < batches.length) {
            // Delay between batches to respect rate limits (8 req/min)
            setTimeout(processBatch, 8000);
          } else {
            subscriber.next(results);
            subscriber.complete();
          }
        });
      };

      processBatch();
    });
  }

  /**
   * Fetch time series data for charts
   */
  getTimeSeries(
    displaySymbol: string,
    interval: string = '1day',
    outputSize: number = 30
  ): Observable<TimeSeriesPoint[]> {
    const apiSymbol = this.getApiSymbol(displaySymbol);
    const url = `${this.baseUrl}/time_series?symbol=${encodeURIComponent(apiSymbol)}&interval=${interval}&outputsize=${outputSize}&apikey=${this.apiKey}`;

    return this.http.get<any>(url).pipe(
      map(res => {
        if (res.code || res.status === 'error') {
          console.warn(`[TwelveData] Time series error for ${displaySymbol}:`, res.message);
          return [];
        }
        const values: any[] = res.values || [];
        return values.reverse().map((v: any) => ({
          datetime: v.datetime,
          open: parseFloat(v.open) || 0,
          high: parseFloat(v.high) || 0,
          low: parseFloat(v.low) || 0,
          close: parseFloat(v.close) || 0,
          volume: parseInt(v.volume) || 0,
        }));
      }),
      catchError(err => {
        console.warn(`[TwelveData] Time series error for ${displaySymbol}:`, err.message);
        return of([]);
      })
    );
  }

  /**
   * Fetch real-time price for multiple symbols (lighter than quote)
   */
  getPrices(displaySymbols: string[]): Observable<Map<string, number>> {
    const apiSymbols = displaySymbols.map(s => this.getApiSymbol(s));
    const symbolStr = apiSymbols.map(s => encodeURIComponent(s)).join(',');
    const url = `${this.baseUrl}/price?symbol=${symbolStr}&apikey=${this.apiKey}`;

    return this.http.get<any>(url).pipe(
      map(res => {
        const prices = new Map<string, number>();
        if (displaySymbols.length === 1) {
          if (res && res.price) {
            prices.set(displaySymbols[0], parseFloat(res.price));
          }
        } else {
          for (let i = 0; i < displaySymbols.length; i++) {
            const apiSym = apiSymbols[i];
            if (res[apiSym]?.price) {
              prices.set(displaySymbols[i], parseFloat(res[apiSym].price));
            }
          }
        }
        return prices;
      }),
      catchError(err => {
        console.warn(`[TwelveData] Prices error:`, err.message);
        return of(new Map<string, number>());
      })
    );
  }

  private parseQuoteResponse(displaySymbol: string, res: any): StockQuote | null {
    if (!res || res.code || res.status === 'error') return null;
    const quote: StockQuote = {
      symbol: displaySymbol,
      name: res.name || displaySymbol,
      price: parseFloat(res.close) || 0,
      change: parseFloat(res.change) || 0,
      changePercent: parseFloat(res.percent_change) || 0,
      previousClose: parseFloat(res.previous_close) || 0,
      open: parseFloat(res.open) || 0,
      high: parseFloat(res.fifty_two_week?.high) || parseFloat(res.high) || 0,
      low: parseFloat(res.fifty_two_week?.low) || parseFloat(res.low) || 0,
      volume: parseInt(res.volume) || 0,
      currency: res.currency || 'USD',
    };
    this.quoteCache.set(displaySymbol, { data: quote, timestamp: Date.now() });
    return quote;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.quoteCache.clear();
  }

  destroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
