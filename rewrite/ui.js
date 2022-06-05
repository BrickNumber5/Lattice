const cnv = document.querySelector(".game .board canvas");
const ctx = cnv.getContext("2d");

const menuelem = document.querySelector(".menu");

const menuStack = [];

let board;

export function setBoard(b) {
  board = b;
}

function loop(time) {
  if (!board) {
    requestAnimationFrame(loop);
    return;
  }
  
  ctx.clearRect(0, 0, cnv.width, cnv.height);
  
  board.draw(cnv, ctx, time, cursor);
  
  repaintFooter(board.queryStatistics());
  
  requestAnimationFrame(loop);
}

loop();

export class Menu {
  #title;
  #tag;
  #elements;
  constructor(title, tag, elements) {
    this.#title = title;
    this.#tag = tag;
    this.#elements = elements;
  }
  
  generateHTML() {
    const popup = document.createElement("div");
    popup.className = "popup";
    popup.dataset.menuId = this.#tag;
    popup.style.display = "none";
    
    const close = document.createElement("button");
    close.className = "close-btn";
    close.onclick = closeMenu;
    popup.appendChild(close);
    
    const title = document.createElement("span");
    title.className = "header";
    title.innerText = this.#title;
    popup.appendChild(title);
    
    for (let elem of this.#elements) {
      popup.appendChild(elem.generateHTML());
    }
    
    return popup;
  }
}

export class SubMenu {
  #label;
  #elements;
  constructor(label, elements) {
    this.#label = label;
    this.#elements = elements;
  }
   
  generateHTML() {
    const area = document.createElement("div");
    area.className = "area";
    area.dataset.title = this.#label;
    
    for (let elem of this.#elements) {
      area.appendChild(elem.generateHTML());
    }
    
    return area;
  }
}

export class NumberInput {
  #label;
  #min;
  #max;
  #def;
  #value;
  constructor(label, min, max, def) {
    this.#label = label;
    this.#min = min;
    this.#max = max;
    this.#def = def;
    this.#value = def;
  }
  
  get value() {
    return this.#value;
  }
  
