/**
 * Grid utility class for 2D tile grids.
 * Provides bounds-safe get/set, fill, region operations, and serialization.
 */

export class Grid {
  readonly width: number;
  readonly height: number;
  private data: number[];

  constructor(width: number, height: number, fillValue = 0) {
    this.width = width;
    this.height = height;
    this.data = new Array(width * height).fill(fillValue);
  }

  /** Clone this grid */
  clone(): Grid {
    const g = new Grid(this.width, this.height);
    g.data = [...this.data];
    return g;
  }

  /** Static: create from 2D array */
  static from2D(grid2d: number[][]): Grid {
    const h = grid2d.length;
    const w = h > 0 ? grid2d[0].length : 0;
    const g = new Grid(w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        g.set(x, y, grid2d[y][x] ?? 0);
      }
    }
    return g;
  }

  /** Check if (x,y) is within bounds */
  inBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  /** Get tile at (x,y). Returns -1 if out of bounds. */
  get(x: number, y: number): number {
    if (!this.inBounds(x, y)) return -1;
    return this.data[y * this.width + x];
  }

  /** Set tile at (x,y). No-op if out of bounds. */
  set(x: number, y: number, value: number): void {
    if (!this.inBounds(x, y)) return;
    this.data[y * this.width + x] = value;
  }

  /** Fill entire grid with a value */
  fill(value: number): void {
    this.data.fill(value);
  }

  /** Fill a rectangular region */
  fillRect(x: number, y: number, w: number, h: number, value: number): void {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        this.set(x + dx, y + dy, value);
      }
    }
  }

  /** Stamp another grid onto this one at (ox, oy). Optionally skip a "transparent" value. */
  stamp(other: Grid, ox: number, oy: number, transparent?: number): void {
    for (let y = 0; y < other.height; y++) {
      for (let x = 0; x < other.width; x++) {
        const v = other.get(x, y);
        if (transparent !== undefined && v === transparent) continue;
        this.set(ox + x, oy + y, v);
      }
    }
  }

  /** Count neighbors matching a predicate in Moore neighborhood (8 cells) */
  countNeighbors(x: number, y: number, predicate: (val: number) => boolean): number {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const v = this.get(x + dx, y + dy);
        if (v === -1) {
          // Out of bounds counts as solid for cave generation
          count++;
        } else if (predicate(v)) {
          count++;
        }
      }
    }
    return count;
  }

  /** Count Von Neumann neighbors (4-directional) matching a predicate */
  countCardinalNeighbors(x: number, y: number, predicate: (val: number) => boolean): number {
    let count = 0;
    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    for (const [dx, dy] of dirs) {
      const v = this.get(x + dx, y + dy);
      if (v !== -1 && predicate(v)) count++;
    }
    return count;
  }

  /** Convert to 2D array */
  to2D(): number[][] {
    const result: number[][] = [];
    for (let y = 0; y < this.height; y++) {
      const row: number[] = [];
      for (let x = 0; x < this.width; x++) {
        row.push(this.get(x, y));
      }
      result.push(row);
    }
    return result;
  }

  /** Iterate over every cell */
  forEach(callback: (x: number, y: number, value: number) => void): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        callback(x, y, this.get(x, y));
      }
    }
  }

  /** Map every cell to a new value */
  map(callback: (x: number, y: number, value: number) => number): Grid {
    const g = new Grid(this.width, this.height);
    this.forEach((x, y, v) => g.set(x, y, callback(x, y, v)));
    return g;
  }

  /** Count cells matching a predicate */
  count(predicate: (val: number) => boolean): number {
    let c = 0;
    for (const v of this.data) {
      if (predicate(v)) c++;
    }
    return c;
  }

  /** Get all positions matching a value */
  findAll(value: number): Array<{ x: number; y: number }> {
    const results: Array<{ x: number; y: number }> = [];
    this.forEach((x, y, v) => {
      if (v === value) results.push({ x, y });
    });
    return results;
  }
}
