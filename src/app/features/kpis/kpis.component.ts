import { Component, OnInit, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NgxEchartsDirective } from 'ngx-echarts';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
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
  total_incidentes?: number;
  total_finalizados?: number;
  total_cancelados?: number;
  total_no_atendidos?: number;
  prom_min_asignacion?: number;
  prom_min_llegada?: number;
  prom_min_respuesta_taller?: number;
  prom_min_total?: number;
  pct_cancelacion?: number;
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
  calificacion?: number;
  servicios_aceptados: number;
  servicios_rechazados?: number;
  prom_min_respuesta?: number;
  prom_min_finalizacion?: number;
}

interface KpiComision {
  taller_nombre: string;
  total_pagos: number;
  total_cobrado: number;
  total_comision_plataforma: number;
  total_neto_taller: number;
}

interface KpiTallerRanking {
  taller_nombre: string;
  rating_taller: number;
  aceptadas: number;
  rechazadas: number;
  total_asignaciones: number;
  tasa_rechazo: number;
  tasa_aceptacion: number;
  prom_llegada_min?: number;
  servicios_finalizados: number;
  rating_servicio?: number;
}

interface KpiTecnicoRanking {
  tecnico_nombre: string;
  taller_id?: string;
  asignaciones_aceptadas: number;
  servicios_finalizados: number;
  prom_llegada_min?: number;
}

interface KpiDemandaHora {
  hora: string;
  total_incidentes: number;
  prom_asignacion_min?: number;
}

interface KpiZona {
  zona_lat: number;
  zona_lng: number;
  total_incidentes: number;
}

interface KpiDemandaZona {
  zona_lat: number;
  zona_lng: number;
  fecha: string;
  total_incidentes: number;
}

interface KpiPrecioTipo {
  tipo_nombre: string;
  precio_promedio: number;
  precio_min?: number;
  precio_max?: number;
  total_pagos: number;
}

interface KpiPrecioCalidad {
  taller_nombre: string;
  precio_promedio: number;
  rating_servicio: number;
  servicios_pagados: number;
  total_calificaciones: number;
  relacion_precio_calidad?: number;
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
  private http = inject(HttpClient);
  auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  resumen?: KpiResumen;
  talleres: KpiTaller[] = [];
  comisiones: KpiComision[] = [];
  tallerRanking: KpiTallerRanking[] = [];
  tecnicoRanking: KpiTecnicoRanking[] = [];
  zonas: KpiZona[] = [];
  demandaZona: KpiDemandaZona[] = [];
  precioTipo: KpiPrecioTipo[] = [];
  precioCalidad: KpiPrecioCalidad[] = [];

  porTipoOpt?: EChartsOption;
  slaOpt?: EChartsOption;
  demandaHoraOpt?: EChartsOption;
  precioTipoOpt?: EChartsOption;

  tenants: TenantOption[] = [];
  tenantSel?: string;
  loading = true;

  ingresosPlataforma = 0;

  isAdm = this.auth.role === 'ADMIN_PLATAFORMA';

  filterForm = this.fb.group({
    desde: [null as Date | null],
    hasta: [null as Date | null],
  });

  tallerColumns = ['taller_nombre', 'calificacion', 'servicios_aceptados', 'servicios_rechazados', 'prom_min_respuesta', 'prom_min_finalizacion'];
  comisionColumns = ['taller_nombre', 'total_pagos', 'total_cobrado', 'total_comision_plataforma', 'total_neto_taller'];
  tallerRankingColumns = ['taller_nombre', 'rating_taller', 'aceptadas', 'rechazadas', 'tasa_rechazo', 'tasa_aceptacion', 'prom_llegada_min', 'servicios_finalizados', 'rating_servicio'];
  tecnicoColumns = ['tecnico_nombre', 'asignaciones_aceptadas', 'servicios_finalizados', 'prom_llegada_min'];
  zonaColumns = ['zona_lat', 'zona_lng', 'total_incidentes'];
  demandaZonaColumns = ['zona_lat', 'zona_lng', 'fecha', 'total_incidentes'];
  precioCalidadColumns = ['taller_nombre', 'precio_promedio', 'rating_servicio', 'relacion_precio_calidad', 'servicios_pagados'];

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

    const safe = <T>(obs$: any) => obs$.pipe(catchError(() => of([] as T[])));

