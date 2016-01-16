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
var Spacebrew = (function () {

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
	 * Setup a Boolean publisher
	 * @param {String}  name of route
	 * @param {Boolean} default starting value
	 */
	this.addPublish = function( name, _default ){
		var m = new SpacebrewMessage();
		m.name = name; 
		m.type = "boolean"; 
		if ( _default){
			m._default = "true";
		} else {
			m._default = "false";
		}
		publishes.push(m);
		if ( connectionEstablished ) updatePubSub();
	}
  
	/**
	 * Setup a Range publisher
	 * @param {String}  name of route
	 * @param {Integer} default starting value
	 */
	this.addPublish = function( name, _default ){
		var m = new SpacebrewMessage();
		m.name = name; 
		m.type = "range"; 
		m._default = _default.toString();
		publishes.push(m);
		if ( connectionEstablished ) updatePubSub();
	}
  
	/**
	 * Setup a String publisher
	 * @param {String}  name of route
	 * @param {String}  default starting value
	 */
	this.addPublish = function( name, _default ){
		var m = new SpacebrewMessage();
		m.name = name; 
		m.type = "string"; 
		m._default = _default;
		publishes.push(m);
		if ( connectionEstablished ) updatePubSub();
	}
  
	/**
	 * Setup a custom or string publisher
	 * @param {String}  name of route
	 * @param {String}  type of route ("range", "boolean", "string", or a custom name)
	 * @param {String}  default starting value
	 */
	this.addPublish = function( name, type, _default ){
		var m = new SpacebrewMessage();
		m.name = name; 
		m.type = type; 
		m._default = _default;
		publishes.push(m);
		if ( connectionEstablished ) updatePubSub();
	}

	/**
	 * Setup a custom or boolean publisher
	 * @param {String}  name of route
	 * @param {String}  type of route ("range", "boolean", or "string")
	 * @param {Boolean} default starting value
	 */
	this.addPublish = function( name, type, _default ){
		var m = new SpacebrewMessage();
		m.name = name; 
		m.type = type; 
		m._default = _default.toString();
		publishes.push(m);
		if ( connectionEstablished ) updatePubSub();
	}

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
		m._default = _default.toString();
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
	 * Add a subscriber + a specific callback for this route. Note: routes with a 
	 * specific callback don't call the default methods (e.g. onRangeMessage, etc)
	 * @param {String}  name of route
	 * @param {String}  name of method
	 * @param {String}  type of route ("range", "boolean", or "string")
	 */
	this.addSubscribe = function( name, type, methodName ){
		var m = new SpacebrewMessage();
		m.name = name;
		m.type = type.toLowerCase();
		subscribes.push(m);

		var method = null;
		if ( typeof(parent[methodName]) === "function"){
			method = parent[methodName];
		}

		if (method != null){
			if ( !callbacks.hasOwnProperty(name) ){
				callbacks[name] = {};
			}
			callbacks[name][type] = method;      
		}

		if ( connectionEstablished ) updatePubSub();
	}
  
	/**
	 * Connect to Spacebrew admin.
	 * @param {String} URL to Spacebrew host
	 * @param {String} Name of your app as it will appear in the Spacebrew admin
	 * @param {String} What does your app do?
	 */
	this.connect = function( hostname, _name, _description ){
		var port = 9000;
		var regex = new RegExp("ws://((?:[a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])(?:\\.(?:[a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9]))*):([0-9]{1,5})");
	    var m = regex.exec( hostname );
	    if (m != null) {
			if (m[0].length == 3) {
				hostname = m[0][1];
				port = parseInt(m[0][2]);
				this.connect(hostname, port, _name, _description);
				console.error("Using a full websockets URL will be deprecated in future versions of the Spacebrew lib.");
				console.error("Pass just the host name or call the connect(host, port, name, description) instead");
			} else {
				console.error("Spacebrew server URL is not valid.");				
			}    
	    } else {
			this.connect(hostname, port, _name, _description);    	
	    }
	}
  
	/**
	 * Connect to Spacebrew admin.
	 * @param {String} URL to Spacebrew host
	 * @param {String} Name of your app as it will appear in the Spacebrew admin
	 * @param {String} What does your app do?
	 */
	this.connect = function( _hostname, _port, _name, _description ){
		this.name = _name;
		this.description = _description;
		hostname = _hostname;
		port = _port;
		connectionRequested = true;

		if ( verbose ) console.log("[Spacebrew::connect] connecting to spacebrew "+ hostname);
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
	 * Add a listener to the 'onStringMessgae' event
	 * @param  {Function} fxn Function following this format: 
	 *                      function NAME_OF_FUNCTION( name, value ){}
	 * @return {Spacebrew}
	 */
	this.onStringMessgae = function( fxn ){
	    var f = function (e) { fxn(e.detail.name, e.detail.value); };
		document.addEventListener('onStringMessgae', f, false);
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
			if (parent.millis() - reconnectAttempt > reconnectInterval) {
				if ( verbose ) console.log("[Spacebrew::pre] attempting to reconnect to Spacebrew");
				this.connect( hostname, port, this.name, this.description);
				reconnectAttempt = parent.millis();
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
		    
		    subscribers.push(subs);      
		}

		tConfig.config = {
			name: this.name,
			description: this.description,
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
				clientName: this.name,
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
		if ( verbose ) console.log("[Spacebrew::onOpen] spacebrew connection open!");

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
	function onMessage( e ){
		var data, binaryData;

		// binary data
		// if (e.data instanceof ArrayBuffer){
		// 	var binaryPacket = new Uint8Array(e.data);
		// 	var jsonLength = binaryPacket[0];
		// 	var jsonStartIndex = 1;
		// 	if (jsonLength == 254){
		// 		jsonLength = ((binaryPacket[1] << 8) + binaryPacket[2]);
		// 		jsonStartIndex = 3;
		// 	} else if (jsonLength == 255){
		// 		jsonLength = ((binaryPacket[1] << 24) + (binaryPacket[2] << 16) + (binaryPacket[3] << 8) + binaryPacket[4]);
		// 		jsonStartIndex = 5;
		// 	}
		// 	if (jsonLength > 0){
		// 		try {
		// 			var jsonString = Spacebrew.decodeFromBuffer(new Uint8Array(e.data, jsonStartIndex, jsonLength));
		// 			data = JSON.parse(jsonString);
		// 			binaryData = {"buffer":e.data, "startIndex":jsonStartIndex+jsonLength};
		// 		} catch (err){
		// 			console.error(err);
		// 			return;
		// 		}
		// 	} else {
		// 		//empty message?
		// 		return;
		// 	}
		// } else {
		// 	data = JSON.parse(e.data);
		// }
		// var name
		// 	, type
		// 	, value
		// 	, clientName // not used yet, needs to be added to callbacks!
		// 	;

		// // handle client messages
		// if ((!("targetType" in data) && !(data instanceof Array)) || data["targetType"] == "client"){
		// 	//expecting only messages
		// 	if ("message" in data) {
		// 		name = data.message.name;
		// 		type = data.message.type;
		// 		value = data.message.value;

		// 		// for now only adding this if we have it, for backwards compatibility
		// 		if ( data.message.clientName ) {
		// 			clientName = data.message.clientName;
		// 		}

		// 		if (binaryData !== undefined){
		// 			this.onBinaryMessage( name, binaryData, type );
		// 		} else {
		// 			switch( type ){
		// 				case "boolean":
		// 					this.onBooleanMessage( name, value == "true" );
		// 					break;
		// 				case "string":
		// 					this.onStringMessage( name, value );
		// 					break;
		// 				case "range":
		// 					this.onRangeMessage( name, Number(value) );
		// 					break;
		// 				default:
		// 					this.onCustomMessage( name, value, type );
		// 			}
		// 		}
		// 	} else {
		// 		//illegal message
		// 		return;
		// 	}
		// }

		// // handle admin messages
		// else {
		// 	if (this.admin) {
		// 		this._handleAdminMessages( data );
		// 	}
		// }

		var m = JSON.parse(e.data).message;

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
			var onCustomMessageEvent 	= new CustomEvent('onRangeMessage', {detail:{name:m.name, type:type, value:m.value}});
			document.dispatchEvent( onRangeMessageEvent  );
		}
	}

	// finish setting up
	p5.prototype.registerMethod('pre', pre.bind(this));

}());