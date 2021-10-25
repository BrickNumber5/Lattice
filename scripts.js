// Lattice Game Main Script

const urlParams = new URLSearchParams( window.location.search );

const BOARDSIZE = Math.min( Math.max( Math.round( +( urlParams.get( "boardsize" ) ?? 9 ) ), 2 ), 25 );
let edgeSize;

const PLAYERS = Math.min( Math.max( Math.round( +( urlParams.get( "players" ) ?? 2 ) ), 2 ), 5 );
let turn = 0;

let turnNumber = 0;

const STARTINGAP = Math.min( Math.max( Math.round( +( urlParams.get( "ap" ) ?? 2 ) ), 2 ), 100 );
let ap = STARTINGAP;

{
  let apdisp = document.querySelector( ".apdisp" );
  apdisp.innerText = STARTINGAP;
  
  document.querySelector( ".apmax" ).innerText = STARTINGAP;
}

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
    }
  ]
};

let LATTICE;

let hoveredNode = null;
let selectedNode = null;
let editingNode = null;

const cnv = document.querySelector( ".main" );
const ctx = cnv.getContext( "2d" );

let width;
let height

function setCanvasSize( ) {
  cnv.width  = width  = window.innerWidth;
  cnv.height = height = window.innerHeight;
  edgeSize = Math.min( width, height ) / ( BOARDSIZE + 1 );
  LATTICE?.nodes?.forEach( node => node.calculateScreenPos( ) );
}

setCanvasSize( );

window.onresize = setCanvasSize;

const NEIGHBORDIRECTIONS = [
  { x: -1, y:  1, z:  0 },
  { x: -1, y:  0, z:  1 },
  { x:  1, y: -1, z:  0 },
  { x:  0, y: -1, z:  1 },
  { x:  1, y:  0, z: -1 },
  { x:  0, y:  1, z: -1 }
];

function coordinate( vector ) {
  const { x, y, z } = vector;
  return x + "|" + y + "|" + z;
}

function screenPos( vector ) {
  let { x, y, z } = vector;
  x -= ( BOARDSIZE - 1 ) / 2 + ( BOARDSIZE - 1 ) / 4;
  y += ( BOARDSIZE - 1 ) / 4;
  z += ( BOARDSIZE - 1 ) / 2;
  return {
    x: ( width  / 2 ) + edgeSize * ( x * Math.cos( 2 * Math.PI / 6 ) + y * Math.cos( 2 * Math.PI / 3 ) ),
    y: ( height / 2 ) - edgeSize * ( x * Math.sin( 2 * Math.PI / 6 ) + y * Math.sin( 2 * Math.PI / 3 ) )
  };
}

