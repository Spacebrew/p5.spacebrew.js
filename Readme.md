
Spacebrew for P5.js
===============

This repo contains the [Spacebrew](http://docs.spacebrew.cc/) Library for [p5.js](http://p5js.org) along with documentation and example apps.
  
About
----
Spacebrew makes it easy to connect multiple P5.js instances over the internet. It can also connect P5.js sketches to other platforms such as Processing, Arduino, Unity, Javascript, OpenFrameworks, Cinder and others. 

In a nutshell: you could have P5 sketches running on different devices (computer & phone, for example) and have them talk to each other in real time.

[Learn more about Spacebrew here.](http://docs.spacebrew.cc/)

How does it work?
----
Every spacebrew instance is either a sender or a subscriber of data. Senders send data, subscribers receive data. You can also have a P5.js sketch be both a sender and subscriber of data.

Spacebrew P5.js instances are published to a Spacebrew server, where they can be connected together. All the examples in this repository use the [Spacebrew Sandbox](http://spacebrew.github.io/spacebrew/admin/admin.html?server=sandbox.spacebrew.cc) server. The Sandbox server is the only public Spacebrew server for the whole world, so it can become a little slow if there are too many connections. If you want to heavily use Spacebrew, it's better to run your own server, either locally or on the cloud. You can find more about how to do it [here](https://github.com/Spacebrew/spacebrew).


Using the P5.js Library
----
  
1. Add the p5.spacebrew.js file from this repo to your P5 folder.
2. Add the p5.spacebrew.js script code to your index.html.

	```
	<!doctype html>
	<html>
	<head>
  		<script src="p5.js">
  		<script src="p5.spacebrew.js">
  		<script src="sketch.js">
	</head>
	<body>
	</body>
	</html>
	```
3. Set up Spacebrew in your sketch.js file.
	
	```
	 spacebrew = new Spacebrew();
	```
4. Add a publisher. There are 3 data types on Spacebrew: boolean (true or false), range (a value between 0-1023) and string (text). the format for adding a publisher is defining the instance name and its type. You can only connect instances that have the same data type. You can optionally add a 3rd parameter which is the default value on that feed.

	```
	spacebrew.addPublish("button", "boolean", 0);
	```

5. Add a subscriber. Same rules apply.

	```
	spacebrew.addSubscribe("background", "boolean", 0);
	```
6. Add a listener function to your subscriber event.
	
	```
	spacebrew.onBooleanMessage( onBooleanMessage );
	```
7. Connect to Spacebrew!
	
	```
	spacebrew.connect("sandbox.spacebrew.cc", 9000, "p5.js button ");	
	```
8. Send some data through your Spacebrew sender.
	
	```
	// create a p5 button
	button = createButton('Press Me!');
	button.position(10, 100);
	button.mousePressed(sendTrue);
	button.mouseReleased(sendFalse);
	
	// sending data to Spacebrew
	function sendTrue(){
		spacebrew.send("button", "boolean", "true");
	}
		
	function sendFalse(){
		spacebrew.send("button", "boolean", "false");
	}
	
	```
9. Give some instructions to your listener.

	```
	function onBooleanMessage( name, value ){
		if ( value == "true"){
			// set the background to black
			document.body.style.backgroundColor = "#000";
		} else {
			// set it white
			document.body.style.backgroundColor = "#fff";
		}
	}
	```
10. Open your index.html file on your browser. Go to the [Sandbox Server](http://spacebrew.github.io/spacebrew/admin/admin.html?server=sandbox.spacebrew.cc) and connect your Sender to your Subscriber. Enjoy the magic.

License  
----
  
The MIT License (MIT)  
Copyright © 2012 LAB at Rockwell Group, http://www.rockwellgroup.com/lab  
  
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:  
  
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.  
  
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.  
