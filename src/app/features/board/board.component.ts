import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { GameService } from '../../core/services/game.service';
import { BoardService } from '../../core/services/board.service';
import { AiService } from '../../core/services/ai.service';
import { TileComponent } from './tile/tile.component';
import { ShiftArrowsComponent } from './shift-arrows/shift-arrows.component';
import { PlayerPawnComponent } from './player-pawn/player-pawn.component';
import { GameState, Position, ShiftPosition } from '../../core/models';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, TileComponent, ShiftArrowsComponent, PlayerPawnComponent],
  templateUrl: './board.component.html',
})
export class BoardComponent implements OnInit, OnDestroy {
  reachable: Position[] = [];
  private sub?: Subscription;

  constructor(
    public game: GameService,
    private boardSvc: BoardService,
    private ai: AiService
  ) {}

  ngOnInit(): void {
    this.sub = this.game.state$.subscribe(state => {
      if (state.phase === 'move') {
        const player = state.players[state.currentPlayerIndex];
        this.reachable = this.boardSvc.getReachablePositions(state.board, player.position);
        if (player.isAI) this.scheduleAiMove(state);
      } else if (state.phase === 'shift') {
        this.reachable = [];
        const player = state.players[state.currentPlayerIndex];
        if (player.isAI) this.scheduleAiShift(state);
      } else {
        this.reachable = [];
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  isReachable(row: number, col: number): boolean {
    return this.reachable.some(p => p.row === row && p.col === col);
  }

  playersAt(state: GameState, row: number, col: number) {
    return state.players.filter(p => p.position.row === row && p.position.col === col);
  }

  onShift(shift: ShiftPosition): void { this.game.performShift(shift); }

  onTileClick(state: GameState, row: number, col: number): void {
    if (state.phase === 'move' && this.isReachable(row, col)) {
      this.game.performMove({ row, col });
    }
  }

  private aiDelay(state: GameState): number {
    return state.settings.aiSpeed === 'slow' ? 1500 : state.settings.aiSpeed === 'fast' ? 400 : 800;
  }

  private scheduleAiShift(state: GameState): void {
    setTimeout(() => {
      const move = this.ai.calculateMove(state);
      this.game.performShift(move.shift);
    }, this.aiDelay(state));
  }

  private scheduleAiMove(state: GameState): void {
    setTimeout(() => {
      const move = this.ai.calculateMove(state);
      this.game.performMove(move.targetPosition);
    }, this.aiDelay(state));
  }
}