class Piece {
  constructor( node, range, type, owner, target = null ) {
    this.node = node;
    this.range = range; // 0 - Short, 1 - Long, -1 - Neutral
    this.type = type; // 0 - Offensive, 1 - Defensive, 2 - Supporting, -1 - Neutral
    this.owner = owner;
    this.target = target; // For long range pieces only
    
    this.targets = new Set( );
    this.targettedBy = new Set( );
  }
  getTargetVectorInWorldSpace( ) {
    const { x, y, z } = this.target;
    const wx = x * Math.cos( 2 * Math.PI / 6 ) + y * Math.cos( 2 * Math.PI / 3 );
    const wy = x * Math.sin( 2 * Math.PI / 6 ) + y * Math.sin( 2 * Math.PI / 3 );
    const invlen = 1 / Math.sqrt( wx ** 2 + wy ** 2 );
    return { x: wx * invlen, y: -wy * invlen };
  }
  drawAnnotations( ) {
    ctx.strokeStyle = COLORS.players[ this.owner ].main;
    ctx.lineWidth = Math.floor( edgeSize / 15 );
    if ( this.range === 0 ) {
      ctx.beginPath( );
      ctx.arc( this.node.screenpos.x, this.node.screenpos.y, edgeSize, 0, 2 * Math.PI )
      ctx.stroke( );
    } else if ( this.range === 1 && this.target !== null ) {
      let wv = this.getTargetVectorInWorldSpace( );
      let dist = 2 * Math.max( width, height );
      ctx.beginPath( );
      ctx.moveTo( this.node.screenpos.x, this.node.screenpos.y );
      ctx.lineTo( this.node.screenpos.x + wv.x * dist, this.node.screenpos.y + wv.y * dist );
      ctx.stroke( );
    }
  }
  drawPiece( ) {
    ctx.fillStyle = COLORS.players[ this.owner ].main;
    ctx.strokeStyle = COLORS.players[ this.owner ].main;
    let { x, y } = this.node.screenpos;
    if ( this.type === 0 ) {
      ctx.beginPath( );
      ctx.moveTo( x, y + edgeSize / 6 );
      ctx.lineTo( x + edgeSize * Math.cos( -Math.PI / 6 ) / 6, y + edgeSize * Math.sin( -Math.PI / 6 ) / 6 );
      ctx.lineTo( x - edgeSize * Math.cos( -Math.PI / 6 ) / 6, y + edgeSize * Math.sin( -Math.PI / 6 ) / 6 );
      ctx.moveTo( x, y - edgeSize / 6 );
      ctx.lineTo( x - edgeSize * Math.cos( -Math.PI / 6 ) / 6, y - edgeSize * Math.sin( -Math.PI / 6 ) / 6 );
      ctx.lineTo( x + edgeSize * Math.cos( -Math.PI / 6 ) / 6, y - edgeSize * Math.sin( -Math.PI / 6 ) / 6 );
      ctx.fill( );
    } else if ( this.type === 1 ) {
      ctx.beginPath( );
      ctx.moveTo( x, y + edgeSize / 6 );
      ctx.lineTo( x + edgeSize / 6, y );
      ctx.lineTo( x, y - edgeSize / 6 );
      ctx.lineTo( x - edgeSize / 6, y );
      ctx.fill( );
    } else if ( this.type === 2 ) {
      ctx.beginPath( );
      ctx.arc( x, y, edgeSize / 6, 0, 2 * Math.PI );
      ctx.fill( );
    } else if ( this.type === -1 ) {
      ctx.lineWidth = Math.floor( edgeSize / 15 );
      ctx.beginPath( );
      ctx.arc( x, y, edgeSize / 8, 0, 2 * Math.PI );
      ctx.stroke( );
    }
    
    if ( this.range === 1 && this.target !== null ) {
      let wv = this.getTargetVectorInWorldSpace( );
      ctx.beginPath( );
      ctx.arc( this.node.screenpos.x + edgeSize * wv.x / 3, this.node.screenpos.y + edgeSize * wv.y / 3, edgeSize / 8, 0, 2 * Math.PI );
      ctx.fill( );
    }
  }
  calculateTargets( ) {
    this.targettedBy.clear( );
    let targets = new Set( );
    if ( this.range === 0 ) {
      this.targets = this.node.neighbors.forEach( node => { if ( node.piece ) targets.add( node.piece ); } );
    } else if ( this.range === 1 && this.target !== null ) {
      let p = { x: this.node.x, y: this.node.y, z: this.node.z };
      while ( Math.abs( p.x ) < BOARDSIZE && Math.abs( p.y ) < BOARDSIZE && Math.abs( p.z ) < BOARDSIZE ) {
        p.x += this.target.x;
        p.y += this.target.y;
        p.z += this.target.z;
        let n = this.node.lattice.getNodeAt( p );
        if ( n && n.piece ) {
          targets.add( n.piece );
          break;
        }
      }
    }
    this.targets = targets;
  }
  calculateSupport( exclude = null ) {
    exclude ??= new Set( );
    let support = 0n;
    this.targettedBy.forEach( piece => {
      if ( piece.type === 2 && !exclude.has( piece ) ) {
        exclude.add( piece );
        support += 2n * piece.calculateSupport( exclude ) + 1n;
      }
    } );
    return support;
  }
}

class Node {
  constructor( lattice, x, y, z ) {
    this.lattice = lattice;
    this.x = x;
    this.y = y;
    this.z = z;
    this.piece = null;
    this.calculateScreenPos( );
  }
  getNeighborVectors( ) {
    const { x, y, z } = this;
    return NEIGHBORDIRECTIONS.map( dir => ( { x: x + dir.x, y: y + dir.y, z: z + dir.z } ) );
  }
  findNeighbors( ) {
    const { lattice } = this;
    this.neighbors = new Set(
      this.getNeighborVectors( ).map( vec => lattice.getNodeAt( vec ) ).filter( neighbor => neighbor != undefined )
    );
  }
  calculateScreenPos( ) {
    this.screenpos = screenPos( this );
  }
}

