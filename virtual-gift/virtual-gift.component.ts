import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Petal {
  id: number;
  left: number; // % horizontal position
  delay: number; // animation delay in seconds
  duration: number; // fall duration in seconds
  size: number; // width in pixels
  rotation: number; // initial tilt
  swayDuration: number; // sway oscillation period in seconds
  opacity: number;
  type: 'peony' | 'hydrangea';
}

export interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
}

@Component({
  selector: 'app-virtual-gift',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './virtual-gift.component.html',
  styleUrls: ['./virtual-gift.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VirtualGiftComponent implements OnInit {
  isOpened = false;
  petals: Petal[] = [];
  burstPetals: Petal[] = [];
  sparkles: Sparkle[] = [];

  readonly totalBackgroundPetals = 35;
  readonly totalBurstPetals = 20;

  ngOnInit(): void {
    this.generateBackgroundPetals();
    this.generateSparkles();
  }

  /**
   * Alterna o activa la apertura de la caja de regalo
   */
  openGift(): void {
    if (!this.isOpened) {
      this.isOpened = true;
      this.generateBurstPetals();
      this.playOpeningChime();
    }
  }

  /**
   * Reinicia la animación para volver a cerrar la caja
   */
  resetGift(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isOpened = false;
    this.burstPetals = [];
  }

  /**
   * Genera los pétalos de fondo con propiedades aleatorias para un movimiento natural
   */
  private generateBackgroundPetals(): void {
    const list: Petal[] = [];
    for (let i = 0; i < this.totalBackgroundPetals; i++) {
      list.push({
        id: i,
        left: Math.random() * 98, // %
        delay: -(Math.random() * 12), // desfase negativo para que ya estén cayendo al cargar
        duration: 8 + Math.random() * 7, // 8s a 15s de caída suave
        size: 14 + Math.random() * 16, // 14px a 30px
        rotation: Math.floor(Math.random() * 360),
        swayDuration: 3 + Math.random() * 3, // 3s a 6s
        opacity: 0.5 + Math.random() * 0.45,
        type: i % 3 === 0 ? 'hydrangea' : 'peony'
      });
    }
    this.petals = list;
  }

  /**
   * Genera pétalos que brotan explosivamente desde la caja al abrirse
   */
  private generateBurstPetals(): void {
    const burst: Petal[] = [];
    for (let i = 0; i < this.totalBurstPetals; i++) {
      burst.push({
        id: 1000 + i,
        left: 40 + (Math.random() * 20 - 10), // centrado alrededor de la caja
        delay: 0.2 + Math.random() * 0.6,
        duration: 5 + Math.random() * 4,
        size: 16 + Math.random() * 18,
        rotation: Math.floor(Math.random() * 360),
        swayDuration: 2.5 + Math.random() * 2,
        opacity: 0.85 + Math.random() * 0.15,
        type: i % 2 === 0 ? 'peony' : 'hydrangea'
      });
    }
    this.burstPetals = burst;
  }

  /**
   * Genera destellos luminosos mágicos alrededor de la caja
   */
  private generateSparkles(): void {
    const items: Sparkle[] = [];
    for (let i = 0; i < 12; i++) {
      items.push({
        id: i,
        x: 10 + Math.random() * 80,
        y: 10 + Math.random() * 80,
        size: 8 + Math.random() * 16,
        delay: Math.random() * 3
      });
    }
    this.sparkles = items;
  }

  /**
   * Efecto sonoro sutil y agradable sintetizado con Web Audio API (sin dependencias de archivos externos)
   */
  private playOpeningChime(): void {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      
      const ctx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // Do5, Mi5, Sol5, Do6, Mi6 (acorde brillante)

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.value = freq;

        const startTime = ctx.currentTime + idx * 0.12;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.12, startTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 1.3);
      });
    } catch {
      // Ignorar silenciosamente si el navegador bloquea audio sin interacción directa
    }
  }

  trackByPetalId(_index: number, item: Petal): number {
    return item.id;
  }
}
