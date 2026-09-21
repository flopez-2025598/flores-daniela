import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  OnInit,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';

/** Secuencia completa de la experiencia, de la escena inicial a la carta expandida. */
export type GiftState = 'idle' | 'rising' | 'ready' | 'opening' | 'letter' | 'expanded';

type FlowerKind = 'hydrangea' | 'peonyOpen' | 'peonyBud' | 'leaf';
type FlowerLayer = 'back' | 'front';

interface Star {
  id: number;
  xPct: number;
  yPct: number;
  size: number;
  delay: number;
  duration: number;
}

interface Firefly {
  id: number;
  xPct: number;
  yPct: number;
  size: number;
  delay: number;
  duration: number;
  driftX: number;
  driftY: number;
}

interface Sparkle {
  id: number;
  xPct: number;
  yPct: number;
  size: number;
  delay: number;
  duration: number;
}

interface GardenFlower {
  id: number;
  kind: FlowerKind;
  xPct: number;
  scale: number;
  rotate: number;
  delay: number;
  duration: number;
  tone: 0 | 1 | 2;
  layer: FlowerLayer;
  z: number;
}

/** Duraciones (ms) de cada tramo de la secuencia. Se mantienen en sync con el SCSS. */
const TIMING = {
  rise: 900,
  open: 950,
  letterToExpand: 1500
} as const;

const REDUCED_TIMING = {
  rise: 1,
  open: 1,
  letterToExpand: 1
} as const;

let uid = 0;
const nextId = () => uid++;

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Genera las posiciones de las florecitas de una hortensia en anillos concéntricos
 * (mophead denso), devolviendo [x, y, rotación] dentro de un viewBox 0 0 200 200.
 */
function buildHydrangeaFlorets(): ReadonlyArray<readonly [number, number, number]> {
  const center = 100;
  const rings: Array<{ radius: number; count: number; angleOffset: number }> = [
    { radius: 0, count: 1, angleOffset: 0 },
    { radius: 24, count: 6, angleOffset: 0 },
    { radius: 46, count: 11, angleOffset: 14 },
    { radius: 67, count: 16, angleOffset: 5 }
  ];

  const florets: Array<[number, number, number]> = [];
  for (const ring of rings) {
    if (ring.radius === 0) {
      florets.push([center, center, 0]);
      continue;
    }
    for (let i = 0; i < ring.count; i++) {
      const angleDeg = ring.angleOffset + (360 / ring.count) * i;
      const angleRad = (angleDeg * Math.PI) / 180;
      const x = Math.round((center + ring.radius * Math.cos(angleRad)) * 10) / 10;
      const y = Math.round((center + ring.radius * Math.sin(angleRad)) * 10) / 10;
      florets.push([x, y, Math.round(angleDeg)]);
    }
  }
  return florets;
}

/** Ángulos (deg) igualmente espaciados para un anillo de pétalos de peonía. */
function buildPetalRing(count: number, angleOffset: number): readonly number[] {
  return Array.from({ length: count }, (_, i) => angleOffset + (360 / count) * i);
}

