import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NgxEchartsDirective } from 'ngx-echarts';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EChartsOption } from 'echarts';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

interface KpiResumen {
  prom_min_asignacion?: number;
  prom_min_llegada?: number;
  pct_cancelacion?: number;
  total_incidentes?: number;
}

interface KpiPorTipo {
  tipo_nombre: string;
  total: number;
}

interface KpiSla {
  tipo_nombre: string;
  pct_cumplimiento: number;
}

interface KpiTaller {
  taller_nombre: string;
  total_atendidos: number;
  prom_min_respuesta?: number;
}

interface TenantOption {
  id: string;
  nombre: string;
}

@Component({
  selector: 'app-kpis',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgxEchartsDirective,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './kpis.component.html',
  styleUrl: './kpis.component.scss',
})
export class KpisComponent implements OnInit {
  private api = inject(ApiService);
  auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  porTipoOpt?: EChartsOption;
  slaOpt?: EChartsOption;
  resumen?: KpiResumen;
  talleres: KpiTaller[] = [];
  tenants: TenantOption[] = [];
  tenantSel?: string;
  loading = true;

  isAdm = this.auth.role === 'ADMIN_PLATAFORMA';

  filterForm = this.fb.group({
    desde: [null as Date | null],
    hasta: [null as Date | null],
  });

  tallerColumns = ['taller_nombre', 'total_atendidos', 'prom_min_respuesta'];

  ngOnInit(): void {
    if (this.isAdm) {
      this.api.get<{ items: TenantOption[] }>('/tenants').subscribe({
        next: (r) => (this.tenants = r.items ?? []),
        error: () => {},
      });
    }
    this.load();
  }

  private querySuffix(): string {
    const parts: string[] = [];
    if (this.isAdm && this.tenantSel) {
      parts.push(`tenant_id=${this.tenantSel}`);
    }
    const { desde, hasta } = this.filterForm.value;
    if (desde) parts.push(`desde=${desde.toISOString().slice(0, 10)}`);
    if (hasta) parts.push(`hasta=${hasta.toISOString().slice(0, 10)}`);
    return parts.length ? `?${parts.join('&')}` : '';
  }

  load(): void {
    this.loading = true;
    const q = this.querySuffix();
    this.api.get<KpiResumen[]>(`/kpis/resumen${q}`).subscribe({
      next: (r) => {
        this.resumen = Array.isArray(r) ? r[0] : (r as unknown as KpiResumen);
      },
      error: () => {},
    });
    this.api.get<KpiPorTipo[]>(`/kpis/por-tipo${q}`).subscribe({
      next: (r) => {
        const data = Array.isArray(r) ? r : [];
        this.porTipoOpt = {
          tooltip: { trigger: 'axis' },
          xAxis: { type: 'category', data: data.map((x) => x.tipo_nombre) },
          yAxis: { type: 'value' },
          series: [{ type: 'bar', data: data.map((x) => x.total) }],
        };
      },
      error: () => {},
    });
    this.api.get<KpiSla[]>(`/kpis/sla${q}`).subscribe({
      next: (r) => {
        const data = Array.isArray(r) ? r : [];
        this.slaOpt = {
          tooltip: {},
          xAxis: { type: 'category', data: data.map((x) => x.tipo_nombre) },
          yAxis: { type: 'value', max: 100 },
          series: [{ type: 'bar', name: '% cumplimiento', data: data.map((x) => x.pct_cumplimiento) }],
        };
      },
      error: () => {},
    });
    this.api.get<KpiTaller[]>(`/kpis/talleres${q}`).subscribe({
      next: (r) => {
        this.talleres = Array.isArray(r) ? r : [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onTenantChange(id: string): void {
    this.tenantSel = id || undefined;
    this.load();
  }

  refrescar(): void {
    this.api.post('/kpis/refresh', {}).subscribe({
      next: () => {
        this.snack.open('KPIs actualizados', 'OK', { duration: 2000 });
        this.load();
      },
      error: (e) =>
        this.snack.open(e?.error?.detail ?? 'Error al refrescar', 'Cerrar', { duration: 4000 }),
    });
  }

  exportCsv(): void {
    const rows = [
      ['Taller', 'Atendidos', 'Prom. respuesta (min)'],
      ...this.talleres.map((t) => [
        t.taller_nombre,
        String(t.total_atendidos),
        String(t.prom_min_respuesta ?? ''),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kpis-talleres-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