  setValue(e) {
    let v = e.value;
    v = +v;
    if (Number.isNaN(v)) v = this.#def;
    v = Math.round(v);
    if (v < this.#min) v = this.#min;
    if (v > this.#max) v = this.#max;
    this.#value = v;
    e.value = v;
  }
  
  generateHTML() {
    const container = document.createElement("label");
    container.className = "input";
    
    container.appendChild(document.createTextNode(this.#label));
    
    const input = document.createElement("input");
    input.type = "number";
    input.min = this.#min;
    input.max = this.#max;
    input.step = 1;
    input.value = this.#def;
    input.onchange = this.setValue.bind(this, input);
    container.appendChild(input);
    
    return container;
  }
}

export class Button {
  #label;
  #func;
  constructor(label, func) {
    this.#label = label;
    this.#func = func
  }
  
  generateHTML() {
    const button = document.createElement("button");
    button.className = "btn";
    button.innerText = this.#label;
    button.onclick = this.#func;
    return button;
  }
}

export function addMenu(m) {
  menuelem.appendChild(m.generateHTML());
}

export function openMenu(id) {
  menuelem.style.display = "";
  if (menuStack.length > 0) menuelem.querySelector(`.popup[data-menu-id="${menuStack[menuStack.length - 1]}"]`).style.display = "none";
  menuStack.push(id);
  menuelem.querySelector(`.popup[data-menu-id="${id}"]`).style.display = "";
}

export function closeMenu() {
  menuelem.querySelector(`.popup[data-menu-id="${menuStack[menuStack.length - 1]}"]`).style.display = "none";
  menuStack.pop();
  if (menuStack.length > 0) {
    menuelem.querySelector(`.popup[data-menu-id="${menuStack[menuStack.length - 1]}"]`).style.display = "";
  } else {
    menuelem.style.display = "none";
  }
}


document.querySelector(".game .footer .undo-btn").onclick = () => board.undo();
document.querySelector(".game .footer .next-turn-btn").onclick = () => board.nextTurn();

document.querySelector(".game .header .menu-btn").onclick = openMenu.bind(null, "#menu");

const footer = document.querySelector(".game .footer");
let pStats = {turn: null, player: null, actions: null, canundo: null};
function repaintFooter(statistics) {
  if (pStats.turn === statistics.turn && pStats.player === statistics.player && pStats.actions === statistics.actions && pStats.canundo === statistics.canundo) return;
  pStats = statistics;
  document.documentElement.style.setProperty('--accent-clr', statistics.player.color);
  footer.querySelector(".turn .data").dataset.value = statistics.turn + 1;
  footer.querySelector(".player .data").dataset.value = statistics.player.name;
  footer.querySelector(".actions .data").dataset.value = statistics.actions;
}

const sizeCanvas = () => {
  // Hiding and Unhiding the canvas prevents it from mangling the clientHeight value
  cnv.style.display = "none";
  const d = cnv.parentNode.clientHeight;
  cnv.style.display = "";
  cnv.width = cnv.height = d;
};

const cursor = {x: -1000, y: -1000, state: "hover"};
cnv.onpointermove = e => {
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;
};
cnv.onpointerdown = e => {
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;
  const {u, v} = board.screenToBoard(cursor.x, cursor.y, cnv.width, cnv.width / (board.size + 2));
  cursor.u = Math.round(u);
  cursor.v = Math.round(v);
  if (cursor.state === "hover") {
    const moves = board.legalMoves(cursor.u, cursor.v);
    if (moves.length === 0) return;
    if (moves.includes("place-major") || moves.includes("place-minor")) {
      cursor.state = "place";
      cursor.xi = cursor.x;
      cursor.yi = cursor.y;
      cursor.ui = cursor.u;
      cursor.vi = cursor.v;
      return;
    }
    if (moves.includes("retarget")) {
      cursor.state = "target";
      cursor.type = "adjust";
      cursor.ui = cursor.u;
      cursor.vi = cursor.v;
      return;
    }
    if (moves.some(m => m.type === "move")) {
      cursor.state = "move";
      cursor.ui = cursor.u;
      cursor.vi = cursor.v;
      cursor.moves = moves;
      return;
    }
  }
  if (cursor.state === "place") {
    if (board.actions > 1) {
      if (cursor.u - cursor.ui ===  1 && cursor.v - cursor.vi === 0) board.place(cursor.ui, cursor.vi, 0, 0);
      if (cursor.u - cursor.ui ===  0 && cursor.v - cursor.vi === 1) board.place(cursor.ui, cursor.vi, 0, 1);
      if (cursor.u - cursor.ui === -1 && cursor.v - cursor.vi === 1) board.place(cursor.ui, cursor.vi, 0, 2);
      
      if (cursor.u - cursor.ui === -1 && cursor.v - cursor.vi === 0) {
        cursor.state = "target";
        cursor.type = "first";
        cursor.piece = {range: 1, spec: 0};
        return;
      }
      if (cursor.u - cursor.ui === 0 && cursor.v - cursor.vi === -1) {
        cursor.state = "target";
        cursor.type = "first";
        cursor.piece = {range: 1, spec: 1};
        return;
      }
      if (cursor.u - cursor.ui === 1 && cursor.v - cursor.vi === -1) {
        cursor.state = "target";
        cursor.type = "first";
        cursor.piece = {range: 1, spec: 2};
        return;
      }
    }
    
    if (cursor.u - cursor.ui === 0 && cursor.v - cursor.vi === 0) board.place(cursor.ui, cursor.vi, -1, -1);
    
    cursor.state = "hover";
    return;
  }
  if (cursor.state === "target") {
    if (cursor.u >= 0 && cursor.v >= 0 && cursor.u + cursor.v < board.size) {
      if (cursor.type === "first") {
        board.place(cursor.ui, cursor.vi, cursor.piece.range, cursor.piece.spec, {u: cursor.u - cursor.ui, v: cursor.v - cursor.vi});
      } else {
        board.retarget(cursor.ui, cursor.vi, cursor.u, cursor.v);
      }
    }
    
    cursor.state = "hover";
    return;
  }
  if (cursor.state === "move") {
    board.move(cursor.ui, cursor.vi, cursor.u, cursor.v);
    cursor.state = "hover";
    return;
  }
};

window.onpointerdown = e => {
  if (e.srcElement !== cnv) cursor.state = "hover";
};

window.onresize = sizeCanvas;
sizeCanvas();