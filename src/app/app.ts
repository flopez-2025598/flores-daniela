import { ChangeDetectionStrategy, Component } from '@angular/core';
import { VirtualGiftComponent } from './components/virtual-gift/virtual-gift.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [VirtualGiftComponent],
  template: `<app-virtual-gift />`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {}
