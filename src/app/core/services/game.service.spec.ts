import { TestBed } from '@angular/core/testing';
import { GameService } from './game.service';

describe('GameService', () => {
  let service: GameService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameService);
  });

  it('starts in setup phase', () => {
    service.state$.subscribe(state => {
      expect(state.phase).toBe('setup');
    });
  });

  it('startGame initializes board with correct player count', () => {
    service.startGame([
      { name: 'Alice', isAI: false },
      { name: 'Bob', isAI: false },
    ]);
    service.state$.subscribe(state => {
      expect(state.players.length).toBe(2);
      expect(state.phase).toBe('shift');
      expect(state.board.length).toBe(7);
    });
  });

  it('after shift phase completes, switches to move phase', () => {
    service.startGame([{ name: 'A', isAI: false }, { name: 'B', isAI: false }]);
    service.state$.subscribe(state => {
      if (state.phase === 'shift') {
        service.performShift({ direction: 'left', index: 1 });
      }
    });
    service.state$.subscribe(state => {
      if (state.lastShift) {
        expect(state.phase).toBe('move');
      }
    });
  });
});
