import { TestBed } from '@angular/core/testing';
import { AiService } from './ai.service';
import { BoardService } from './board.service';

describe('AiService', () => {
  let service: AiService;
  let boardService: BoardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AiService);
    boardService = TestBed.inject(BoardService);
  });

  it('calculates a shift move for easy difficulty', () => {
    const { board, spareTile } = boardService.initializeBoard(2);
    const players = boardService.initializePlayers(
      [{ name: 'AI', isAI: true, aiDifficulty: 'easy' }, { name: 'B', isAI: false }], 2
    );
    const move = service.calculateMove({ board, spareTile, players, currentPlayerIndex: 0,
      phase: 'shift', lastShift: null, settings: { showReachableFields: true, aiSpeed: 'normal' }, winner: null });
    expect(move.shift).toBeDefined();
    expect(move.shift.direction).toMatch(/left|right|up|down/);
  });

  it('hard AI finds shift that makes treasure reachable if possible', () => {
    const { board, spareTile } = boardService.initializeBoard(2);
    const players = boardService.initializePlayers(
      [{ name: 'AI', isAI: true, aiDifficulty: 'hard' }, { name: 'B', isAI: false }], 2
    );
    const move = service.calculateMove({ board, spareTile, players, currentPlayerIndex: 0,
      phase: 'shift', lastShift: null, settings: { showReachableFields: true, aiSpeed: 'normal' }, winner: null });
    expect(move.shift).toBeDefined();
    expect(move.targetPosition).toBeDefined();
  });
});
