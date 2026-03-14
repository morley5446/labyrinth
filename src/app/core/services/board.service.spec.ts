import { TestBed } from '@angular/core/testing';
import { BoardService } from './board.service';
import { Player } from '../models';

describe('BoardService - tile paths', () => {
  let service: BoardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BoardService);
  });

  it('straight tile rotation 0 has north+south paths', () => {
    const paths = service.computePaths('straight', 0);
    expect(paths).toEqual({ north: true, east: false, south: true, west: false });
  });

  it('straight tile rotation 90 has east+west paths', () => {
    const paths = service.computePaths('straight', 90);
    expect(paths).toEqual({ north: false, east: true, south: false, west: true });
  });

  it('curve tile rotation 0 has north+east paths', () => {
    const paths = service.computePaths('curve', 0);
    expect(paths).toEqual({ north: true, east: true, south: false, west: false });
  });

  it('T tile rotation 0 has north+east+west paths', () => {
    const paths = service.computePaths('T', 0);
    expect(paths).toEqual({ north: true, east: true, south: false, west: true });
  });

  it('initialBoard returns 7x7 grid', () => {
    const { board } = service.initializeBoard(2);
    expect(board.length).toBe(7);
    expect(board[0].length).toBe(7);
  });

  it('fixed corner tiles are correct', () => {
    const { board } = service.initializeBoard(2);
    // top-left corner: curve facing east+south
    expect(board[0][0].paths.east).toBe(true);
    expect(board[0][0].paths.south).toBe(true);
    expect(board[0][0].paths.north).toBe(false);
    expect(board[0][0].paths.west).toBe(false);
  });
});

describe('BoardService - shift mechanic', () => {
  let service: BoardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BoardService);
  });

  it('shift left on row 1 moves tiles left and returns new spare', () => {
    const { board, spareTile } = service.initializeBoard(2);
    const originalFirst = board[1][0];
    const result = service.shiftTiles(board, spareTile, { direction: 'left', index: 1 });
    // spare becomes the old last tile of row 1
    expect(result.newSpare).toEqual(board[1][6]);
    // board[1][0] is now the old spare
    expect(result.newBoard[1][0]).toEqual(spareTile);
    // board[1][1] is now the old board[1][0]
    expect(result.newBoard[1][1]).toEqual(originalFirst);
  });

  it('shift right on row 1 moves tiles right', () => {
    const { board, spareTile } = service.initializeBoard(2);
    const originalLast = board[1][6];
    const result = service.shiftTiles(board, spareTile, { direction: 'right', index: 1 });
    expect(result.newSpare).toEqual(board[1][0]);
    expect(result.newBoard[1][6]).toEqual(spareTile);
    expect(result.newBoard[1][5]).toEqual(originalLast);
  });

  it('player pushed off edge appears on opposite side', () => {
    const { board, spareTile } = service.initializeBoard(2);
    const players: Player[] = [
      { id: 1, name: 'A', color: 'red', isAI: false, position: { row: 1, col: 6 },
        startPosition: { row: 0, col: 0 }, cards: [], collectedCards: [] }
    ];
    const result = service.shiftTiles(board, spareTile, { direction: 'left', index: 1 }, players);
    expect(result.newPlayers![0].position).toEqual({ row: 1, col: 0 });
  });
});
