import { TestBed } from '@angular/core/testing';
import { BoardService } from './board.service';

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