class Lattice {
  constructor( ) {
    this.nodes = new Map( );
    
    for ( let i = 0; i < BOARDSIZE; i++ ) {
      for ( let j = 0; j < BOARDSIZE - i; j++ ) {
        let v = { x: i + j, y: -j, z: -i };
        this.nodes.set( coordinate( v ), new Node( this, v.x, v.y, v.z ) );
      }
    }
    
    this.nodes.forEach( node => node.findNeighbors( ) );
  }
  getNodeAt( vector ) {
    return this.nodes.get( coordinate( vector ) );
  }
  draw( ) {
    ctx.fillStyle = "black";
    ctx.strokeStyle = "white";
    // Edges
    this.nodes.forEach( node => {
      node.neighbors.forEach( neighbor => {
        ctx.beginPath( );
        ctx.moveTo( node.screenpos.x, node.screenpos.y );
        ctx.lineTo( neighbor.screenpos.x, neighbor.screenpos.y );
        ctx.stroke( );
      } );
    } );
    // Piece Annotations
    this.nodes.forEach( node => {
      node?.piece?.drawAnnotations?.( );
    } );
    // Darken cells
    this.nodes.forEach( node => {
      ctx.beginPath( );
      ctx.arc( node.screenpos.x, node.screenpos.y, edgeSize / 4, 0, 2 * Math.PI );
      ctx.fill( );
      ctx.stroke( );
    } );
    // Pieces
    this.nodes.forEach( node => {
      node?.piece?.drawPiece?.( );
    } );
    // Hover
    if ( hoveredNode ) {
      ctx.fillStyle = COLORS.players[ turn ].highlight;
      ctx.beginPath( );
      ctx.arc( hoveredNode.screenpos.x, hoveredNode.screenpos.y, edgeSize / 4, 0, 2 * Math.PI );
      ctx.fill( );
    }
    // Cell Borders
    ctx.strokeStyle = "white";
    ctx.lineWidth = Math.floor( edgeSize / 15 );
    this.nodes.forEach( node => {
      ctx.beginPath( );
      ctx.arc( node.screenpos.x, node.screenpos.y, edgeSize / 4, 0, 2 * Math.PI );
      if ( node === selectedNode || node === editingNode ) {
        ctx.strokeStyle = COLORS.players[ turn ].main;
        ctx.stroke( );
        ctx.strokeStyle = "white";
      } else {
        ctx.stroke( );
      }
    } );
    // Popup
    if ( selectedNode && selectedNode.piece === null ) {
      let v = { x: selectedNode.x, y: selectedNode.y, z: selectedNode.z };
      let { x, y } = selectedNode.screenpos;
      ctx.fillStyle = "#333";
      ctx.beginPath( );
      ctx.moveTo( x + 3 * edgeSize / 2, y );
      ctx.lineTo( x + 3 * edgeSize * Math.cos( Math.PI / 3 ) / 2, y + 3 * edgeSize * Math.sin( Math.PI / 3 ) / 2 );
      ctx.lineTo( x + 3 * edgeSize * Math.cos( 2 * Math.PI / 3 ) / 2, y + 3 * edgeSize * Math.sin( 2 * Math.PI / 3 ) / 2 );
      ctx.lineTo( x - 3 * edgeSize / 2, y );
      ctx.lineTo( x + 3 * edgeSize * Math.cos( 4 * Math.PI / 3 ) / 2, y + 3 * edgeSize * Math.sin( 4 * Math.PI / 3 ) / 2 );
      ctx.lineTo( x + 3 * edgeSize * Math.cos( 5 * Math.PI / 3 ) / 2, y + 3 * edgeSize * Math.sin( 5 * Math.PI / 3 ) / 2 );
      ctx.fill( );
      // Pieces
      (new Piece( { screenpos: screenPos( { x: v.x, y: v.y, z: v.z } ) }, -1, -1, turn )).drawPiece( );
      if ( ap > 1 ) {
        (new Piece( { screenpos: screenPos( { x: v.x, y: v.y + 1, z: v.z - 1 } ) }, 0, 0, turn )).drawPiece( );
        (new Piece( { screenpos: screenPos( { x: v.x + 1, y: v.y, z: v.z - 1 } ) }, 0, 1, turn )).drawPiece( );
        (new Piece( { screenpos: screenPos( { x: v.x + 1, y: v.y - 1, z: v.z } ) }, 0, 2, turn )).drawPiece( );
        (new Piece( { screenpos: screenPos( { x: v.x, y: v.y - 1, z: v.z + 1 } ) }, 1, 0, turn, { x: 0, y: -1, z: 1 } )).drawPiece( );
        (new Piece( { screenpos: screenPos( { x: v.x - 1, y: v.y, z: v.z + 1 } ) }, 1, 1, turn, { x: 0, y: -1, z: 1 } )).drawPiece( );
        (new Piece( { screenpos: screenPos( { x: v.x - 1, y: v.y + 1, z: v.z } ) }, 1, 2, turn, { x: 0, y: -1, z: 1 } )).drawPiece( );
      }
      // Hover
      if ( hoveredNode ) {
        ctx.fillStyle = COLORS.players[ turn ].highlight;
        ctx.beginPath( );
        ctx.arc( hoveredNode.screenpos.x, hoveredNode.screenpos.y, edgeSize / 4, 0, 2 * Math.PI );
        ctx.fill( );
      }
    }
  }
}

