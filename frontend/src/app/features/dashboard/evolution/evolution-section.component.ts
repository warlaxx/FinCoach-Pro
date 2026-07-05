import {
  Component, Input, OnInit, OnChanges, OnDestroy, SimpleChanges,
  ViewChild, ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { DashboardService } from '../dashboard.service';
import { FinancialSnapshot } from '../../../shared/models/financial-snapshot.model';
import {
  COLOR_POSITIVE, COLOR_NEGATIVE, COLOR_BLUE, COLOR_ORANGE,
  CHART_TOOLTIP_BG, CHART_TOOLTIP_TITLE_COLOR, CHART_TOOLTIP_BODY_COLOR, CHART_TOOLTIP_BORDER_COLOR,
} from '../../../shared/config/app.config';

Chart.register(...registerables);

const GRID_COLOR = '#1A1A1A';
const TICK_COLOR = '#888888';
/** Fetch the full window once; period buttons filter locally. */
const MAX_MONTHS = 12;

type PeriodMonths = 3 | 6 | 12;

/**
 * "Mon évolution" dashboard section — TICKET-09.
 *
 * Renders four Chart.js charts from the monthly financial snapshots:
 * score (A–F), income vs expenses, savings, and debt. Hidden while the
 * user has no history; shows an explanation while there is only one
 * snapshot (charts need at least two points to be meaningful).
 */
@Component({
  selector: 'app-evolution-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './evolution-section.component.html',
  styleUrls: ['./evolution-section.component.scss'],
})
export class EvolutionSectionComponent implements OnInit, OnChanges, OnDestroy {
  /** Bump to force a reload (e.g. after the profile form is saved). */
  @Input() refreshToken = 0;

  @ViewChild('scoreCanvas')   scoreCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('incomeCanvas')  incomeCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('savingsCanvas') savingsCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('debtCanvas')    debtCanvas?: ElementRef<HTMLCanvasElement>;

  snapshots: FinancialSnapshot[] = [];
  period: PeriodMonths = 6;
  loaded = false;

  private charts: Chart[] = [];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.load();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['refreshToken'] && !changes['refreshToken'].firstChange) {
      this.load();
    }
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  /** Snapshots restricted to the selected period (they arrive oldest first). */
  get visibleSnapshots(): FinancialSnapshot[] {
    return this.snapshots.slice(-this.period);
  }

  get hasHistory(): boolean {
    return this.loaded && this.snapshots.length > 0;
  }

  get hasEnoughData(): boolean {
    return this.snapshots.length >= 2;
  }

  setPeriod(period: PeriodMonths): void {
    if (this.period === period) return;
    this.period = period;
    this.renderSoon();
  }

  private load(): void {
    this.dashboardService.getHistory(MAX_MONTHS).subscribe({
      next: (snapshots) => {
        this.snapshots = snapshots;
        this.loaded = true;
        if (this.hasEnoughData) this.renderSoon();
      },
      error: () => {
        // Section simply stays hidden if history can't be loaded
        this.snapshots = [];
        this.loaded = true;
      },
    });
  }

  /** Waits one tick so *ngIf has created the canvases before drawing. */
  private renderSoon(): void {
    setTimeout(() => this.renderCharts());
  }

  private renderCharts(): void {
    this.destroyCharts();

    const data = this.visibleSnapshots;
    if (data.length < 2) return;

    const labels = data.map((s) =>
      new Date(s.month).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
    );

    this.renderScoreChart(labels, data);
    this.renderIncomeChart(labels, data);
    this.renderLineChart(this.savingsCanvas, labels, data.map((s) => s.savings), 'Épargne', COLOR_BLUE);
    this.renderLineChart(this.debtCanvas, labels, data.map((s) => s.debt), 'Dettes', COLOR_ORANGE);
  }

  private renderScoreChart(labels: string[], data: FinancialSnapshot[]): void {
    const ctx = this.scoreCanvas?.nativeElement.getContext('2d');
    if (!ctx) return;

    const GRADE_LABELS: Record<number, string> = { 100: 'A', 80: 'B', 60: 'C', 40: 'D', 20: 'E', 0: 'F' };

    this.charts.push(new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Score',
          data: data.map((s) => s.scoreValue),
          borderColor: COLOR_POSITIVE,
          backgroundColor: COLOR_POSITIVE + '22',
          fill: true,
          tension: 0.35,
          spanGaps: true,
          pointRadius: 4,
          pointBackgroundColor: COLOR_POSITIVE,
        }],
      },
      options: {
        ...this.baseOptions(),
        scales: {
          x: this.xScale(),
          y: {
            min: 0,
            max: 100,
            grid: { color: GRID_COLOR },
            ticks: {
              color: TICK_COLOR,
              stepSize: 20,
              callback: (value) => GRADE_LABELS[Number(value)] ?? '',
            },
          },
        },
        plugins: {
          ...this.basePlugins(),
          tooltip: {
            ...this.baseTooltip(),
            callbacks: {
              label: (item) => `Score : ${data[item.dataIndex]?.score ?? '—'}`,
            },
          },
        },
      },
    }));
  }

  private renderIncomeChart(labels: string[], data: FinancialSnapshot[]): void {
    const ctx = this.incomeCanvas?.nativeElement.getContext('2d');
    if (!ctx) return;

    this.charts.push(new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Revenus',
            data: data.map((s) => s.income),
            backgroundColor: COLOR_POSITIVE + 'CC',
            borderRadius: 4,
          },
          {
            label: 'Charges',
            data: data.map((s) => s.expenses),
            backgroundColor: COLOR_NEGATIVE + 'CC',
            borderRadius: 4,
          },
        ],
      },
      options: {
        ...this.baseOptions(),
        scales: { x: this.xScale(), y: this.euroScale() },
        plugins: { ...this.basePlugins(true), tooltip: this.euroTooltip() },
      },
    }));
  }

  private renderLineChart(
    canvas: ElementRef<HTMLCanvasElement> | undefined,
    labels: string[],
    values: number[],
    label: string,
    color: string,
  ): void {
    const ctx = canvas?.nativeElement.getContext('2d');
    if (!ctx) return;

    this.charts.push(new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label,
          data: values,
          borderColor: color,
          backgroundColor: color + '22',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: color,
        }],
      },
      options: {
        ...this.baseOptions(),
        scales: { x: this.xScale(), y: this.euroScale() },
        plugins: { ...this.basePlugins(), tooltip: this.euroTooltip() },
      },
    }));
  }

  // ─── Shared chart config (dark theme) ──────────────────────────────────────

  private baseOptions() {
    return { responsive: true, maintainAspectRatio: false } as const;
  }

  private xScale() {
    return { grid: { color: GRID_COLOR }, ticks: { color: TICK_COLOR } };
  }

  private euroScale() {
    return {
      grid: { color: GRID_COLOR },
      ticks: {
        color: TICK_COLOR,
        callback: (value: unknown) => `${Number(value).toLocaleString('fr-FR')} €`,
      },
    };
  }

  private basePlugins(showLegend = false) {
    return {
      legend: showLegend
        ? { labels: { color: TICK_COLOR, boxWidth: 12 } }
        : { display: false },
    };
  }

  private baseTooltip() {
    return {
      backgroundColor: CHART_TOOLTIP_BG,
      titleColor: CHART_TOOLTIP_TITLE_COLOR,
      bodyColor: CHART_TOOLTIP_BODY_COLOR,
      borderColor: CHART_TOOLTIP_BORDER_COLOR,
      borderWidth: 1,
    };
  }

  private euroTooltip() {
    return {
      ...this.baseTooltip(),
      callbacks: {
        label: (item: { dataset: { label?: string }; parsed: { y: number | null } }) =>
          `${item.dataset.label} : ${(item.parsed.y ?? 0).toLocaleString('fr-FR')} €`,
      },
    };
  }

  private destroyCharts(): void {
    this.charts.forEach((c) => c.destroy());
    this.charts = [];
  }
}
