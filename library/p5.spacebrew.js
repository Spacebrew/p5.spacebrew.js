/**
 *
 * Spacebrew Library for P5.js
 * --------------------------------
 *
 * This library was designed to work on front-end (browser) envrionments using P5.js. 
 * Please refer to the readme file, the documentation and examples to learn how to
 * use this library.
 *
 * Spacebrew is an open, dynamically re-routable software toolkit for choreographing interactive
 * spaces. Or, in other words, a simple way to connect interactive things to one another. Learn
 * more about Spacebrew here: http://docs.spacebrew.cc/
 *
 * To import into your web apps, we recommend using the minimized version of this library.
 *
 * @author		Brett Renfer
 * @filename	p5.spacebrew.js
 * @version		1.0
 * @date		October 22, 2014
 *
 */

var SpacebrewMessage = function(){
	this.name 		= "";
	this.type 		= "";
	this._default 	= "";
	this.value 		= "";
}

/**
 * [Spacebrew description]
 */
var Spacebrew = function () {

	var self = this;

	/**
	 * Name of your app as it will appear in the Spacebrew admin.
	 * @type {String}
	 */
	this.name = "";

	/**
	 * What does your app do?
	 * @type {String}
	 */
	this.description = "";

	/**
	 * How loud to be (mutes debug messages)
	 * @type {Boolean}
	 */
	this.verbose = false;

	/**
	 * Location of spacebrew server
	 * @type {String}
	 */
	var hostname = "sandbox.spacebrew.cc";

	/** Spacebrew built-in port */
	var port = 9000;

	// attached to methods in sb app
	var onRangeMessageMethod 	= null;
	var onStringMessageMethod 	= null;
	var onBooleanMessageMethod 	= null; 
	var onCustomMessageMethod 	= null;
	var onOpenMethod			= null;
	var onCloseMethod			= null;
	
	/**
	 * @type {WebSocket}
	 */
	var wsClient 		= null;

	// state
	var connectionEstablished = false;
	var connectionRequested = false;

	// auto-reconnect
	var reconnectAttempt = 0;
	var reconnectInterval = 5000;

	// vars for config, publishers + subscriber
	var tConfig 	= {};
	var nameConfig 	= {};

	var publishes 	= [];
	var subscribes 	= [];

	// callback methods
	//private HashMap<String, HashMap<String, Method>> 
	var callbacks = {};

	/**
	 * Setup a custom or integer-based publisher
	 * @param {String}  name of route
	 * @param {String}  type of route ("range", "boolean", or "string")
	 * @param {Boolean} default starting value
	 */
	this.addPublish = function( name, type, _default ){
		var m = new SpacebrewMessage();
		m.name = name; 
		m.type = type; 
		m._default = _default !== undefined ? typeof(_default) !== "string" ? _default.toString(): _default : "";
		publishes.push(m);
		if ( connectionEstablished ) updatePubSub();
	}

  
	/**
	 * Add a subscriber. Note: right now this just adds to the message sent onopen;
	 * in the future, could be something like name, type, default, callback
	 * @param {String}  name of route
	 * @param {String}  type of route ("range", "boolean", or "string")
	 */
	this.addSubscribe = function( name, type ){
		var m = new SpacebrewMessage();
		m.name = name;
		m.type = type;
		subscribes.push(m);
		if ( connectionEstablished ) updatePubSub();
	}

	/**
	 * Connect to Spacebrew admin.
	 * @param {String} _hostname URL to Spacebrew host
	 * @param {Number} _port Port of Spacebrewhost. Usually 9000
	 * @param {String} _name Name of your app as it will appear in the Spacebrew admin
	 * @param {String} _description What does your app do?
	 */
	this.connect = function( _hostname, _port, _name, _description ){
		self.name = _name;
		self.description = _description;
		hostname = _hostname;
		port = _port;
		connectionRequested = true;

		if ( self.verbose ) console.log("[Spacebrew::connect] connecting to spacebrew "+ hostname);
		wsClient = new WebSocket( "ws://" + hostname + ":" + port );  
		wsClient.onopen = onOpen.bind(this);
		wsClient.onclose = onClose.bind(this);
		wsClient.onmessage = onMessage.bind(this);
		updatePubSub();
	}

	/**
	 * Close the connection to spacebrew
	 */
	this.close = function() {
		if (connectionEstablished) {
			wsClient.close();
		}
		connectionRequested = false;
	}

	// attach to functions on your sketch

	/**
	 * Add a listener to the 'onRangeMessage' event
	 * @param  {Function} fxn Function following this format: 
	 *                      function NAME_OF_FUNCTION( name, value ){}
	 * @return {Spacebrew}
	 */
	this.onRangeMessage = function( fxn ){
	    var f = function (e) { fxn(e.detail.name, e.detail.value); };
		document.addEventListener('onRangeMessage', f, false);
		return this;
	}

	/**
	 * Add a listener to the 'onStringMessage' event
	 * @param  {Function} fxn Function following this format: 
	 *                      function NAME_OF_FUNCTION( name, value ){}
	 * @return {Spacebrew}
	 */
	this.onStringMessage = function( fxn ){
	    var f = function (e) { fxn(e.detail.name, e.detail.value); };
		document.addEventListener('onStringMessage', f, false);
		return this;
	}

	/**
	 * Add a listener to the 'onBooleanMessage' event
	 * @param  {Function} fxn Function following this format: 
	 *                      function NAME_OF_FUNCTION( name, value ){}
	 * @return {Spacebrew}
	 */
	this.onBooleanMessage = function( fxn ){
	    var f = function (e) { fxn(e.detail.name, e.detail.value); };
		document.addEventListener('onBooleanMessage', f, false);
		return this;
	}
	
	/**
	 * Add a listener to the 'onCustomMessageEvent' event
	 * @param  {Function} fxn Function following this format: 
	 *                      function NAME_OF_FUNCTION( name, type, value ){}
	 * @return {Spacebrew}
	 */
	this.onCustomMessage = function( fxn ){
	    var f = function (e) { fxn(e.detail.name, e.detail.type, e.detail.value); };
		document.addEventListener('onCustomMessage', f, false);
		return this;
	}

	/**
	 * Add a listener to the 'onOpen' event
	 * @param  {Function} fxn Function following this format: 
	 *                      function NAME_OF_FUNCTION( ){}
	 * @return {Spacebrew}
	 */
	this.onOpen = function( fxn ){
	    var f = function (e) { fxn(); };
		document.addEventListener('onSbOpen', f, false);
		return this;
	}

	/**
	 * Add a listener to the 'onClose' event
	 * @param  {Function} fxn Function following this format: 
	 *                      function NAME_OF_FUNCTION( ){}
	 * @return {Spacebrew}
	 */
	this.onClose = function( fxn ){
	    var f = function (e) { fxn(); };
		document.addEventListener('onSbClose', f, false);
		return this;
	}

	/**
	 * Method that ensure that app attempts to reconnect to Spacebrew if the connection is lost.
	 * @private
	 */
	function pre() {
		// attempt to reconnect
		if (connectionRequested && !connectionEstablished) {
			if (millis() - reconnectAttempt > reconnectInterval) {
				if ( self.verbose ) console.log("[Spacebrew::pre] attempting to reconnect to Spacebrew");
				self.connect( hostname, port, self.name, self.description);
				reconnectAttempt = millis();
			}
		}
	}

	/**
	 * Update publishers and subscribers.
	 * @private
	 */
	function updatePubSub(){

		// LOAD IN PUBLISH INFO
		var publishers = [];

		for (var i=0, len=publishes.length; i<len; i++){
		    var m = publishes[i];
		    var pub = {
		    	"name": m.name,
		    	"type": m.type,
		    	"default": m._default
		    }	    

		    publishers.push(pub);      
		}
		  
		// LOAD IN SUBSCRIBE INFO
		var subscribers = [];
		  
		for (var i=0; i<subscribes.length; i++){
		    var m = subscribes[i];
		    var sub = {
		    	"name": m.name,
		    	"type": m.type
		    }
		    
		    subscribers.push(sub);      
		}

		tConfig.config = {
			name: self.name,
			description: self.description,
			subscribe: {
				messages: subscribers
			}, 
			publish: {
				messages: publishers
			}
		};

		if ( connectionEstablished ){
			wsClient.send( JSON.stringify( tConfig ) );
		}
	}
  
	/**
	 * Send a message along a specified Route
	 * @param {String} Name of Route
	 * @param {String} Type of Route ("boolean", "range", "string")
	 * @param {String} What you're sending
	 */
	this.send = function( messageName, type, value ){
		var m = {
			message: {
				clientName: self.name,
				name: messageName,
				type: type,
				value: value
			}
		};

		if ( connectionEstablished ) wsClient.send( JSON.stringify( m ) );
		else console.warn("[Spacbrew::send] can't send message, not currently connected!");
	}

	/**
	 * @return {Boolean} Get whether websocket is connected
	 */
	this.connected = function() {
		return connectionEstablished;  
	}
  
	/**
	 * Websocket callback
	 */
	function onOpen(){
		connectionEstablished = true;
		if ( self.verbose ) console.log("[Spacebrew::onOpen] spacebrew connection open!");

		// send config
		wsClient.send(JSON.stringify( tConfig ));

		var onSbOpenEvent 			= new Event('onSbOpen');
		document.dispatchEvent( onSbOpenEvent );
	}
  
	/**
	 * Websocket callback
	 */
	function onClose(){
		var onSbCloseEvent 			= new Event('onSbClose');
		document.dispatchEvent( onSbCloseEvent );

		connectionEstablished = false;
		console.log("[Spacebrew::onClose] spacebrew connection closed.");
	}
  
	/**
	 * Websocket callback
	 */
	function onMessage( message ){
		var m = JSON.parse(message.data).message;

		var name = m.name;
		var type = m.type;

		if ( type == "string" ){
			var onStringMessageEvent 	= new CustomEvent('onStringMessage', {detail:{name:name, value:m.value}});
			document.dispatchEvent( onStringMessageEvent );

		} else if ( type == ("boolean")){
			var onBooleanMessageEvent 	= new CustomEvent('onBooleanMessage', {detail:{name:name, value:m.value}});
			document.dispatchEvent( onBooleanMessageEvent );
		} else if ( type == ("range")){
			var onRangeMessageEvent 	= new CustomEvent('onRangeMessage', {detail:{name:m.name, value:m.value}});
			document.dispatchEvent( onRangeMessageEvent  );
		} else {
			var onCustomMessageEvent 	= new CustomEvent('onCustomMessage', {detail:{name:m.name, type:type, value:m.value}});
			document.dispatchEvent( onCustomMessageEvent  );
		}
	}

	// finish setting up
	p5.prototype.registerMethod('pre', pre.bind(this));

};