LATTICE = new Lattice( );

function nextTurn( ) {
  selectedNode = null;
  editingNode = null;
  LATTICE.nodes.forEach( node => { node?.piece?.calculateTargets?.( ); } );
  LATTICE.nodes.forEach( node => { if ( node.piece ) node.piece.targets.forEach( target => target.targettedBy.add( node.piece ) ); } );
  LATTICE.nodes.forEach( node => { if ( node.piece ) node.piece.support = node.piece.calculateSupport( ); } );
  LATTICE.nodes.forEach( node => { if ( node.piece ) { node.piece.damage = 0n; node.piece.defense = 0n; } } );
  LATTICE.nodes.forEach( node => { if ( node.piece ) {
    if ( node.piece.type === 0 ) node.piece.targets.forEach( t => t.damage += node.piece.support );
    if ( node.piece.type === 1 ) node.piece.targets.forEach( t => t.defense += node.piece.support );
  } } );
  LATTICE.nodes.forEach( node => { if ( node.piece && node.piece.damage > node.piece.defense ) node.piece = null; } );
  let points = Array.from( { length: PLAYERS }, ( ) => 0 );
  LATTICE.nodes.forEach( node => { if ( node.piece ) points[ node.piece.owner ]++; } );
  
  ap = STARTINGAP;
  turn++;
  if ( turn >= PLAYERS ) {
    turn %= PLAYERS;
    turnNumber++;
  }
  
  let playerdisp = document.querySelector( ".playerdisp" );
  playerdisp.innerText = COLORS.players[ turn ].name;
  playerdisp.style.color = COLORS.players[ turn ].main;
  
  let apdisp = document.querySelector( ".apdisp" );
  apdisp.innerText = STARTINGAP;
  apdisp.style.color = COLORS.players[ turn ].main;
  
  let turndisp = document.querySelector( ".turndisp" );
  turndisp.innerText = turnNumber + 1;
  turndisp.style.color = COLORS.players[ turn ].main;
}

function loop( time ) {
  ctx.fillStyle = "black";
  ctx.fillRect( 0, 0, width, height );
  LATTICE.draw( );
  requestAnimationFrame( loop );
}

requestAnimationFrame( loop );

window.onmousemove = e => {
  let x = e.clientX;
  let y = e.clientY;
  hoveredNode = null;
  if ( selectedNode === null || selectedNode.piece !== null ) {
    LATTICE?.nodes?.forEach( node => {
      if ( ( x - node.screenpos.x ) ** 2 + ( y - node.screenpos.y ) ** 2 <= ( edgeSize / 2 ) ** 2 ) {
        hoveredNode = node;
      }
    } );
  } else {
    let { x: nx, y: ny, z: nz } = selectedNode;
    if ( ap > 1 ) {
      NEIGHBORDIRECTIONS.forEach( neighbor => {
        let sp = screenPos( { x: nx + neighbor.x, y: ny + neighbor.y, z: nz + neighbor.z } );
        if ( ( x - sp.x ) ** 2 + ( y - sp.y ) ** 2 <= ( edgeSize / 2 ) ** 2 ) {
          hoveredNode = { screenpos: sp };
        }
      } );
    }
    let sp = screenPos( { x: nx, y: ny, z: nz } );
    if ( ( x - sp.x ) ** 2 + ( y - sp.y ) ** 2 <= ( edgeSize / 2 ) ** 2 ) {
      hoveredNode = { screenpos: sp };
    }
  }
};

