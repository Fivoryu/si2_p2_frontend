import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiButton } from '../../shared/ui';

@Component({
  selector: 'app-signup-success',
  standalone: true,
  imports: [RouterLink, UiButton],
  template: `
    <div class="success-page">
      <div class="success-card">
        <span class="success-icon material-icons">check_circle</span>
        <h2>Pago exitoso</h2>
        <p>Tu cuenta de red de talleres ha sido creada.</p>
        <p>
          Revisa tu correo electrónico para obtener tu
          <strong>contraseña temporal</strong>.
        </p>
        <p class="hint">
          Al iniciar sesión, se te pedirá cambiar la contraseña.
        </p>
        <ui-button routerLink="/login" style="margin-top: 16px">
          Ir a iniciar sesión
        </ui-button>
      </div>
    </div>
  `,
  styles: [
    `
      .success-page {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background: #f5f5f5;
      }
      .success-card {
        background: white;
        border-radius: 12px;
        padding: 40px;
        max-width: 440px;
        text-align: center;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      }
      .success-icon { font-size: 64px; color: #4caf50; }
      h2 { margin: 16px 0 8px; }
      .hint { color: #666; font-size: 14px; margin-top: 8px; }
    `,
  ],
})
export class SignupSuccessComponent {}
