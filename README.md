# Componente VirtualGiftComponent (Regalo Virtual - Flores Amarillas)

Este componente standalone en Angular proporciona una experiencia inmersiva e interactiva de 'Regalo Virtual'. Al hacer clic sobre una caja de regalo con diseño 3D, se ejecutan animaciones CSS fluidas que retiran la tapa, liberan un resplandor dorado y revelan un ramo abundante compuesto por peonías amarillas de pétalos voluminosos, hortensias en racimos detallados y hojas botánicas verdes, todo acompañado de una suave lluvia de pétalos dorados en el fondo.

## Estructura de Archivos

- [virtual-gift.component.ts](file:///home/fares/Escritorio/FloresDaniela/src/app/components/virtual-gift/virtual-gift.component.ts): Lógica del componente standalone, generación estocástica de pétalos de fondo y ráfaga, y síntesis de audio armónico sutil con Web Audio API.
- [virtual-gift.component.html](file:///home/fares/Escritorio/FloresDaniela/src/app/components/virtual-gift/virtual-gift.component.html): Estructura visual con SVG puros inline (sin dependencias externas de imágenes) para peonías, hortensias, follaje verde y la caja de regalo.
- [virtual-gift.component.scss](file:///home/fares/Escritorio/FloresDaniela/src/app/components/virtual-gift/virtual-gift.component.scss): Animaciones complejas (`@keyframes`), transformaciones 3D, `animation-delay` escalonado para la eclosión de cada flor y la lluvia flotante de pétalos.

## Cómo Utilizar en tu Aplicación

1. En cualquier componente padre o ruta:
```typescript
import { Component } from '@angular/core';
import { VirtualGiftComponent } from './components/virtual-gift/virtual-gift.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [VirtualGiftComponent],
  template: `<app-virtual-gift></app-virtual-gift>`
})
export class AppComponent {}
```
