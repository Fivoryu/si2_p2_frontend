import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../core/api.service';
import { ESTADO_LABELS, nextStatesFor } from '../../core/incident-states';

export interface StatusDialogData {
  id: string;
  estado: string;
}

@Component({
  selector: 'app-status-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './status-dialog.component.html',
  styleUrl: './status-dialog.component.scss',
})
export class StatusDialogComponent {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private dialogRef = inject(MatDialogRef<StatusDialogComponent>);
  data = inject<StatusDialogData>(MAT_DIALOG_DATA);

  nextOptions = nextStatesFor(this.data.estado).map((s) => ({
    value: s,
    label: ESTADO_LABELS[s] ?? s,
  }));

  form = this.fb.nonNullable.group({
    estado: ['', Validators.required],
    comentario: [''],
  });

  saving = false;

  confirm(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const { estado, comentario } = this.form.getRawValue();
    this.api
      .patch(`/incidentes/${this.data.id}/estado`, {
        estado,
        comentario: comentario || undefined,
      })
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: () => {
          this.saving = false;
        },
      });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
