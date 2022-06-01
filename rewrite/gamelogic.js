// The top level state
export class Board {
  #size;
  #nodes;
  #ccos;
  #csin;
  constructor(size) {
    this.#size = size;
    this.#nodes = new Map();
    
    this.#ccos = Math.cos(-Math.PI / 3);
    this.#csin = Math.sin(-Math.PI / 3);
    
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
  
  get size() {
    return this.#size;
  }
  
  boardToScreen(u, v, w, d) {
    return {
      x: w / 2 - (this.#size - 1) * d / 2 + u * d + v * d * this.#ccos,
      y: w / 2 - (this.#size - 1) * d * this.#csin / 2 + v * d * this.#csin
    };
  }
  
  draw(cnv, ctx, ticks) {
    // Assumes the canvas is square
    const d = cnv.width / (this.#size + 2);
    
    ctx.fillStyle = "#222";
    ctx.strokeStyle = "#ddd";
    ctx.lineWidth = d / 12;
    
    ctx.beginPath();
    for (let u = 0; u < this.#size - 1; u++) {
      for (let v = 0; v < this.#size - u - 1; v++) {
        const {x, y} = this.boardToScreen(u, v, cnv.width, d);
        ctx.moveTo(x, y);
        ctx.lineTo(x + this.#ccos * d, y + this.#csin * d);
        ctx.lineTo(x + d, y);
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    
    
    let dash = d * 2 * Math.PI / 36;
    ctx.setLineDash([dash, 2 * dash]);
    ctx.lineCap = "round";
    ctx.lineDashOffset = -(ticks % 30000) * 2 * Math.PI * d / 30000;
    for (let [_, node] of this.#nodes) {
      node.drawTargets(cnv, ctx, ticks, d);
    }
    ctx.setLineDash([]);
    ctx.lineCap = "butt";
    
    for (let [_, node] of this.#nodes) {
      node.draw(cnv, ctx, ticks, d);
    }
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
  
  place(player, range, spec) {
    this.#piece = new Piece(this, player, range, spec);
  }
  
  drawTargets(cnv, ctx, ticks, d) {
    const {x, y} = this.#board.boardToScreen(this.#u, this.#v, cnv.width, d);
    this.#piece?.drawTargets?.(cnv, ctx, ticks, d, x, y);
  }
  
  draw(cnv, ctx, ticks, d) {
    const {x, y} = this.#board.boardToScreen(this.#u, this.#v, cnv.width, d);
    
    ctx.strokeStyle = "#ddd";
    ctx.beginPath();
    ctx.arc(x, y, 7 * d / 24, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    this.#piece?.draw?.(cnv, ctx, ticks, d, x, y);
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
  
  draw(cnv, ctx, ticks, d) {
    
  }
  
  drawTargets(cnv, ctx, ticks, d, x, y) {
    ctx.strokeStyle = "#3cc";
    if (this.#range === 0) {
      ctx.beginPath();
      ctx.arc(x, y, d, 0, 2 * Math.PI);
      ctx.stroke();
    }
    if (this.#range === 1) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - cnv.height);
      ctx.stroke();
    }
  }
}