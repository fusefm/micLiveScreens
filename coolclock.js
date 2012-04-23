/**
 * CoolClock 2.1.4
 * Copyright 2010, Simon Baird
 * Released under the BSD License.
 *
 * Display an analog clock using canvas.
 * http://randomibis.com/coolclock/
 *
 */

// Constructor for CoolClock objects
window.CoolClock = function(options) {
	return this.init(options);
}

// Config contains some defaults, and clock skins
CoolClock.config = {
	renderRadius: 100,

	// Will store (a reference to) each clock here, indexed by the id of the canvas element
	clockTracker: {},

	// For giving a unique id to coolclock canvases with no id
	noIdCount: 0
};

// Define the CoolClock object's methods
CoolClock.prototype = {

	// Initialise using the parameters parsed from the colon delimited class
	init: function(options) {
		// Parse and store the options
		this.canvasId       = options.canvasId;
		this.skinId         = "fuse";
		if ((window.innerHeight * 0.4) > (window.innerWidth * 0.2))
			this.displayRadius = window.innerWidth * 0.2;
		else
			this.displayRadius  = window.innerHeight * 0.4;
		this.tickDelay      = 100;

		// Get the canvas element
		this.canvas = document.getElementById(this.canvasId);

		// Make the canvas the requested size. It's always square.
		this.canvas.setAttribute("width",this.displayRadius*2);
		this.canvas.setAttribute("height",this.displayRadius*2);
		this.canvas.style.width = this.displayRadius*2 + "px";
		this.canvas.style.height = this.displayRadius*2 + "px";

		// Explain me please...?
		this.renderRadius = CoolClock.config.renderRadius;
		this.scale = this.displayRadius / this.renderRadius;

		// Initialise canvas context
		this.ctx = this.canvas.getContext("2d");
		this.ctx.scale(this.scale,this.scale);

		// Keep track of this object
		CoolClock.config.clockTracker[this.canvasId] = this;

		// should we be running the clock?
		this.active = true;
		this.tickTimeout = null;

		// Start the clock going
		this.tick();

		return this;
	},

	// Draw some text centered vertically and horizontally
	drawTextAt: function(theTime,theDate,x,y) {
		this.ctx.save();
		this.ctx.font = '25px sans-serif';
		this.ctx.fillStyle = "white";
		var timeSize = this.ctx.measureText(theTime);
		var dateSize = this.ctx.measureText(theDate);
		if (!dateSize.height) dateSize.height = 25; // no height in firefox.. :(
		if (!timeSize.height) timeSize.height = 25; // no height in firefox.. :(
		this.ctx.fillText(theTime,x - timeSize.width/2,y - timeSize.height/2);
		this.ctx.fillText(theDate,x - dateSize.width/2,y + dateSize.height/2);
		this.ctx.restore();
	},

	lpad2: function(num) {
		return (num < 10 ? '0' : '') + num;
	},

	tickAngle: function(second) {
			return second/60.0;
	},

	timeText: function(hour,min,sec) {
		return '' + ((hour%12)==0 ? 12 : (hour%12)) + ':' + this.lpad2(min) + ':' + this.lpad2(sec) + (hour < 12 ? ' am' : ' pm');
	},
	
	dateText: function(day,month,year) {
		return '' + day + ' ' + month + ' ' + year;
	},


	// Draw a radial line by rotating then drawing a straight line
	// Ha ha, I think I've accidentally used Taus, (see http://tauday.com/)
	radialLineAtAngle: function(angleFraction,skin) {
		this.ctx.save();
		this.ctx.translate(this.renderRadius,this.renderRadius);
		this.ctx.rotate(Math.PI * (2.0 * angleFraction - 0.5));
		this.ctx.globalAlpha = skin.alpha;
		this.ctx.strokeStyle = skin.color;
		this.ctx.lineWidth = skin.lineWidth;

		this.ctx.beginPath();
		this.ctx.moveTo(skin.startAt,0)
		this.ctx.lineTo(skin.endAt,0);
		this.ctx.stroke();
		this.ctx.restore();
	},

	render: function(hour,min,sec,day,month,year) {
		// Get the skin
		var skin = CoolClock.config.skins[this.skinId];
		if (!skin) skin = CoolClock.config.skins[CoolClock.config.defaultSkin];

		// Clear
		this.ctx.clearRect(0,0,this.renderRadius*2,this.renderRadius*2);

		// Draw the tick marks. Every 5th one is a big one
		for (var i=0;i<60;i++) {
			(i%5)  && skin.smallIndicator && this.radialLineAtAngle(this.tickAngle(i),skin.smallIndicator);
			!(i%5) && skin.largeIndicator && this.radialLineAtAngle(this.tickAngle(i),skin.largeIndicator);
		}

		// Write the time
		var monthText = new Array();
		monthText[0]="Jan";
		monthText[1]="Feb";
		monthText[2]="Mar";
		monthText[3]="Apr";
		monthText[4]="May";
		monthText[5]="Jun";
		monthText[6]="Jul";
		monthText[7]="Aug";
		monthText[8]="Sep";
		monthText[9]="Oct";
		monthText[10]="Nov";
		monthText[11]="Dec";
		
		this.drawTextAt(
			this.timeText(hour,min,sec),
			this.dateText(day,monthText[month],year),
			this.renderRadius,
			this.renderRadius+this.renderRadius/10
		);
			
		if (min%2 == 0)
			for(i=0; i<=sec; i++){
				if (i%5)
					secondHand = skin.secondHand;
				else
					secondHand = skin.largeSecondHand;
				this.radialLineAtAngle(this.tickAngle(i),secondHand);
			}
		else
			for(i=sec + 1; i<=59; i++){
				if (i%5)
					secondHand = skin.secondHand;
				else
					secondHand = skin.largeSecondHand;
				this.radialLineAtAngle(this.tickAngle(i),secondHand);
			}
	},

	// Check the time and display the clock
	refreshDisplay: function() {
		var now = new Date();
		this.render(now.getHours(),now.getMinutes(),now.getSeconds(),now.getDate(),now.getMonth(),now.getFullYear());
	},

	// Set timeout to trigger a tick in the future
	nextTick: function() {
		this.tickTimeout = setTimeout("CoolClock.config.clockTracker['"+this.canvasId+"'].tick()",this.tickDelay);
	},

	// Check the canvas element hasn't been removed
	stillHere: function() {
		return document.getElementById(this.canvasId) != null;
	},

	// Stop this clock
	stop: function() {
		this.active = false;
		clearTimeout(this.tickTimeout);
	},

	// Start this clock
	start: function() {
		if (!this.active) {
			this.active = true;
			this.tick();
		}
	},

	// Main tick handler. Refresh the clock then setup the next tick
	tick: function() {
		if (this.stillHere() && this.active) {
			this.refreshDisplay()
			this.nextTick();
		}
	}
};

// Find all canvas elements that have the CoolClock class and turns them into clocks
CoolClock.findAndCreateClocks = function() {
	// (Let's not use a jQuery selector here so it's easier to use frameworks other than jQuery)
	var canvases = document.getElementsByTagName("canvas");
	for (var i=0;i<canvases.length;i++) {
		// Pull out the fields from the class. Example "CoolClock:chunkySwissOnBlack:1000"
		var fields = canvases[i].className.split(" ")[0].split(":");
		if (fields[0] == "CoolClock") {
			if (!canvases[i].id) {
				// If there's no id on this canvas element then give it one
				canvases[i].id = '_coolclock_auto_id_' + CoolClock.config.noIdCount++;
			}
			// Create a clock object for this element
			new CoolClock({
				canvasId:       canvases[i].id,
			});
		}
	}
};

// If you don't have jQuery then you need a body onload like this: <body onload="CoolClock.findAndCreateClocks()">
// If you do have jQuery and it's loaded already then we can do it right now
if (window.jQuery) jQuery(document).ready(CoolClock.findAndCreateClocks);
