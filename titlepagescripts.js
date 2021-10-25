const COLORS = {
  players: [
    {
      name: "Orange",
      main: "#ff7400",
      highlight: "#ff963f88"
    },
    {
      name: "Blue",
      main: "#008bff",
      highlight: "#49a0e888"
    },
    {
      name: "Pink",
      main: "#fa27c0",
      highlight: "#dc56b8"
    },
    {
      name: "Green",
      main: "#008a21",
      highlight: "#3fab59"
    },
    {
      name: "Yellow",
      main: "#eae14f",
      highlight: "#f3ed8688"
    }
  ]
};

let BOARDSIZE = Math.min( Math.max( Math.round( +( sessionStorage.getItem( "LATTICE::boardsize" ) ?? 9 ) ), 2 ), 25 );
document.querySelector( ".boardsizeinput" ).value = BOARDSIZE;
let PLAYERS = Math.min( Math.max( Math.round( +( sessionStorage.getItem( "LATTICE::players" ) ?? 2 ) ), 2 ), 5 );
document.querySelector( ".playersinput" ).value = PLAYERS;
let STARTINGAP = Math.min( Math.max( Math.round( +( sessionStorage.getItem( "LATTICE::ap" ) ?? 2 ) ), 2 ), 100 );
document.querySelector( ".apinput" ).value = STARTINGAP;

let VICTORY = Math.min( Math.max( Math.round( +( sessionStorage.getItem( "LATTICE::victory" ) ?? -1 ) ), -1 ), 5 );
if ( VICTORY !== -1 ) {
  let winnerdisp = document.querySelector( ".winnerdisp" );
  winnerdisp.innerText = COLORS.players[ VICTORY ].name;
  winnerdisp.style.color = COLORS.players[ VICTORY ].main;
  document.querySelector( "h2" ).style.display = "";
  sessionStorage.removeItem( "LATTICE::victory" );
}

function setBoardSize( elem ) {
  BOARDSIZE = Math.min( Math.max( Math.round( +elem.value ), 2 ), 25 );
}

function setPlayers( elem ) {
  PLAYERS = Math.min( Math.max( Math.round( +elem.value ), 2 ), 5 );
}

function setAp( elem ) {
  STARTINGAP = Math.min( Math.max( Math.round( +elem.value ), 2 ), 100 );
}

function play( ) {
  let changes = [ ];
  if ( BOARDSIZE !== 9 ) changes.push( `boardsize=${ BOARDSIZE }` );
  if ( PLAYERS !== 2 ) changes.push( `players=${ PLAYERS }` );
  if ( STARTINGAP !== 2 ) changes.push( `ap=${ STARTINGAP }` );
  window.location = `${ window.location.protocol + "//" + window.location.host + window.location.pathname }play${ changes.length > 0 ? "?" + changes.join( "&" ) : "" }`;
}