    forkJoin({
      resumen:       safe<KpiResumen[]>(this.api.get<KpiResumen[]>(`/kpis/resumen${q}`)),
      porTipo:       safe<KpiPorTipo[]>(this.api.get<KpiPorTipo[]>(`/kpis/por-tipo${q}`)),
      sla:           safe<KpiSla[]>(this.api.get<KpiSla[]>(`/kpis/sla${q}`)),
      talleres:      safe<KpiTaller[]>(this.api.get<KpiTaller[]>(`/kpis/talleres${q}`)),
      comisiones:    safe<KpiComision[]>(this.api.get<KpiComision[]>(`/kpis/comisiones${q}`)),
      tallerRanking: safe<KpiTallerRanking[]>(this.api.get<KpiTallerRanking[]>(`/kpis/taller-ranking${q}`)),
      tecnicoRanking: safe<KpiTecnicoRanking[]>(this.api.get<KpiTecnicoRanking[]>(`/kpis/tecnico-ranking${q}`)),
      demandaHora:   safe<KpiDemandaHora[]>(this.api.get<KpiDemandaHora[]>(`/kpis/demanda-hora${q}`)),
      zonas:         safe<KpiZona[]>(this.api.get<KpiZona[]>(`/kpis/zonas${q}`)),
      demandaZona:   safe<KpiDemandaZona[]>(this.api.get<KpiDemandaZona[]>(`/kpis/demanda-zona${q}`)),
      precioTipo:    safe<KpiPrecioTipo[]>(this.api.get<KpiPrecioTipo[]>(`/kpis/precio-tipo${q}`)),
      precioCalidad: safe<KpiPrecioCalidad[]>(this.api.get<KpiPrecioCalidad[]>(`/kpis/precio-calidad${q}`)),
    }).subscribe({
      next: (r) => {
        this.resumen = Array.isArray(r.resumen) ? r.resumen[0] : (r.resumen as unknown as KpiResumen);

        const porTipoArr = Array.isArray(r.porTipo) ? r.porTipo : [];
        this.porTipoOpt = porTipoArr.length
          ? this.buildBarChart(porTipoArr.map((x) => x.tipo_nombre), porTipoArr.map((x) => x.total), 'Incidentes')
          : undefined;

        const slaArr = Array.isArray(r.sla) ? r.sla : [];
        this.slaOpt = slaArr.length ? {
          tooltip: {},
          xAxis: { type: 'category', data: slaArr.map((x) => x.tipo_nombre) },
          yAxis: { type: 'value', max: 100 },
          series: [{ type: 'bar', name: '% cumplimiento', data: slaArr.map((x) => x.pct_cumplimiento) }],
        } : undefined;

        const demandaArr = Array.isArray(r.demandaHora) ? r.demandaHora : [];
        this.demandaHoraOpt = demandaArr.length ? {
          tooltip: { trigger: 'axis' },
          xAxis: { type: 'category', data: demandaArr.map((x) => this.fmtHora(x.hora)), axisLabel: { rotate: 45 } },
          yAxis: { type: 'value' },
          series: [{ type: 'line', name: 'Incidentes', data: demandaArr.map((x) => x.total_incidentes), smooth: true }],
        } : undefined;

        const precioTipoArr = Array.isArray(r.precioTipo) ? r.precioTipo : [];
        this.precioTipo = precioTipoArr;
        this.precioTipoOpt = precioTipoArr.length
          ? this.buildBarChart(precioTipoArr.map((x) => x.tipo_nombre), precioTipoArr.map((x) => x.precio_promedio), 'Precio prom. (BOB)')
          : undefined;

        this.talleres = Array.isArray(r.talleres) ? r.talleres : [];
        this.comisiones = Array.isArray(r.comisiones) ? r.comisiones : [];
        this.tallerRanking = Array.isArray(r.tallerRanking) ? r.tallerRanking : [];
        this.tecnicoRanking = Array.isArray(r.tecnicoRanking) ? r.tecnicoRanking : [];
        this.zonas = Array.isArray(r.zonas) ? r.zonas : [];
        this.demandaZona = Array.isArray(r.demandaZona) ? r.demandaZona : [];
        this.precioCalidad = Array.isArray(r.precioCalidad) ? r.precioCalidad : [];

        this.ingresosPlataforma = this.comisiones.reduce((sum, c) => sum + (c.total_comision_plataforma || 0), 0);

        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snack.open('Error al cargar KPIs', 'Cerrar', { duration: 4000 });
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
    let params = new HttpParams();
    if (this.isAdm && this.tenantSel) params = params.set('tenant_id', this.tenantSel);
    const { desde, hasta } = this.filterForm.value;
    if (desde) params = params.set('desde', desde.toISOString().slice(0, 10));
    if (hasta) params = params.set('hasta', hasta.toISOString().slice(0, 10));
    this.http
      .get(`${environment.apiUrl}/kpis/export`, { params, responseType: 'text' })
      .subscribe({
        next: (csv) => {
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `kpis-${new Date().toISOString().slice(0, 10)}.csv`;
          a.click();
          URL.revokeObjectURL(url);
        },
        error: () =>
          this.snack.open('Error al exportar CSV', 'Cerrar', { duration: 4000 }),
      });
  }

  exportPdf(): void {
    window.print();
  }

  private buildBarChart(labels: string[], values: number[], name: string): EChartsOption {
    return {
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: labels },
      yAxis: { type: 'value' },
      series: [{ type: 'bar', name, data: values }],
    };
  }

  private fmtHora(hora: string): string {
    const d = new Date(hora);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:00`;
  }

  pctFmt(v: number): string {
    return (v * 100).toFixed(1) + '%';
  }

  numFmt(v: number | undefined): string {
    if (v == null) return '—';
    return Number(v).toFixed(1);
  }

  moneyFmt(v: number | undefined): string {
    if (v == null) return '—';
    return 'Bs ' + Number(v).toFixed(2);
  }
}