@Component({
  selector: 'app-virtual-gift',
  standalone: true,
  templateUrl: './virtual-gift.component.html',
  styleUrl: './virtual-gift.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-state]': 'state()'
  }
})
export class VirtualGiftComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private pendingTimers: ReturnType<typeof setTimeout>[] = [];
  private audioCtx: AudioContext | null = null;

  // ---------------------------------------------------------------------
  // ESTADO DE LA SECUENCIA
  // ---------------------------------------------------------------------
  readonly state = signal<GiftState>('idle');

  readonly isBoxInteractive = computed(() => this.state() === 'ready');
  readonly isModalOpen = computed(() => this.state() === 'letter' || this.state() === 'expanded');
  readonly isExpanded = computed(() => this.state() === 'expanded');
  readonly isSceneAwake = computed(() => this.state() !== 'idle');
  readonly isOpenPhase = computed(() =>
    this.state() === 'opening' || this.state() === 'letter' || this.state() === 'expanded'
  );

  readonly reducedMotion = signal(false);
  readonly isMobile = signal(true);

  // ---------------------------------------------------------------------
  // PARTÍCULAS (generadas en el .ts, menos cantidad en móvil)
  // ---------------------------------------------------------------------
  readonly stars = signal<Star[]>([]);
  readonly fireflies = signal<Firefly[]>([]);
  readonly sparkles = signal<Sparkle[]>([]);
  readonly gardenFlowers = signal<GardenFlower[]>([]);

  readonly backFlowers = computed(() => this.gardenFlowers().filter((f) => f.layer === 'back'));
  readonly frontFlowers = computed(() => this.gardenFlowers().filter((f) => f.layer === 'front'));

  // ---------------------------------------------------------------------
  // CONTENIDO DE LA CARTA — EDITA AQUÍ EL MENSAJE
  // ---------------------------------------------------------------------
  readonly recipientName = 'Daniela';
  readonly letterTitle = 'Para ti, Daniela';
  readonly letterParagraphs: readonly string[] = [
    '¿Sabes? Hice esto porque quería darte un detalle. Hoy todos andan con sus flores amarillas y no quiero que seas espectadora. Como no podemos vernos, te hice esto. No sé si te guste, pero lo hice con mucho cariño para ti.',
    'Quiero llenarte de detalles, y este es uno de ellos. Si sigues a mi lado, te acostumbrarás a recibirlos. Quiero hacer las cosas bien contigo, pero no depende solo de mí: depende de los dos. Tenemos que tener la responsabilidad y la madurez para que esta relación funcione.',
    'Como te decía, debemos ir conociéndonos, porque nada funciona de un día para otro. Todo lo bueno sabe esperar. No quiero cometer los errores que he hecho antes contigo. En verdad, me gustaría que todo fuera contigo, pero no depende solo de mí ni de ti; depende de los dos y del tiempo.'
  ];
  readonly letterSignature = 'Con mucho cariño, Fares';

  /** Posiciones [x, y, rotación] de las florecitas de 4 pétalos dentro del símbolo #flowerHydrangea. */
  readonly hydrangeaFlorets = buildHydrangeaFlorets();

  /** Anillos de pétalos de la peonía abierta: exterior grande + interior más chico. */
  readonly peonyOuterPetals = buildPetalRing(11, 3);
  readonly peonyInnerPetals = buildPetalRing(9, 20);

  constructor() {
    // Bloquea el scroll del body mientras el modal está abierto.
    effect(() => {
      if (typeof document === 'undefined') return;
      document.body.style.overflow = this.isModalOpen() ? 'hidden' : '';
    });

    this.destroyRef.onDestroy(() => {
      this.pendingTimers.forEach((t) => clearTimeout(t));
      document.body.style.overflow = '';
      this.audioCtx?.close().catch(() => void 0);
    });
  }

  ngOnInit(): void {
    if (typeof window === 'undefined') return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.reducedMotion.set(reduced);

    const mobile = window.matchMedia('(max-width: 767px)').matches;
    this.isMobile.set(mobile);

    this.stars.set(this.makeStars(mobile ? 46 : 90));
    this.fireflies.set(this.makeFireflies(mobile ? 7 : 14));
    this.gardenFlowers.set(this.makeGarden());
  }

  // ---------------------------------------------------------------------
  // INTERACCIÓN
  // ---------------------------------------------------------------------

  /** Toca el botón "Descúbrelas" — hace subir la caja desde el jardín. */
  onDiscover(): void {
    if (this.state() !== 'idle') return;

    this.sparkles.set(this.makeSparkles(this.isMobile() ? 10 : 18));
    this.state.set('rising');

    this.after(this.duration('rise'), () => {
      this.state.set('ready');
      this.sparkles.set([]);
    });
  }

  /** Toca la caja ya subida — abre la tapa y encadena la carta. */
  onOpenBox(): void {
    if (this.state() !== 'ready') return;

    this.playChime();
    this.state.set('opening');

    this.after(this.duration('open'), () => {
      this.state.set('letter');

      this.after(this.duration('letterToExpand'), () => {
        if (this.state() === 'letter') {
          this.state.set('expanded');
        }
      });
    });
  }

  /** Cierra el modal y vuelve todo al estado inicial (transición inversa por CSS). */
  close(): void {
    if (!this.isModalOpen()) return;
    this.state.set('idle');
  }

  onOverlayPointerDown(event: PointerEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }

  // ---------------------------------------------------------------------
  // AUDIO — campanitas suaves solo tras el toque del usuario
  // ---------------------------------------------------------------------
  private playChime(): void {
    if (typeof window === 'undefined') return;
    const AudioCtor = window.AudioContext ?? (window as any).webkitAudioContext;
    if (!AudioCtor) return;

    try {
      this.audioCtx ??= new AudioCtor();
      const ctx = this.audioCtx;
      if (ctx.state === 'suspended') void ctx.resume();

      const notes = [1046.5, 1318.5, 1568.0]; // C6, E6, G6 — arpegio de campanita
      notes.forEach((freq, i) => {
        const start = ctx.currentTime + i * 0.14;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.09, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.9);
        osc.connect(gain).connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 1);
      });
    } catch {
      // Audio no disponible: silenciosamente se ignora, no es esencial.
    }
  }

  // ---------------------------------------------------------------------
  // GENERACIÓN DE PARTÍCULAS Y JARDÍN
  // ---------------------------------------------------------------------
  private makeStars(count: number): Star[] {
    return Array.from({ length: count }, () => ({
      id: nextId(),
      xPct: rand(0, 100),
      yPct: rand(0, 62),
      size: rand(1, 2.6),
      delay: rand(0, 6),
      duration: rand(2.4, 5.5)
    }));
  }

  private makeFireflies(count: number): Firefly[] {
    return Array.from({ length: count }, () => ({
      id: nextId(),
      xPct: rand(4, 96),
      yPct: rand(48, 92),
      size: rand(4, 7),
      delay: rand(0, 6),
      duration: rand(5, 9),
      driftX: rand(-24, 24),
      driftY: rand(-46, -18)
    }));
  }

  private makeSparkles(count: number): Sparkle[] {
    return Array.from({ length: count }, () => ({
      id: nextId(),
      xPct: rand(6, 94),
      yPct: rand(58, 96),
      size: rand(3, 6),
      delay: rand(0, 0.5),
      duration: rand(0.8, 1.6)
    }));
  }

  private makeGarden(): GardenFlower[] {
    // Composición a mano — pocas flores pero GRANDES y muy detalladas, como un
    // ramo fotografiado de cerca: hortensias tupidas abajo, peonías grandes
    // asomando detrás/arriba, y hojas oscuras entre medio. 'front' se dibuja
    // después de la caja en el DOM para que las hortensias tapen su base.
    const layout: Array<[FlowerKind, number, FlowerLayer, number]> = [
      // kind         x%   layer    baseScale
      ['leaf', 0, 'back', 1.3],
      ['hydrangea', 6, 'front', 1.55],
      ['peonyOpen', 18, 'back', 1.55],
      ['hydrangea', 30, 'front', 1.35],
      ['peonyBud', 42, 'back', 0.95],
      ['peonyOpen', 50, 'back', 1.75],
      ['leaf', 58, 'back', 1.15],
      ['hydrangea', 66, 'front', 1.4],
      ['peonyOpen', 80, 'back', 1.6],
      ['hydrangea', 92, 'front', 1.5],
      ['leaf', 98, 'back', 1.35]
    ];

    return layout.map(([kind, xPct, layer, baseScale], i) => ({
      id: nextId(),
      kind,
      xPct,
      layer,
      scale: baseScale * rand(0.94, 1.06),
      rotate: rand(-6, 6),
      delay: rand(0, 2.4),
      duration: rand(4.5, 7.5),
      tone: pick([0, 1, 2] as const),
      z: layer === 'front' ? 20 + i : i
    }));
  }

  /** Id del `<symbol>` SVG y el viewBox que le corresponde a cada tipo de elemento del jardín. */
  symbolId(kind: FlowerKind): string {
    switch (kind) {
      case 'hydrangea': return '#flowerHydrangea';
      case 'peonyOpen': return '#flowerPeonyOpen';
      case 'peonyBud': return '#flowerPeonyBud';
      case 'leaf': return '#leafBlade';
    }
  }

  viewBoxFor(kind: FlowerKind): string {
    return kind === 'leaf' ? '0 0 120 200' : '0 0 200 200';
  }

  // ---------------------------------------------------------------------
  // UTILIDADES
  // ---------------------------------------------------------------------
  private duration(key: keyof typeof TIMING): number {
    return this.reducedMotion() ? REDUCED_TIMING[key] : TIMING[key];
  }

  private after(ms: number, fn: () => void): void {
    const id = setTimeout(fn, ms);
    this.pendingTimers.push(id);
  }
}
