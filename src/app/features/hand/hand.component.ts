import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Player } from '../../core/models';
import { cardFlipAnimation } from '../../core/animations/game.animations';

@Component({
  selector: 'app-hand',
  standalone: true,
  imports: [CommonModule],
  animations: [cardFlipAnimation],
  template: `
    @if (player.cards[0]) {
      <div class="flex flex-col items-center gap-1" [@cardFlip]>
        <span class="text-xs text-gold/60 font-fairy">Nächster Schatz</span>
        <div class="w-16 h-16 bg-wood-dark rounded-lg border border-gold/40 flex items-center justify-center shadow-lg">
          <img [src]="'assets/icons/' + player.cards[0] + '.svg'"
               class="w-10 h-10" style="filter: drop-shadow(0 0 4px #d4a017)" />
        </div>
      </div>
    } @else {
      <div class="text-green-400 text-sm font-fairy text-center">
        Alle Schätze!<br/>Zurück zum Start!
      </div>
    }
  `,
})
export class HandComponent {
  @Input() player!: Player;
}
