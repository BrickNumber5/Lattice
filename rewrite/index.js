import * as GAME from "./gamelogic.js";
import * as UTIL from "./util.js";
import * as UI from "./ui.js";

const allplayers = [
  new GAME.Player({name: "Orange", color: "#d82"}),
  new GAME.Player({name: "Blue",   color: "#28d"}),
  new GAME.Player({name: "Pink",   color: "#d88"}),
  new GAME.Player({name: "Yellow", color: "#bb2"}),
  new GAME.Player({name: "Green",  color: "#2b3"})
];

let board = new GAME.Board({size: 9, maxactions: 3, players: allplayers.slice(0, 2)});

UI.setBoard(board);

{
  let size;
  let players;
  let actions;
  UI.addMenu(new UI.Menu("Lattice", "#menu", [
    new UI.SubMenu("New Game", [
      size = new UI.NumberInput("Board Size", 4, 25, 9),
      players = new UI.NumberInput("Players", 2, 5, 2),
      actions = new UI.NumberInput("Actions/Turn", 2, 10, 3),
      new UI.Button("Start", () => {
        board = new GAME.Board({size: size.value, maxactions: actions.value, players: allplayers.slice(0, players.value)});
        UI.setBoard(board);
        UI.closeMenu();
      })
    ])
  ]));
}