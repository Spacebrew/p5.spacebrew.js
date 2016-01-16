var spacebrew;

var sounds = ["sounds/fart.m4a","sounds/toilet.m4a", "sounds/fart2.m4a", "sounds/fart3.m4a", "sounds/fart4.m4a", "sounds/fart5.m4a"];
var sfx = {};
function preload() {
  for( var i = 0; i < 5; i++ ) {
    sfx["butt"+i] = loadSound(sounds[i]);
  }
}

function setup() {
  // put setup code here
  createCanvas(600, 400);

  // setup spacebrew
  spacebrew = new Spacebrew();

  // declare some pub/sub
  for( var i = 0; i < 5; i++ ) {
    spacebrew.addSubscribe("butt"+i, "boolean", 0);  
  }

  // add some listeners
  spacebrew.onBooleanMessage( onBooleanMessage );

  // connect!
  spacebrew.connect("sandbox.spacebrew.cc", 9000, "p5 sound player ");

  // // create a p5 button
  // button = createButton('Press Me!');
  // button.position(10, 100);
  // button.mousePressed(sendTrue);
  // button.mouseReleased(sendFalse);
}

function draw() {
  // put drawing code here
}

function onBooleanMessage( name, value ) {
  console.log( name );
  sfx[name].play();
  // if( name == "play_sound" ) {
  //   if ( value == "true") {
  //     // set the background to black
  //     sfx.play();
  //   }    
  // }
}