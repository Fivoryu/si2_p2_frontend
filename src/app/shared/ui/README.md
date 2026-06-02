# UI Kit — Emergencias Web

Design system inspirado en [Car Repair Garage Dashboard (Figma Community)](https://www.figma.com/community/file/1378350587745498522): acento naranja, panel oscuro, tarjetas claras.

## Componentes

| Selector | Uso |
|----------|-----|
| `ui-button` | Variantes: primary, secondary, outline, ghost, danger · tamaños sm/md/lg |
| `ui-label` | Etiqueta con `required` y `hint` |
| `ui-form-field` | Wrapper con label, errores (Reactive Forms) y helper |
| `ui-input` | Texto, email, password, number… (CVA) |
| `ui-select` | Lista desplegable con `options` |
| `ui-textarea` | Texto multilínea |
| `ui-checkbox` | Booleano accesible |
| `ui-calendar` | Selector de fecha con panel |

## Tokens

Variables CSS en `src/styles/_design-tokens.scss`.

## Demo

`/design-system` — catálogo interactivo y formulario de ejemplo.

## Import

```typescript
import { UiButton, UiFormField, UiInput } from '../../shared/ui';
```

Formularios: **Reactive Forms** + `formControlName` (Angular 18). Los controles implementan `ControlValueAccessor`.
