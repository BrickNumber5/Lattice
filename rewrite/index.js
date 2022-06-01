import * as GAME from "./gamelogic.js";
import * as UTIL from "./util.js";
import * as UI from "./ui.js";

window.GAME = GAME;
window.UTIL = UTIL;

// ---
/*
function loop(time) {
  ctx.clearRect(0, 0, c.width, c.height);
  
  b.draw(c, ctx, time);
  
  //requestAnimationFrame(loop);
}


let b = new GAME.Board({size: 9, maxactions: 1000, players: [new GAME.Player({color: "#d82"}), new GAME.Player({color: "#28d"})]});
let c = document.querySelector(".board canvas");
c.width = 600;
c.height = 600;
let ctx = c.getContext("2d");
b.place(2, 0, 0, 0);
b.place(2, 1, 0, 1);
b.place(2, 2, 0, 2);
b.place(2, 3, 1, 0, {u: 1, v: 0});
b.place(2, 4, 1, 1, {u: 1, v: 0});
b.place(2, 5, 1, 2, {u: 1, v: 0});
b.place(2, 6, -1, -1);
b.nextTurn();
b.place(1, 0, 0, 0);
b.place(1, 1, 0, 1);
b.place(1, 2, 0, 2);
b.place(1, 3, 1, 0, {u: -1, v: 2});
b.place(1, 4, 1, 1, {u: -1, v: 2});
b.place(1, 5, 1, 2, {u: -1, v: 2});
b.place(1, 6, -1, -1);
loop();
console.log(b);
*/