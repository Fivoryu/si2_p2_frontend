import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { UiFormField, UiInput, UiSelect, type UiSelectOption } from '../../shared/ui';

interface Rol {
  id: string;
  tenant_id: string | null;
  nombre: string;
  descripcion: string | null;
  es_base: boolean;
  base_rol: string | null;
  activo: boolean;
}

interface PermisoEntidad {
  entidad: string;
  puede_crear: boolean;
  puede_leer: boolean;
  puede_actualizar: boolean;
  puede_eliminar: boolean;
}

interface PermisoColumna {
  entidad: string;
  columna: string;
  puede_ver: boolean;
  puede_editar: boolean;
}

interface UsuarioConRol {
  id: string;
  nombre: string;
  email: string;
}

interface RolDetalle extends Rol {
  permisos_entidad: PermisoEntidad[];
  permisos_columna: PermisoColumna[];
  usuarios: UsuarioConRol[];
}

interface Usuario {
  id: string;
  nombre: string;
  email: string;
}

const ALL_ENTITIES = [
  'incidente', 'asignacion', 'cotizacion', 'pago',
  'vehiculo', 'taller', 'tecnico', 'notificacion',
  'usuario', 'especialidad_taller', 'tarifa',
  'rol', 'rol_permiso_entidad', 'rol_permiso_columna', 'usuario_rol',
];

const ENTITY_COLUMNS: Record<string, string[]> = {
  incidente: ['descripcion', 'latitud', 'longitud', 'direccion', 'prioridad', 'estado', 'tipo_incidente_id', 'resumen_ia'],
  usuario: ['nombre', 'email', 'telefono', 'rol', 'email_verificado'],
  vehiculo: ['placa', 'marca', 'modelo', 'anio', 'color', 'tipo_combustible'],
  taller: ['nombre', 'direccion', 'telefono', 'calificacion', 'latitud', 'longitud'],
  tecnico: ['nombre', 'telefono', 'especialidad'],
  asignacion: ['estado', 'asignacion_automatica'],
  cotizacion: ['monto', 'tiempo_estimado_min', 'comentario_taller', 'precio_sugerido'],
  pago: ['monto', 'metodo', 'estado'],
  notificacion: ['titulo', 'mensaje', 'canal', 'leida'],
};

function buildFullEntidades(existentes: PermisoEntidad[]): PermisoEntidad[] {
  const map = new Map(existentes.map((p) => [p.entidad, p]));
  return ALL_ENTITIES.map((e) => map.get(e) ?? {
    entidad: e, puede_crear: false, puede_leer: false, puede_actualizar: false, puede_eliminar: false,
  });
}

function buildFullColumnas(existentes: PermisoColumna[]): PermisoColumna[] {
  const map = new Map(existentes.map((p) => [`${p.entidad}.${p.columna}`, p]));
  const result: PermisoColumna[] = [];
  for (const [entidad, cols] of Object.entries(ENTITY_COLUMNS)) {
    for (const col of cols) {
      const existing = map.get(`${entidad}.${col}`);
      result.push(existing ?? { entidad, columna: col, puede_ver: true, puede_editar: false });
    }
  }
  return result;
}

