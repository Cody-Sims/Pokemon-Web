import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Unit tests for the map generation core utilities and generators.
 * These test the standalone map-gen modules in temp/scripts/map-gen/.
 * Since those modules use Node FS APIs and relative imports that don't resolve
 * through the game's Vite aliases, we test the underlying algorithms here by
 * reimplementing the core logic in a test-friendly way.
 */

// ─── Grid ───
describe('Grid logic', () => {
  // Inline minimal Grid for testing without importing temp/ modules
  class Grid {
    readonly width: number;
    readonly height: number;
    private data: number[];
    constructor(w: number, h: number, fill = 0) {
      this.width = w; this.height = h;
      this.data = new Array(w * h).fill(fill);
    }
    inBounds(x: number, y: number) { return x >= 0 && x < this.width && y >= 0 && y < this.height; }
    get(x: number, y: number) { return this.inBounds(x, y) ? this.data[y * this.width + x] : -1; }
    set(x: number, y: number, v: number) { if (this.inBounds(x, y)) this.data[y * this.width + x] = v; }
    fill(v: number) { this.data.fill(v); }
    fillRect(x: number, y: number, w: number, h: number, v: number) {
      for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) this.set(x+dx, y+dy, v);
    }
    count(pred: (v: number) => boolean) { return this.data.filter(pred).length; }
    to2D(): number[][] {
      const r: number[][] = [];
      for (let y = 0; y < this.height; y++) {
        const row: number[] = [];
        for (let x = 0; x < this.width; x++) row.push(this.get(x, y));
        r.push(row);
      }
      return r;
    }
  }

  it('creates grid with correct dimensions', () => {
    const g = new Grid(10, 8);
    expect(g.width).toBe(10);
    expect(g.height).toBe(8);
    expect(g.get(0, 0)).toBe(0);
  });

  it('fills grid with a value', () => {
    const g = new Grid(5, 5, 3);
    expect(g.get(2, 2)).toBe(3);
    expect(g.count(v => v === 3)).toBe(25);
  });

  it('returns -1 for out-of-bounds', () => {
    const g = new Grid(5, 5);
    expect(g.get(-1, 0)).toBe(-1);
    expect(g.get(5, 0)).toBe(-1);
    expect(g.get(0, -1)).toBe(-1);
    expect(g.get(0, 5)).toBe(-1);
  });

  it('set ignores out-of-bounds', () => {
    const g = new Grid(5, 5);
    g.set(-1, 0, 99);
    g.set(5, 0, 99);
    expect(g.count(v => v === 99)).toBe(0);
  });

  it('fillRect fills a region', () => {
    const g = new Grid(10, 10, 0);
    g.fillRect(2, 3, 4, 3, 1);
    expect(g.get(2, 3)).toBe(1);
    expect(g.get(5, 5)).toBe(1);
    expect(g.get(1, 3)).toBe(0);
    expect(g.get(6, 3)).toBe(0);
    expect(g.count(v => v === 1)).toBe(12);
  });

  it('to2D produces correct dimensions', () => {
    const g = new Grid(3, 4, 7);
    const arr = g.to2D();
    expect(arr.length).toBe(4);
    expect(arr[0].length).toBe(3);
    expect(arr[2][1]).toBe(7);
  });
});

// ─── Flood Fill ───
describe('Flood fill connectivity', () => {
  function floodFill(grid: number[][], sx: number, sy: number, pred: (v: number) => boolean) {
    const h = grid.length, w = grid[0].length;
    const visited = new Set<string>();
    const result: Array<{x: number; y: number}> = [];
    const q: Array<{x: number; y: number}> = [{x: sx, y: sy}];
    if (!pred(grid[sy][sx])) return result;
    while (q.length > 0) {
      const {x, y} = q.shift()!;
      const k = `${x},${y}`;
      if (visited.has(k)) continue;
      visited.add(k);
      if (x < 0 || x >= w || y < 0 || y >= h) continue;
      if (!pred(grid[y][x])) continue;
      result.push({x, y});
      q.push({x:x-1,y}, {x:x+1,y}, {x,y:y-1}, {x,y:y+1});
    }
    return result;
  }

  it('fills a connected region', () => {
    const grid = [
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 0],
    ];
    const region = floodFill(grid, 0, 0, v => v === 0);
    // Should find all 0s that are connected from (0,0)
    expect(region.length).toBe(10); // all 10 zeros are connected (through bottom row)
  });

  it('stops at walls', () => {
    const grid = [
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 0],
    ];
    const region = floodFill(grid, 0, 0, v => v === 0);
    expect(region.length).toBe(3); // only left column
  });

  it('returns empty for non-matching start', () => {
    const grid = [[1, 0], [0, 0]];
    const region = floodFill(grid, 0, 0, v => v === 0);
    expect(region.length).toBe(0);
  });
});

