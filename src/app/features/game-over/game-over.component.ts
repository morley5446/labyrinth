import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Player } from '../../core/models';

@Component({
  selector: 'app-game-over',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center bg-forest-dark">
      <div class="text-center p-12 bg-wood-dark rounded-2xl border-2 border-gold shadow-2xl">
        <div class="text-8xl mb-6">🏆</div>
        <h1 class="font-fairy text-5xl text-gold mb-4">{{ winner.name }} gewinnt!</h1>
        <p class="text-gold-light/60 text-lg mb-8">
          {{ winner.collectedCards.length }} Schätze gesammelt
        </p>
        <button (click)="newGame.emit()"
                class="px-10 py-4 bg-gold text-forest-dark font-fairy text-xl rounded-xl
                       hover:bg-gold-light transition-all hover:scale-105">
          Neues Abenteuer
        </button>
      </div>
    </div>
  `,
})
export class GameOverComponent {
  @Input() winner!: Player;
  @Output() newGame = new EventEmitter<void>();
}
