// The top level state
export class Board {
  #size;
  #nodes;
  constructor(size) {
    this.#size = size;
    this.#nodes = new Map();
    for (let u = 0; u < size; u++) {
      for (let v = 0; v < size - u; v++) {
        this.#nodes.set(u + v * size, new Node(this, u, v));
      }
    }
    this.#nodes.forEach(n => n._initNeighbors());
  }
  
  at(u, v) {
    if (u < 0 || v < 0) return undefined;
    return this.#nodes.get(u + v * this.#size);
  }
  
  draw(cnv, ctx, ticks) {
    
  }
}

class Node {
  #board;
  #u;
  #v;
  #neighbors;
  #piece;
  constructor(board, u, v) {
    this.#board = board;
    this.#u = u;
    this.#v = v;
    this.#piece = null;
  }
  
  _initNeighbors() {
    if (this.#neighbors != null) throw "Neighbors already initialized";
    this.#neighbors = new Set();
    const unitVectors = [
      {u:  1, v:  0}, // u
      {u:  0, v:  1}, // v
      {u: -1, v:  1}, // -u + v
      {u: -1, v:  0}, // -u
      {u:  0, v: -1}, // -v
      {u:  1, v: -1}  // u + -v
    ];
    for (let vec of unitVectors) {
      const {u, v} = vec;
      const neighbor = this.#board.at(this.#u + u, this.#v + v);
      if (neighbor) this.#neighbors.add(neighbor);
    }
  }
  
  draw(cnv, ctx, ticks) {
    
  }
}

class Piece {
  #node;
  #player;
  #range; // 0 : Short,   1 : Long,  -1 : N/A
  #spec;  // 0 : Support, 1 : Attack, 2 : Defense, -1 : Neutral
  #targetVector; // Long-range pieces only
  constructor(node, player, range, spec) {
    this.#node = node;
    this.#player = player;
    this.#range = range;
    this.#spec = spec;
    this.#targetVector = null;
  }
}