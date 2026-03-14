import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from './core/services/game.service';
import { SetupComponent } from './features/setup/setup.component';
import { BoardComponent } from './features/board/board.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, SetupComponent, BoardComponent],
  template: `
    @if ((game.state$ | async)?.phase === 'setup') {
      <app-setup (startGame)="onStartGame($event)" />
    } @else {
      <app-board />
    }
  `,
})
export class App {
  constructor(public game: GameService) {}
  onStartGame(configs: any[]): void {
    this.game.startGame(configs);
  }
}
