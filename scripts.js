// Lattice Game Main Script

const BOARDSIZE = 9;

const cnv = document.querySelector( ".main" );
const ctx = cnv.getContext( "2d" );

let width;
let height

function setCanvasSize ( ) {
  cnv.width  = width  = window.innerWidth;
  cnv.height = height = window.innerHeight;
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
}

const LATTICE = new Lattice( );

function loop( time ) {
  
  requestAnimationFrame( loop );
}

requestAnimationFrame( loop );