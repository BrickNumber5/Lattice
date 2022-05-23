import * as GAME from "./gamelogic.js";
import * as UTIL from "./util.js";

window.GAME = GAME;
window.UTIL = UTIL;

let b = new GAME.Board(9);
let c = document.querySelector(".board");
c.width = 600;
c.height = 600;
let ctx = c.getContext("2d");
b.draw(c, ctx, 0);