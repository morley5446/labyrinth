import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from './core/services/game.service';
import { SetupComponent } from './features/setup/setup.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, SetupComponent],
  template: `
    @if ((game.state$ | async)?.phase === 'setup') {
      <app-setup (startGame)="onStartGame($event)" />
    } @else {
      <div class="text-gold p-8 font-fairy text-2xl">Spielfeld wird implementiert...</div>
    }
  `,
})
export class App {
  constructor(public game: GameService) {}
  onStartGame(configs: any[]): void {
    this.game.startGame(configs);
  }
}
