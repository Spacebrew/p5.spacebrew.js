var spacebrew;

var sfx;
function preload() {
  sfx = loadSound("sounds/sound_one.mp3");
}

function setup() {
  // put setup code here
  createCanvas(600, 400);

  // setup spacebrew
  spacebrew = new Spacebrew();

  // declare some pub/sub
  spacebrew.addPublish("button", "boolean");
  spacebrew.addSubscribe("background", "boolean", 0);

  // add some listeners
  spacebrew.onBooleanMessage( onBooleanMessage );

  // connect!
  spacebrew.connect("sandbox.spacebrew.cc", 9000, "p5.js button example");

  // create a p5 button
  button = createButton('Press Me!');
  button.position(10, 100);
  button.mousePressed(sendTrue);
  button.mouseReleased(sendFalse);
}

function draw() {
  // put drawing code here
}

function onBooleanMessage( name, value ){
	console.log("Got message! ", name, value );
	if ( value == "true"){
		// set the background to black
    sfx.play();
		document.body.style.backgroundColor = "#000";
	} else {
		// set it white
		document.body.style.backgroundColor = "#fff";
	}
}

// send to spacebrew
function sendTrue(){
	spacebrew.send("button", "boolean", "true");
}

function sendFalse(){
	spacebrew.send("button", "boolean", "false");
}