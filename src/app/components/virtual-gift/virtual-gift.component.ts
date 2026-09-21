import { ChangeDetectionStrategy, Component, OnInit, computed, signal } from '@angular/core';

type Stage = 'idle' | 'box' | 'glow' | 'open' | 'letter';
type FlowerKind = 'peony' | 'hydrangea';

interface Particle { id: number; x: number; y: number; size: number; delay: number; duration: number; }
interface Flower { id: number; kind: FlowerKind; x: number; scale: number; tilt: number; delay: number; tone: number; }

@Component({
  selector: 'app-virtual-gift',
  standalone: true,
  templateUrl: './virtual-gift.component.html',
  styleUrls: ['./virtual-gift.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VirtualGiftComponent implements OnInit {
  readonly stage = signal<Stage>('idle');
  readonly menuOpen = signal(false);
  readonly activeFlower = signal<number | null>(null);
  readonly isMobile = signal(true);
  readonly stars = signal<Particle[]>([]);
  readonly fireflies = signal<Particle[]>([]);
  readonly sparks = signal<Particle[]>([]);
  readonly flowers = signal<Flower[]>([]);
  readonly modalOpen = computed(() => this.stage() === 'letter');

  readonly message = [
    '¿Sabes? Hice esto porque quería darte un detalle. Hoy todos andan con sus flores amarillas y no quiero que seas espectadora. Como no podemos vernos, te hice esto. No sé si te guste, pero lo hice con mucho cariño para ti.',
    'Quiero llenarte de detalles, y este es uno de ellos. Si sigues a mi lado, te acostumbrarás a recibirlos. Quiero hacer las cosas bien contigo, pero no depende solo de mí: depende de los dos. Tenemos que tener la responsabilidad y la madurez para que esta relación funcione.',
    'Como te decía, debemos ir conociéndonos, porque nada funciona de un día para otro. Todo lo bueno sabe esperar. No quiero cometer los errores que he hecho antes contigo. En verdad, me gustaría que todo fuera contigo, pero no depende solo de mí ni de ti; depende de los dos y del tiempo.'
  ];

  ngOnInit(): void {
    const mobile = typeof window === 'undefined' || window.matchMedia('(max-width: 767px)').matches;
    this.isMobile.set(mobile);
    this.stars.set(this.makeParticles(mobile ? 40 : 90, 3, 10, 3, 9));
    this.fireflies.set(this.makeParticles(mobile ? 6 : 15, 4, 9, 4, 8, 48));
    const count = mobile ? 6 : 12;
    this.flowers.set(Array.from({ length: count }, (_, id) => ({
      id, kind: id % 2 ? 'hydrangea' : 'peony',
      x: count === 1 ? 50 : 3 + (id * 94) / (count - 1),
      scale: .7 + ((id * 17) % 45) / 100, tilt: -9 + ((id * 13) % 18),
      delay: -(id % 5) * .65, tone: id % 3
    })));
  }

  showBox(): void {
    if (this.stage() !== 'idle') return;
    this.stage.set('box');
  }

  touchFlower(id: number): void {
    this.activeFlower.set(id);
    if (this.stage() === 'idle') this.showBox();
    window.setTimeout(() => this.activeFlower.set(null), 650);
  }

  openGift(): void {
    if (this.stage() !== 'box') return;
    this.stage.set('glow');
    this.sparks.set(this.makeParticles(this.isMobile() ? 16 : 28, 4, 11, 1.2, 2.4, 40));
    window.setTimeout(() => this.stage.set('open'), 480);
    window.setTimeout(() => this.stage.set('letter'), 1050);
    this.playChime();
  }

  closeLetter(): void {
    this.stage.set('idle');
    this.sparks.set([]);
  }

  toggleMenu(): void { this.menuOpen.update(open => !open); }

  private makeParticles(count: number, min: number, max: number, minDuration: number, maxDuration: number, minY = 4): Particle[] {
    return Array.from({ length: count }, (_, id) => ({
      id, x: Math.random() * 100, y: minY + Math.random() * (92 - minY),
      size: min + Math.random() * (max - min), delay: -(Math.random() * maxDuration),
      duration: minDuration + Math.random() * (maxDuration - minDuration)
    }));
  }

  private playChime(): void {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      [659.25, 783.99, 1046.5].forEach((frequency, index) => {
        const oscillator = ctx.createOscillator(), gain = ctx.createGain(), start = ctx.currentTime + index * .11;
        oscillator.type = 'sine'; oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(.0001, start); gain.gain.exponentialRampToValueAtTime(.08, start + .03); gain.gain.exponentialRampToValueAtTime(.0001, start + 1.1);
        oscillator.connect(gain); gain.connect(ctx.destination); oscillator.start(start); oscillator.stop(start + 1.15);
      });
    } catch { /* Audio is optional. */ }
  }
}