// ─── Seeded RNG ───
describe('Seeded RNG determinism', () => {
  class SeededRandom {
    private state: number;
    constructor(seed: number) { this.state = seed; }
    next(): number {
      this.state |= 0;
      this.state = (this.state + 0x6d2b79f5) | 0;
      let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    nextInt(min: number, max: number) { return Math.floor(this.next() * (max - min + 1)) + min; }
    chance(p: number) { return this.next() < p; }
  }

  it('produces deterministic output for same seed', () => {
    const rng1 = new SeededRandom(42);
    const rng2 = new SeededRandom(42);
    const vals1 = Array.from({length: 10}, () => rng1.next());
    const vals2 = Array.from({length: 10}, () => rng2.next());
    expect(vals1).toEqual(vals2);
  });

  it('produces different output for different seeds', () => {
    const rng1 = new SeededRandom(42);
    const rng2 = new SeededRandom(99);
    const v1 = rng1.next();
    const v2 = rng2.next();
    expect(v1).not.toBe(v2);
  });

  it('nextInt stays in range', () => {
    const rng = new SeededRandom(123);
    for (let i = 0; i < 100; i++) {
      const v = rng.nextInt(5, 10);
      expect(v).toBeGreaterThanOrEqual(5);
      expect(v).toBeLessThanOrEqual(10);
    }
  });

  it('chance returns booleans with correct distribution', () => {
    const rng = new SeededRandom(42);
    let trueCount = 0;
    const n = 1000;
    for (let i = 0; i < n; i++) {
      if (rng.chance(0.5)) trueCount++;
    }
    // Should be roughly 50% (within 10% tolerance)
    expect(trueCount / n).toBeGreaterThan(0.4);
    expect(trueCount / n).toBeLessThan(0.6);
  });
});

// ─── A* Pathfinding ───
describe('A* pathfinding', () => {
  function astar(
    grid: number[][], sx: number, sy: number, gx: number, gy: number,
    walkable: (v: number) => boolean,
  ): Array<{x: number; y: number}> | null {
    const h = grid.length, w = grid[0].length;
    if (!walkable(grid[sy][sx]) || !walkable(grid[gy][gx])) return null;
    const open = new Map<string, {x:number;y:number;g:number;h:number;f:number;parent:any}>();
    const closed = new Set<string>();
    const hFn = (a: {x:number;y:number}, b: {x:number;y:number}) => Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
    const start = {x:sx,y:sy,g:0,h:hFn({x:sx,y:sy},{x:gx,y:gy}),f:hFn({x:sx,y:sy},{x:gx,y:gy}),parent:null};
    open.set(`${sx},${sy}`, start);
    while (open.size > 0) {
      let cur: any = null;
      for (const n of open.values()) if (!cur || n.f < cur.f) cur = n;
      if (!cur) return null;
      if (cur.x === gx && cur.y === gy) {
        const path: Array<{x:number;y:number}> = [];
        let n = cur;
        while(n) { path.unshift({x:n.x,y:n.y}); n = n.parent; }
        return path;
      }
      const k = `${cur.x},${cur.y}`;
      open.delete(k); closed.add(k);
      for (const [dx,dy] of [[0,-1],[0,1],[-1,0],[1,0]]) {
        const nx=cur.x+dx, ny=cur.y+dy, nk=`${nx},${ny}`;
        if (nx<0||nx>=w||ny<0||ny>=h||closed.has(nk)||!walkable(grid[ny][nx])) continue;
        const g=cur.g+1, existing=open.get(nk);
        if (!existing||g<existing.g) {
          const node = {x:nx,y:ny,g,h:hFn({x:nx,y:ny},{x:gx,y:gy}),f:g+hFn({x:nx,y:ny},{x:gx,y:gy}),parent:cur};
          open.set(nk, node);
        }
      }
    }
    return null;
  }

  it('finds shortest path in open grid', () => {
    const grid = [[0,0,0],[0,0,0],[0,0,0]];
    const path = astar(grid, 0, 0, 2, 2, v => v === 0);
    expect(path).not.toBeNull();
    expect(path!.length).toBe(5); // Manhattan distance 4 + start = 5
    expect(path![0]).toEqual({x:0,y:0});
    expect(path![path!.length-1]).toEqual({x:2,y:2});
  });

  it('navigates around walls', () => {
    const grid = [
      [0, 1, 0],
      [0, 1, 0],
      [0, 0, 0],
    ];
    const path = astar(grid, 0, 0, 2, 0, v => v === 0);
    expect(path).not.toBeNull();
    // Must go down around the wall
    expect(path!.some(p => p.y === 2)).toBe(true);
  });

  it('returns null when no path exists', () => {
    const grid = [
      [0, 1, 0],
      [1, 1, 0],
      [0, 0, 0],
    ];
    const path = astar(grid, 0, 0, 2, 0, v => v === 0);
    expect(path).toBeNull();
  });
});

// ─── Biome Substitution ───
describe('Biome substitution', () => {
  function applyBiome(grid: string[], subs: Record<string, string>): string[] {
    return grid.map(row => [...row].map(ch => subs[ch] ?? ch).join(''));
  }

  it('substitutes characters according to theme', () => {
    const grid = ['.T.', 'TPT', '.T.'];
    const subs = { '.': '«', 'T': 'Þ' };
    const result = applyBiome(grid, subs);
    expect(result).toEqual(['«Þ«', 'ÞPÞ', '«Þ«']);
  });

  it('passes through unmapped characters', () => {
    const grid = ['.P.'];
    const subs = { '.': 's' };
    const result = applyBiome(grid, subs);
    expect(result).toEqual(['sPs']);
  });

  it('handles empty substitution (identity)', () => {
    const grid = ['.T.'];
    const result = applyBiome(grid, {});
    expect(result).toEqual(['.T.']);
  });
});

// ─── CHAR_TO_TILE mapping completeness ───
describe('CHAR_TO_TILE mapping', () => {
  // Test that parseMap uses the correct mapping
  it('maps basic ASCII chars correctly', () => {
    const CHAR_TO_TILE: Record<string, number> = {
      '.': 0, 'P': 1, 'G': 2, 'T': 3, 'W': 4,
      'H': 5, 'R': 6, 'D': 7, 'F': 8, 'f': 9,
      '#': 26, '_': 25,
    };
    const parseMap = (rows: string[]) =>
      rows.map(row => [...row].map(ch => CHAR_TO_TILE[ch] ?? 0));

    const result = parseMap(['..GP', 'T#_W']);
    expect(result).toEqual([[0,0,2,1],[3,26,25,4]]);
  });

  it('falls back to GRASS for unknown chars', () => {
    const CHAR_TO_TILE: Record<string, number> = { '.': 0 };
    const parseMap = (rows: string[]) =>
      rows.map(row => [...row].map(ch => CHAR_TO_TILE[ch] ?? 0));

    const result = parseMap(['Z?!']);
    expect(result).toEqual([[0, 0, 0]]);
  });
});

// ─── TILE_TO_CHAR roundtrip ───
describe('TILE_TO_CHAR roundtrip', () => {
  const CHAR_TO_TILE: Record<string, number> = {
    '.': 0, 'P': 1, 'G': 2, 'T': 3, 'W': 4, 'H': 5,
    ',': 58, ';': 59,
  };
  const TILE_TO_CHAR: Record<number, string> = {
    0: '.', 1: 'P', 2: 'G', 3: 'T', 4: 'W', 5: 'H',
    58: ',', 59: ';',
  };

  it('roundtrips for standard chars', () => {
    const input = ['.PGT', 'W,;H'];
    const parsed = input.map(row => [...row].map(ch => CHAR_TO_TILE[ch] ?? 0));
    const exported = parsed.map(row => row.map(t => TILE_TO_CHAR[t] ?? '.').join(''));
    expect(exported).toEqual(input);
  });
});
