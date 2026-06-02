import { NgClass } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { environment } from '../../../environments/environment';
import { ESTADO_LABELS } from '../../core/incident-states';
import {
  StatusDialogComponent,
  StatusDialogData,
} from '../status/status-dialog.component';

export interface IncidenteRow {
  id: string;
  resumen_ia?: string;
  tipo_nombre?: string;
  prioridad?: string;
  estado: string;
  asignacion_id?: string;
  tecnico_id?: string;
  motivo_rechazo?: string;
}

interface PaginatedResponse {
  items: IncidenteRow[];
  total: number;
}

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [
    NgClass,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './requests.component.html',
  styleUrl: './requests.component.scss',
})
export class RequestsComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  incidentes: IncidenteRow[] = [];
  loading = true;
  displayedColumns = ['resumen_ia', 'tipo', 'prioridad', 'estado', 'acciones'];
  private sockets = new Map<string, WebSocket>();
  rejectMotivos = new Map<string, string>();
  private busyIds = new Set<string>();

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api.get<PaginatedResponse>('/incidentes', { estado: 'TALLER_ASIGNADO' }).subscribe({
      next: (r) => {
        this.closeSockets();
        this.incidentes = r.items ?? [];
        this.incidentes.forEach((i) => this.openWs(i.id));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snack.open('Error al cargar solicitudes', 'Cerrar', { duration: 3000 });
      },
    });
  }

  openWs(incidentId: string): void {
    const tenant = this.auth.tenantId;
    const token = this.auth.token;
    if (!tenant || !token) return;
    const url = `${environment.wsUrl}/ws/${tenant}/${incidentId}?token=${token}`;
    const ws = new WebSocket(url);
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'STATUS_CHANGED') {
          this.patchRow(incidentId, msg.data?.estado_nuevo ?? msg.data?.estado);
        }
      } catch {
        /* ignore malformed */
      }
    };
    this.sockets.set(incidentId, ws);
  }

  patchRow(incidentId: string, nuevoEstado: string): void {
    const row = this.incidentes.find((i) => i.id === incidentId);
    if (row) {
      row.estado = nuevoEstado;
      if (nuevoEstado !== 'TALLER_ASIGNADO') {
        this.incidentes = this.incidentes.filter((i) => i.id !== incidentId);
        const s = this.sockets.get(incidentId);
        s?.close();
        this.sockets.delete(incidentId);
      }
    }
  }

  estadoLabel(estado: string): string {
    return ESTADO_LABELS[estado] ?? estado;
  }

  estadoClass(estado: string): string {
    const known = [
      'TALLER_ASIGNADO',
      'EN_CAMINO',
      'EN_ATENCION',
      'FINALIZADO',
      'PAGADO',
      'CANCELADO',
      'NO_ATENDIDO',
    ];
    return known.includes(estado) ? `status-${estado}` : 'status-default';
  }

  aceptar(row: IncidenteRow): void {
    if (!row.asignacion_id) {
      this.snack.open('Sin asignación vinculada', 'Cerrar', { duration: 3000 });
      return;
    }
    if (this.isBusy(row.id)) return;
    this.busyIds.add(row.id);
    this.api
      .post(`/asignaciones/${row.asignacion_id}/aceptar`, {
        tecnico_id: row.tecnico_id,
      })
      .subscribe({
        next: () => {
          this.snack.open('Solicitud aceptada', 'OK', { duration: 2000 });
          this.patchRow(row.id, 'EN_CAMINO');
          this.busyIds.delete(row.id);
        },
        error: (e) => {
          this.busyIds.delete(row.id);
          this.snack.open(e?.error?.detail ?? 'Error al aceptar', 'Cerrar', { duration: 4000 });
        },
      });
  }

  rechazar(row: IncidenteRow): void {
    if (!row.asignacion_id) return;
    if (this.isBusy(row.id)) return;
    const motivo = this.rejectMotivos.get(row.id) ?? 'No disponible';
    this.busyIds.add(row.id);
    this.api
      .post(`/asignaciones/${row.asignacion_id}/rechazar`, { motivo })
      .subscribe({
        next: () => {
          this.snack.open('Solicitud rechazada', 'OK', { duration: 2000 });
          this.incidentes = this.incidentes.filter((i) => i.id !== row.id);
          this.busyIds.delete(row.id);
        },
        error: (e) => {
          this.busyIds.delete(row.id);
          this.snack.open(e?.error?.detail ?? 'Error al rechazar', 'Cerrar', { duration: 4000 });
        },
      });
  }

  setMotivo(id: string, value: string): void {
    this.rejectMotivos.set(id, value);
  }

  openStatus(row: IncidenteRow): void {
    const ref = this.dialog.open(StatusDialogComponent, {
      width: '400px',
      data: { id: row.id, estado: row.estado } as StatusDialogData,
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok) this.load();
    });
  }

  isBusy(incidenteId: string): boolean {
    return this.busyIds.has(incidenteId);
  }

  ngOnDestroy(): void {
    this.closeSockets();
  }

  private closeSockets(): void {
    this.sockets.forEach((s) => s.close());
    this.sockets.clear();
  }
}
