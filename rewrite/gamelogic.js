import {gcd} from "./util.js";

// The top level state
export class Board {
  #size;
  #nodes;
  #players;
  #turnN;
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
    this.#turnN = -1;
    this.nextTurn();
  }
  
  at(u, v) {
    if (u < 0 || v < 0) return null;
    if (u + v >= this.#size) return null;
    return this.#nodes.get(u + v * this.#size);
  }
  
  get size() {
    return this.#size;
  }
  
  get players() {
    return this.#players;
  }
  
  get player() {
    return this.#players[this.#turn];
  }
  
  boardToScreen(u, v, w, d) {
    return {
      x: w / 2 - (this.#size - 1) * d / 2 + u * d + v * d * this.#ccos,
      y: w / 2 - (this.#size - 1) * d * this.#csin / 2 + v * d * this.#csin
    };
  }
  
  screenToBoard(x, y, w, d) {
    const v = (this.#size - 1) / 2 +  (y - w / 2) / (d * this.#csin)
    return {
      u: (this.#size - 1) / 2 - w / (2 * d) - v * this.#ccos + x / d,
      v
    };
  }
  
  draw(cnv, ctx, ticks, cursor) {
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
    
    if (cursor) {
      let {u, v} = this.screenToBoard(cursor.x, cursor.y, cnv.width, d);
      u = Math.round(u);
      v = Math.round(v);
      cursor.u = u;
      cursor.v = v;
      
      if (cursor.state === "hover") {
        if (u >= 0 && v >= 0 && u + v < this.#size) this.drawCursor(cnv, ctx, ticks, d, u, v);
        return;
      }
      
      if (cursor.state === "place") {
        const neighborCoords = (this.#actions > 1 ? unitVectors.slice() : []).concat({u: 0, v: 0}).map(vec => cursor.ui + vec.u + 2 * this.#size * (cursor.vi + vec.v));
        const {x, y} = this.boardToScreen(cursor.ui, cursor.vi, cnv.width, d);
        ctx.fillStyle = "#555a";
        ctx.beginPath();
        ctx.arc(x, y, 1.5 * d, 0, 2 * Math.PI);
        ctx.fill();
        
        if (this.#actions > 1) {
          this.player.drawPiece(cnv, ctx, ticks, d, x + d, y, {info: {range: 0, spec: 0}});
          this.player.drawPiece(cnv, ctx, ticks, d, x + d * this.#ccos, y + d * this.#csin, {info: {range: 0, spec: 1}});
          this.player.drawPiece(cnv, ctx, ticks, d, x + d * this.#ccos - d, y + d * this.#csin, {info: {range: 0, spec: 2}});
          
          const targetVector = {u: 1, v: -1};
          this.player.drawPiece(cnv, ctx, ticks, d, x - d, y, {info: {range: 1, spec: 0, targetVector}});
          this.player.drawPiece(cnv, ctx, ticks, d, x - d * this.#ccos, y - d * this.#csin, {info: {range: 1, spec: 1, targetVector}});
          this.player.drawPiece(cnv, ctx, ticks, d, x - d * this.#ccos + d, y - d * this.#csin, {info: {range: 1, spec: 2, targetVector}});
        }
        this.player.drawPiece(cnv, ctx, ticks, d, x, y, {info: {range: -1, spec: -1}});
        
        
        if (neighborCoords.includes(u + 2 * this.#size * v)) this.drawCursor(cnv, ctx, ticks, d, u, v);
        return;
      }
      
      if (cursor.state === "target") {
        const {x, y} = this.boardToScreen(cursor.ui, cursor.vi, cnv.width, d);
        let targetVector = {u: 0, v: 0};
        if (u >= 0 && v >= 0 && u + v < this.#size) {
          targetVector = {u: cursor.u - cursor.ui, v: cursor.v - cursor.vi};
          
          this.drawCursor(cnv, ctx, ticks, d, u, v);
        }
        this.drawCursor(cnv, ctx, ticks, d, cursor.ui, cursor.vi);
        if (cursor.type === "first") this.player.drawPiece(cnv, ctx, ticks, d, x, y, {info: {targetVector, ...cursor.piece}});
        return;
      }
      if (cursor.state === "move") {
        const {u, v, ui, vi} = cursor;
        if (cursor.moves.some(m => m.u === u && m.v === v)) this.drawCursor(cnv, ctx, ticks, d, u, v);
        this.drawCursor(cnv, ctx, ticks, d, ui, vi);
        return;
      }
    }
  }
  
  pushUndo(undoFn) {
    this.#undostack.push(undoFn);
  }
  
  evaluateStep() {
    // TODO
  }
  
  drawCursor(cnv, ctx, ticks, d, u, v) {
    const {x, y} = this.boardToScreen(u, v, cnv.width, d);
    d *= Math.cos(2 * Math.PI * ticks / 3000) / 8 + 1.5;
    
    ctx.strokeStyle = this.player.color;
    const r = 7 * d / 24;
    const C = 2 * Math.PI * r;
    ctx.setLineDash([C / 8, C / 8]);
    ctx.lineDashOffset = -C / 16;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineCap = "butt";
  }
  
  // --- User Callable Functions Below
  
  legalMoves(u, v) {
    const node = this.at(u, v);
    if (!node) return [];
    if (this.#actions < 1) return [];
    if (!node.piece) {
      if (this.#actions >= 2) return ["place-major", "place-minor"];
      return ["place-minor"];
    }
    const {piece} = node;
    if (piece.player !== this.#players[this.#turn]) return [];
    if (piece.info.range === -1) return [];
    if (piece.info.range === 0) {
      return Array.from(node.neighbors)
               .filter(n => !n.piece)
               .map(n => ({type: "move", u: n.u, v: n.v}));
    }
    if (piece.info.range === 1) return ["retarget"];
    throw "Failed to Calculate legal moves";
  }
  
  get actions() {
    return this.#actions;
  }
  
  place(u, v, range, spec, targetVector) {
    if (!this.at(u, v) || this.at(u, v).piece) return false;
    if (this.#actions < 1 || spec !== -1 && this.#actions < 2) return false;
    this.#actions -= spec === -1 ? 1 : 2;
    this.at(u, v).place(this.#turn, range, spec, targetVector);
    this.pushUndo(() => {
      this.#actions += spec === -1 ? 1 : 2;
      this.at(u, v).destroy();
    });
  }
  
  move(ui, vi, uf, vf) {
    const node = this.at(ui, vi);
    if (!node) return false;
    const piece = node.piece;
    if (!piece || piece.player !== this.#players[this.#turn] || piece.info.range !== 0) return false;
    const destnode = this.at(uf, vf);
    if (!destnode || !node.neighbors.has(destnode) || destnode.piece !== null) return false;
    if (this.#actions < 1) return false;
    this.#actions--;
    node.move(destnode);
    this.pushUndo(() => {
      this.#actions++;
      destnode.move(node);
    });
  }
  
  retarget(ui, vi, ut, vt) {
    const node = this.at(ui, vi);
    if (!node) return false;
    const piece = node.piece;
    if (!piece || piece.player !== this.#players[this.#turn] || piece.info.range !== 1) return false;
    if (this.#actions < 1) return false;
    this.#actions--;
    const oldTargetVector = piece.targetVector;
    piece.target({u: ut - ui, v: vt - vi});
    this.pushUndo(() => {
      this.#actions++;
      piece.target(oldTargetVector);
    });
  }
  
  get canundo() {
    return this.#undostack.length > 0;
  }
  
  undo() {
    if (this.#undostack.length === 0) return null;
    return this.#undostack.pop()();
  }
  
  nextTurn() {
    this.#turn++;
    this.#turn %= this.#players.length;
    if (this.#turn === 0) this.#turnN++;
    this.#actions = this.#maxactions;
    this.#undostack = [];
    this.evaluateStep();
  }
  
  queryStatistics() {
    return {turn: this.#turnN, player: this.#players[this.#turn], actions: this.#actions, canundo: this.canundo};
  }
}

export const unitVectors = [
  {u:  1, v:  0}, // u
  {u:  0, v:  1}, // v
  {u: -1, v:  1}, // -u + v
  {u: -1, v:  0}, // -u
  {u:  0, v: -1}, // -v
  {u:  1, v: -1}  // u + -v
];

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
    for (let vec of unitVectors) {
      const {u, v} = vec;
      const neighbor = this.#board.at(this.#u + u, this.#v + v);
      if (neighbor) this.#neighbors.add(neighbor);
    }
  }
  
  get neighbors() {
    return new Set(this.#neighbors);
  }
  
  get board() {
    return this.#board;
  }
  
  get piece() {
    return this.#piece;
  }
  
  get u() {return this.#u;}
  get v() {return this.#v;}
  
  getTargets(range, targetVector) {
    if (range === 0) {
      return new Set([...this.#neighbors].map(x => x.#piece).filter(x => x !== null));
    } else {
      if (targetVector.u === 0 && targetVector.v === 0) return new Set();
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
  
  destroy() {
    const p = this.#piece;
    p.node = null;
    this.#piece = null;
    return p;
  }
  
  move(othernode) {
    othernode.#piece = this.#piece;
    othernode.#piece.node = othernode;
    this.#piece = null;
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
    this.target(targetVector);
  }
  
  get player() {
    return this.#player;
  }
  
  get targetVector() {
    return this.#targetVector;
  }
  
  target(targetVector) {
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
  
  get node() {
    return this.#node;
  }
  
  set node(n) {
    return this.#node = n;
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
  #name
  constructor(config) {
    const {texture, color, name} = config;
    
    this.#texture = texture;
    this.#color = color;
    this.#name = name;
  }
  
  get color() {
    return this.#color;
  }
  
  get name() {
    return this.#name;
  }
  
  drawPiece(cnv, ctx, ticks, d, x, y, piece) {
    const {info} = piece;
    if (info.spec === 0) {
      ctx.fillStyle = this.#color;
      ctx.beginPath();
      ctx.arc(x, y, d / 6, 0, 2 * Math.PI);
      ctx.fill();
    } else if (info.spec === 1) {
      ctx.fillStyle = this.#color;
      const cos = Math.cos(Math.PI / 6),
            sin = Math.sin(Math.PI / 6);
      ctx.beginPath();
      ctx.moveTo(x, y - d / 5);
      ctx.lineTo(x - d * cos / 5, y + d * sin / 5);
      ctx.lineTo(x + d * cos / 5, y + d * sin / 5);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x, y + d / 5);
      ctx.lineTo(x - d * cos / 5, y - d * sin / 5);
      ctx.lineTo(x + d * cos / 5, y - d * sin / 5);
      ctx.fill();
    } else if (info.spec === 2) {
      ctx.fillStyle = this.#color;
      ctx.beginPath();
      ctx.moveTo(x, y - d / 5);
      ctx.lineTo(x + d / 5, y);
      ctx.lineTo(x, y + d / 5);
      ctx.lineTo(x - d / 5, y);
      ctx.fill();
    } else if (info.spec === -1) {
      ctx.strokeStyle = this.#color;
      ctx.beginPath();
      ctx.arc(x, y, d / 8, 0, 2 * Math.PI);
      ctx.stroke();
    }
    if (info.range === 1) {
      const {u, v} = info.targetVector;
      const cos = Math.cos(-Math.PI / 3);
      const sin = Math.sin(-Math.PI / 3);
      let xo = (u + v * cos);
      let yo = v * sin;
      const l = Math.sqrt(xo * xo + yo * yo);
      xo /= l;
      yo /= l;
      ctx.fillStyle = this.#color;
      ctx.beginPath();
      ctx.arc(x + d * xo / 3, y + d * yo / 3, d / 8, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
}