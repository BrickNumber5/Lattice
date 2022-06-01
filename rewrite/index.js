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


let b = new GAME.Board({size: 9, maxactions: 2, players: [new GAME.Player({color: "#d82"}), new GAME.Player({color: "#28d"})]});
let c = document.querySelector(".board");
c.width = 600;
c.height = 600;
let ctx = c.getContext("2d");
b.at(2, 0).place(0, 0, 0);
b.at(2, 1).place(0, 0, 1);
b.at(2, 2).place(0, 0, 2);
b.at(2, 3).place(0, 1, 0, {u: 1, v: 0});
b.at(2, 4).place(0, 1, 1, {u: 1, v: 0});
b.at(2, 5).place(0, 1, 2, {u: 1, v: 0});
b.at(2, 6).place(0, -1, -1);
b.at(1, 0).place(1, 0, 0);
b.at(1, 1).place(1, 0, 1);
b.at(1, 2).place(1, 0, 2);
b.at(1, 3).place(1, 1, 0, {u: -1, v: 2});
b.at(1, 4).place(1, 1, 1, {u: -1, v: 2});
b.at(1, 5).place(1, 1, 2, {u: -1, v: 2});
b.at(1, 6).place(1, -1, -1);
loop();
loop();
console.log(b);