import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NgxEchartsDirective } from 'ngx-echarts';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { EChartsOption } from 'echarts';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

interface Widget {
  id: number;
  type: string;
  title: string;
  query: string;
  chartOpt?: EChartsOption;
  data?: any[];
  columns?: string[];
  summary?: string;
  loading: boolean;
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgxEchartsDirective,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTableModule,
  ],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.scss',
})
export class ReportesComponent {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  queryForm = this.fb.group({ texto: [''] });
  widgets: Widget[] = [];
  loading = false;
  private nextId = 1;

  readonly suggestions = [
    '¿Cuántos incidentes hay en total?',
    '¿Cuál es el tiempo promedio de llegada por taller?',
    '¿Cómo evolucionaron los incidentes el último mes?',
    'Lista los pagos de la última semana',
  ];

  enviar(): void {
    const texto = this.queryForm.value.texto?.trim();
    if (!texto) return;

    this.loading = true;
    this.queryForm.reset();

    this.api.post<any>('/reportes/consultar', { texto }).subscribe({
      next: (r) => {
        const w: Widget = {
          id: this.nextId++,
          type: r.visualization,
          title: texto,
          query: texto,
          loading: false,
          summary: r.summary,
          data: r.data,
          columns: r.columns,
        };

        if (r.visualization === 'bar' || r.visualization === 'horizontal_bar') {
          const cats = r.data.map((d: any) => d.grupo_nombre || d.grupo || d.grupo_fecha || '?');
          const vals = r.data.map((d: any) => d.valor ?? 0);
          w.chartOpt = {
            tooltip: { trigger: 'axis' },
            xAxis: r.visualization === 'horizontal_bar'
              ? { type: 'value' }
              : { type: 'category', data: cats },
            yAxis: r.visualization === 'horizontal_bar'
              ? { type: 'category', data: cats }
              : { type: 'value' },
            series: [{
              type: 'bar',
              data: vals,
              ...(r.visualization === 'horizontal_bar' ? { label: { show: true, position: 'right' } } : {}),
            }],
          };
        } else if (r.visualization === 'line') {
          const cats = r.data.map((d: any) => d.grupo || d.grupo_fecha || d.grupo_hora || '?');
          const vals = r.data.map((d: any) => d.valor ?? 0);
          w.chartOpt = {
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: cats, axisLabel: { rotate: 45 } },
            yAxis: { type: 'value' },
            series: [{ type: 'line', data: vals, smooth: true }],
          };
        } else if (r.visualization === 'kpi_card') {
          w.type = 'kpi_card';
        }
        // table y map se manejan directamente en el template

        this.widgets.unshift(w);
        this.loading = false;
      },
      error: (e) => {
        this.loading = false;
        this.snack.open(e?.error?.detail ?? 'Error al procesar', 'Cerrar', { duration: 4000 });
      },
    });
  }

  sugerencia(s: string): void {
    this.queryForm.patchValue({ texto: s });
    this.enviar();
  }

  removeWidget(id: number): void {
    this.widgets = this.widgets.filter(w => w.id !== id);
  }
}
