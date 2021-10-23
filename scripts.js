// Lattice Game Main Script

const BOARDSIZE = 9;
let edgeSize;

const PLAYERS = 2;
let turn = 0;

const COLORS = {
  players: [
    {
      light: "#ff7400",
      dark: "#c45900",
      highlight: "#ff963f88"
    },
    {
      light: "#008bff",
      dark: "#0061b2",
      highlight: "#49a0e888"
    }
  ]
};

let LATTICE;

let hoveredNode = null;

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

class Node {
  constructor( lattice, x, y, z ) {
    this.lattice = lattice;
    this.x = x;
    this.y = y;
    this.z = z;
    this.calculateScreenPos( );
  }
  getNeighborVectors( ) {
    const { x, y, z } = this;
    return NEIGHBORDIRECTIONS.map( dir => ( { x: x + dir.x, y: y + dir.y, z: z + dir.z } ) );
  }
  findNeighbors( ) {
    const { lattice } = this;
    this.neighbors = new Map(
      this.getNeighborVectors( ).map( vec => [ coordinate( vec ), lattice.getNodeAt( vec ) ] ).filter( neighbor => neighbor[ 1 ] != undefined )
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
    ctx.lineWidth = Math.floor( edgeSize / 15 ); // Floored because non-integer stroke-weights create strange artifacts in Chrome and possibly other browsers
    this.nodes.forEach( node => {
      node.neighbors.forEach( neighbor => {
        ctx.beginPath( );
        ctx.moveTo( node.screenpos.x, node.screenpos.y );
        ctx.lineTo( neighbor.screenpos.x, neighbor.screenpos.y );
        ctx.stroke( );
      } );
    } );
    this.nodes.forEach( node => {
      ctx.beginPath( );
      ctx.arc( node.screenpos.x, node.screenpos.y, edgeSize / 4, 0, 2 * Math.PI );
      ctx.fill( );
      if ( node === hoveredNode ) {
        ctx.fillStyle = COLORS.players[ turn ].highlight;
        ctx.fill( );
        ctx.fillStyle = "black";
      }
      ctx.stroke( );
    } );
  }
}

LATTICE = new Lattice( );

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
  LATTICE?.nodes?.forEach( node => {
    if ( ( x - node.screenpos.x ) ** 2 + ( y - node.screenpos.y ) ** 2 <= ( edgeSize / 2 ) ** 2 ) {
      hoveredNode = node;
    }
  } );
};