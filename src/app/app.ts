import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from './core/services/game.service';
import { SetupComponent, SetupResult } from './features/setup/setup.component';
import { BoardComponent } from './features/board/board.component';
import { GameOverComponent } from './features/game-over/game-over.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, SetupComponent, BoardComponent, GameOverComponent],
  template: `
    @switch ((game.state$ | async)?.phase) {
      @case ('setup') {
        <app-setup (startGame)="onStart($event)" />
      }
      @case ('game-over') {
        @if ((game.state$ | async)?.winner; as winner) {
          <app-game-over [winner]="winner" (newGame)="game.resetGame()" />
        }
      }
      @default {
        <app-board />
      }
    }
  `,
})
export class App {
  constructor(public game: GameService) {}

  onStart(result: SetupResult): void {
    this.game.startGame(result.players, result.cardsPerPlayer);
  }
}
