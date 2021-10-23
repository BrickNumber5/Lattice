// Lattice Game Main Script

const BOARDSIZE = 9;
let edgeSize;

let LATTICE;

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
    let { x, y, z } = this;
    x -= 6;
    y += 2;
    z += 4;
    this.screenpos = {
      x: ( width  / 2 ) + edgeSize * ( x * Math.cos( 2 * Math.PI / 6 ) + y * Math.cos( 2 * Math.PI / 3 ) ),
      y: ( height / 2 ) - edgeSize * ( x * Math.sin( 2 * Math.PI / 6 ) + y * Math.sin( 2 * Math.PI / 3 ) )
    };
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
    ctx.lineWidth = Math.floor( edgeSize / 10 ); // Floored because non-integer stroke-weights create strange artifacts in Chrome and possibly other browsers
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
      ctx.arc( node.screenpos.x, node.screenpos.y, edgeSize / 4, 0, 2 * Math.PI )
      ctx.fill( );
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