import * as GAME from "./gamelogic.js";
import * as UTIL from "./util.js";

window.GAME = GAME;
window.UTIL = UTIL;

// ---
function loop(time) {
  ctx.clearRect(0, 0, c.width, c.height);
  
  b.draw(c, ctx, time);
  
  requestAnimationFrame(loop);
}


let b = new GAME.Board({size: 9, maxactions: 2, players: [new GAME.Player({color: "#d82"}), new GAME.Player({color: "#2dd"})]});
let c = document.querySelector(".board");
c.width = 600;
c.height = 600;
let ctx = c.getContext("2d");
b.at(2, 3).place(0, 0, 0);
b.at(1, 3).place(0, 0, 0);
b.at(2, 2).place(1, 0, 0);
b.at(3, 3).place(1, 1, 1, {u: -2, v: -2});
loop();
console.log(b);