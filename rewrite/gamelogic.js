import {gcd} from "./util.js";

// The top level state
export class Board {
  #size;
  #nodes;
  #players;
  #turn;
  #actions;
  #maxactions;
  #undostack;
  #ccos;
  #csin;
  constructor(config) {
    const {size, players, maxactions} = config
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
    
    
    this.#players = Object.freeze([...players]);
    this.#maxactions = maxactions;
    this.#turn = -1;
    this.nextTurn();
  }
  
  at(u, v) {
    if (u < 0 || v < 0) return null;
    return this.#nodes.get(u + v * this.#size);
  }
  
  get size() {
    return this.#size;
  }
  
  get players() {
    return this.#players;
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
  
  pushUndo(undoFn) {
    this.#undostack.push(undoFn);
  }
  
  undo() {
    if (this.#undostack.length === 0) return null;
    return this.#undostack.pop()();
  }
  
  nextTurn() {
    this.#turn++;
    this.#turn %= this.#players.length;
    this.#actions = this.#maxactions;
    this.#undostack = [];
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
  
  get board() {
    return this.#board;
  }
  
  get u() {return this.#u;}
  get v() {return this.#v;}
  
  getTargets(range, targetVector) {
    if (range === 0) {
      return new Set([...this.#neighbors].map(x => x.#piece).filter(x => x !== null));
    } else {
      for (let i = 1; true; i++) {
        let n = this.#board.at(this.#u + i * targetVector.u, this.#v + i * targetVector.v);
        if (!n) return new Set();
        if (n.#piece) return new Set([n.#piece]);
      }
    }
  }
  
  place(playerIndex, range, spec, targetVector = null) {
    this.#piece = new Piece(this, this.#board.players[playerIndex], range, spec, targetVector);
  }
  
  drawTargets(cnv, ctx, ticks, d) {
    const {x, y} = this.#board.boardToScreen(this.#u, this.#v, cnv.width, d);
    this.#piece?.drawTargets?.(cnv, ctx, ticks, d, x, y);
  }
  
  draw(cnv, ctx, ticks, d) {
    const {x, y} = this.#board.boardToScreen(this.#u, this.#v, cnv.width, d);
    
    ctx.strokeStyle = "#ddd";
    ctx.fillStyle = "#222";
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
  constructor(node, player, range, spec, targetVector) {
    this.#node = node;
    this.#player = player;
    this.#range = range;
    this.#spec = spec;
    targetVector ??= {u: 0, v: 0};
    const tGCD = gcd(targetVector.u, targetVector.v);
    this.#targetVector = {u: targetVector.u / tGCD, v: targetVector.v / tGCD};
  }
  
  draw(cnv, ctx, ticks, d, x, y) {
    this.#player.drawPiece(cnv, ctx, ticks, d, x, y, this);
  }
  
  get info() {
    return {node: this.#node, player: this.#player, range: this.#range, spec: this.#spec, targetVector: this.#targetVector};
  }
  
  drawTargets(cnv, ctx, ticks, d, x, y) {
    ctx.strokeStyle = this.#player.color;
    if (this.#range === 0) {
      ctx.beginPath();
      ctx.arc(x, y, d, 0, 2 * Math.PI);
      ctx.stroke();
    }
    if (this.#range === 1) {
      const targets = this.#node.getTargets(1, this.#targetVector);
      const target = targets.size === 0 ?
        {u: this.#node.u + 100 * this.#targetVector.u, v: this.#node.v + 100 * this.#targetVector.v}
      : targets.entries().next().value[0].#node; // Extracting a value from a singleton set
      const {x: xf, y: yf} = this.#node.board.boardToScreen(target.u, target.v, cnv.width, d);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(xf, yf);
      ctx.stroke();
    }
  }
}

export class Player {
  #texture;
  #color;
  constructor(config) {
    const {texture, color} = config;
    
    this.#texture = texture;
    this.#color = color;
  }
  
  get color() {
    return this.#color;
  }
  
  drawPiece(cnv, ctx, ticks, d, x, y, piece) {
    ctx.fillStyle = this.#color;
    ctx.beginPath();
    ctx.arc(x, y, d / 5, 0, 2 * Math.PI);
    ctx.fill();
  }
}