@Component({
  selector: 'app-roles',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTableModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatTabsModule,
    UiFormField,
    UiInput,
    UiSelect,
  ],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.scss',
})
export class RolesComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  loading = signal(true);
  roles = signal<Rol[]>([]);
  selectedRole = signal<RolDetalle | null>(null);
  loadingDetail = signal(false);
  saving = signal(false);

  usuarios = signal<Usuario[]>([]);

  displayedColumns = ['nombre', 'descripcion', 'base_rol', 'activo', 'acciones'];
  permColumns = ['entidad', 'crear', 'leer', 'actualizar', 'eliminar'];
  permColumnHeaders = ['entidad', 'columna', 'ver', 'editar'];
  userColumns = ['nombre', 'email', 'acciones'];

  showCreateForm = signal(false);
  showEditForm = signal(false);

  assignForm = this.fb.nonNullable.group({
    usuario_id: [''],
  });

  createForm = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    descripcion: [''],
  });

  editForm = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    descripcion: [''],
    activo: [true],
  });

  ngOnInit(): void {
    this.loadRoles();
    this.loadUsuarios();
  }

  loadRoles(): void {
    this.loading.set(true);
    this.api.get<Rol[]>('/roles').subscribe({
      next: (r) => {
        this.roles.set(Array.isArray(r) ? r : []);
        this.loading.set(false);
      },
      error: (e: any) => {
        this.loading.set(false);
        this.snack.open(e?.error?.detail ?? 'Error al cargar roles', 'Cerrar', { duration: 4000 });
      },
    });
  }

  loadUsuarios(): void {
    this.api.get<Usuario[]>('/usuarios').subscribe({
      next: (r) => this.usuarios.set(Array.isArray(r) ? r : []),
      error: () => {},
    });
  }

  selectRole(rol: Rol): void {
    this.loadingDetail.set(true);
    this.selectedRole.set(null);
    this.showEditForm.set(false);
    this.api.get<RolDetalle>(`/roles/${rol.id}`).subscribe({
      next: (r) => {
        this.selectedRole.set({
          ...r,
          permisos_entidad: buildFullEntidades(r.permisos_entidad ?? []),
          permisos_columna: buildFullColumnas(r.permisos_columna ?? []),
        });
        this.loadingDetail.set(false);
      },
      error: (e: any) => {
        this.loadingDetail.set(false);
        this.snack.open(e?.error?.detail ?? 'Error al cargar detalle', 'Cerrar', { duration: 4000 });
      },
    });
  }

  createRole(): void {
    if (this.createForm.invalid) return;
    this.saving.set(true);
    const v = this.createForm.getRawValue();
    this.api.post<Rol>('/roles', { nombre: v.nombre, descripcion: v.descripcion || null }).subscribe({
      next: () => {
        this.snack.open('Rol creado', 'Cerrar', { duration: 3000 });
        this.showCreateForm.set(false);
        this.createForm.reset();
        this.loadRoles();
        this.saving.set(false);
      },
      error: (e: any) => {
        this.saving.set(false);
        this.snack.open(e?.error?.detail ?? 'Error al crear rol', 'Cerrar', { duration: 4000 });
      },
    });
  }

  startEdit(): void {
    const rol = this.selectedRole();
    if (!rol) return;
    this.editForm.patchValue({
      nombre: rol.nombre,
      descripcion: rol.descripcion ?? '',
      activo: rol.activo,
    });
    this.showEditForm.set(true);
  }

  saveEdit(): void {
    const rol = this.selectedRole();
    if (!rol || this.editForm.invalid) return;
    this.saving.set(true);
    const v = this.editForm.getRawValue();
    this.api.patch<Rol>(`/roles/${rol.id}`, {
      nombre: v.nombre,
      descripcion: v.descripcion || null,
      activo: v.activo,
    }).subscribe({
      next: () => {
        this.snack.open('Rol actualizado', 'Cerrar', { duration: 3000 });
        this.showEditForm.set(false);
        this.loadRoles();
        this.selectRole(rol);
        this.saving.set(false);
      },
      error: (e: any) => {
        this.saving.set(false);
        this.snack.open(e?.error?.detail ?? 'Error al actualizar rol', 'Cerrar', { duration: 4000 });
      },
    });
  }

  deleteRole(rol: Rol): void {
    if (rol.es_base) {
      this.snack.open('No se puede eliminar un rol base', 'Cerrar', { duration: 4000 });
      return;
    }
    if (!confirm(`Eliminar rol "${rol.nombre}"?`)) return;
    this.api.delete(`/roles/${rol.id}`).subscribe({
      next: () => {
        this.snack.open('Rol eliminado', 'Cerrar', { duration: 3000 });
        if (this.selectedRole()?.id === rol.id) this.selectedRole.set(null);
        this.loadRoles();
      },
      error: (e: any) => {
        this.snack.open(e?.error?.detail ?? 'Error al eliminar rol', 'Cerrar', { duration: 4000 });
      },
    });
  }

  togglePermisoEntidad(rol: RolDetalle, entidad: string, campo: 'crear' | 'leer' | 'actualizar' | 'eliminar'): void {
    const perm = rol.permisos_entidad.find((p) => p.entidad === entidad);
    if (!perm) return;
    const key = `puede_${campo}` as keyof PermisoEntidad;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (perm as any)[key] = !(perm[key] as boolean);
  }

  savePermisosEntidad(rol: RolDetalle): void {
    this.saving.set(true);
    const permisos = rol.permisos_entidad.map((p) => ({
      entidad: p.entidad,
      puede_crear: p.puede_crear,
      puede_leer: p.puede_leer,
      puede_actualizar: p.puede_actualizar,
      puede_eliminar: p.puede_eliminar,
    }));
    this.api.patch(`/roles/${rol.id}/permisos-entidad`, { permisos }).subscribe({
      next: () => {
        this.snack.open('Permisos guardados', 'Cerrar', { duration: 3000 });
        this.saving.set(false);
      },
      error: (e: any) => {
        this.saving.set(false);
        this.snack.open(e?.error?.detail ?? 'Error al guardar permisos', 'Cerrar', { duration: 4000 });
      },
    });
  }

  togglePermisoColumna(rol: RolDetalle, entidad: string, columna: string, campo: 'ver' | 'editar'): void {
    const perm = rol.permisos_columna.find((p) => p.entidad === entidad && p.columna === columna);
    if (!perm) return;
    if (campo === 'ver') {
      perm.puede_ver = !perm.puede_ver;
      if (!perm.puede_ver) perm.puede_editar = false;
    } else {
      perm.puede_editar = !perm.puede_editar;
      if (perm.puede_editar) perm.puede_ver = true;
    }
  }

  savePermisosColumna(rol: RolDetalle): void {
    this.saving.set(true);
    const permisos = rol.permisos_columna.map((p) => ({
      entidad: p.entidad,
      columna: p.columna,
      puede_ver: p.puede_ver,
      puede_editar: p.puede_editar,
    }));
    this.api.patch(`/roles/${rol.id}/permisos-columnas`, { permisos }).subscribe({
      next: () => {
        this.snack.open('Permisos de columna guardados', 'Cerrar', { duration: 3000 });
        this.saving.set(false);
      },
      error: (e: any) => {
        this.saving.set(false);
        this.snack.open(e?.error?.detail ?? 'Error al guardar permisos de columna', 'Cerrar', { duration: 4000 });
      },
    });
  }

  assignRole(usuarioId: string, rolId: string): void {
    this.api.post(`/roles/usuarios/${usuarioId}/roles`, { rol_id: rolId }).subscribe({
      next: () => {
        this.snack.open('Rol asignado', 'Cerrar', { duration: 3000 });
        this.selectRole({ id: rolId } as Rol);
        this.loadUsuarios();
      },
      error: (e: any) => {
        this.snack.open(e?.error?.detail ?? 'Error al asignar rol', 'Cerrar', { duration: 4000 });
      },
    });
  }

  removeRole(usuarioId: string, rolId: string): void {
    if (!confirm('Remover este rol del usuario?')) return;
    this.api.delete(`/roles/usuarios/${usuarioId}/roles/${rolId}`).subscribe({
      next: () => {
        this.snack.open('Rol removido', 'Cerrar', { duration: 3000 });
        this.selectRole({ id: rolId } as Rol);
      },
      error: (e: any) => {
        this.snack.open(e?.error?.detail ?? 'Error al remover rol', 'Cerrar', { duration: 4000 });
      },
    });
  }

  usuarioOptions(): UiSelectOption[] {
    const asignados = new Set(this.selectedRole()?.usuarios.map((u) => u.id) ?? []);
    return this.usuarios()
      .filter((u) => !asignados.has(u.id))
      .map((u) => ({ value: u.id, label: `${u.nombre} (${u.email})` }));
  }

  isBaseRole(rol: Rol): boolean {
    return rol.es_base;
  }
}
