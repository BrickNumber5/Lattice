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


let b = new GAME.Board(9);
let c = document.querySelector(".board");
c.width = 600;
c.height = 600;
let ctx = c.getContext("2d");
b.at(2, 3).place(0, 0, 0);
b.at(1, 3).place(0, 0, 0);
b.at(2, 2).place(0, 0, 0);
b.at(3, 3).place(0, 1, 1);
loop();