window.onclick = e => {
  let x = e.clientX;
  let y = e.clientY;
  if ( selectedNode || editingNode ) {
    if ( editingNode ) {
      selectedNode = editingNode;
    }
    if ( selectedNode.piece ) {
      let newNode = null;
      LATTICE?.nodes?.forEach( node => {
        if ( ( x - node.screenpos.x ) ** 2 + ( y - node.screenpos.y ) ** 2 <= ( edgeSize / 2 ) ** 2 ) {
          newNode = node;
        }
      } );
      if ( newNode ) {
        if ( selectedNode.piece.range === 0 ) {
          if ( selectedNode.neighbors.has( newNode ) && newNode.piece === null ) {
            ap--;
            updateApDisp( );
            newNode.piece = selectedNode.piece;
            selectedNode.piece = null;
            newNode.piece.node = newNode;
          }
        } else if ( selectedNode.piece.range === 1 ) {
          if ( editingNode === null ) {
            ap--;
            updateApDisp( );
          }
          if ( selectedNode === newNode ) {
            selectedNode.piece.target = null;
          } else {
            let sv = { x: selectedNode.x, y: selectedNode.y, z: selectedNode.z };
            let nv = { x: newNode.x, y: newNode.y, z: newNode.z };
            let tv = { x: nv.x - sv.x, y: nv.y - sv.y, z: nv.z - sv.z };
            let m = gcd( gcd( tv.x, tv.y ), tv.z );
            if ( m > 1 ) {
              tv.x /= m;
              tv.y /= m;
              tv.z /= m;
            }
            selectedNode.piece.target = tv;
          }
          editingNode = null;
        }
      }
    } else {
      let { x: nx, y: ny, z: nz } = selectedNode;
      let clicked = -1;
      if ( ap > 1 ) {
        NEIGHBORDIRECTIONS.forEach( ( neighbor, i ) => {
          let sp = screenPos( { x: nx + neighbor.x, y: ny + neighbor.y, z: nz + neighbor.z } );
          if ( ( x - sp.x ) ** 2 + ( y - sp.y ) ** 2 <= ( edgeSize / 2 ) ** 2 ) {
            clicked = i;
          }
        } );
      }
      let sp = screenPos( { x: nx, y: ny, z: nz } );
      if ( ( x - sp.x ) ** 2 + ( y - sp.y ) ** 2 <= ( edgeSize / 2 ) ** 2 ) {
        clicked = 6;
      }
      if ( clicked !== -1 ) {
        if ( clicked === 6 ) {
          ap--;
          updateApDisp( );
          selectedNode.piece = new Piece( selectedNode, -1, -1, turn );
        } else {
          ap -= 2;
          updateApDisp( );
          if ( clicked === 5 || clicked === 4 || clicked === 2 ) {
            selectedNode.piece = new Piece( selectedNode, 0, [ 5, 4, 2 ].indexOf( clicked ), turn );
          } else {
            selectedNode.piece = new Piece( selectedNode, 1, [ 3, 1, 0 ].indexOf( clicked ), turn );
            editingNode = selectedNode;
          }
        }
      }
    }
    selectedNode = null;
  } else {
    selectedNode = null;
    if ( ap > 0 ) {
      LATTICE?.nodes?.forEach( node => {
        if ( ( x - node.screenpos.x ) ** 2 + ( y - node.screenpos.y ) ** 2 <= ( edgeSize / 2 ) ** 2 ) {
          if ( node.piece === null || ( node.piece.owner === turn && node.piece.type !== -1 ) ) {
            selectedNode = node;
          }
        }
      } );
    }
  }
};

function updateApDisp( ) {
  document.querySelector( ".apdisp" ).innerText = ap;
}

function gcd( a, b ) {
  if ( b ) {
    return gcd( b, a % b );
  } else {
    return Math.abs( a );
  }
}