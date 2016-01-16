var spacebrew;

// var lastX = 0;
// var lastY = 0;
var xvalues = [];
var yvalues = [];
function setup() {
  // put setup code here
  createCanvas(640, 480);

  // setup spacebrew
  spacebrew = new Spacebrew();

  // declare some pub/sub
  spacebrew.addSubscribe("x", "range", 0);
  spacebrew.addSubscribe("y", "range", 0);

  // add some listeners
  spacebrew.onRangeMessage( onRangeMessage );

  // connect!
  spacebrew.connect("sandbox.spacebrew.cc", 9000, "p5 drawing app");

  noFill();
  strokeWeight( 2 );
  stroke( 0 );
  background( 255 );
}

function draw() {
  var num_lines = Math.max( xvalues.length, yvalues.length );
  
  for( var i = 0; i < num_lines-1; i++ ) {
    // use lerp to smooth out the lines if you want it.
    // var x1 = xvalues[i];
    // var x3 = xvalues[i+1];
    // var x2 = lerp( x1, x3, .5 );
    // var y1 = yvalues[i];
    // var y3 = yvalues[i+1];
    // var y2 = lerp( y1, y3, .5 );
    // line( x1, y1, x2, y2 );
    // line( x2, y2, x3, y3 );

    // regular line drawing
    line( xvalues[i], yvalues[i], xvalues[i+1], yvalues[i+1] );
  }
}

function onRangeMessage( name, value ) {
  if( name == "x" ) {
    xvalues.push( map( value, 0, 1024, 0, 640 ) );
  } else if( name == "y" ) {
    yvalues.push( map( value, 0, 1024, 0, 480 ) );
  }
}