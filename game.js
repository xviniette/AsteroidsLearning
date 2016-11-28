var Neuvol;
var game;
var FPS = 60;

var nbSensors = 16;
var maxSensorSize = 200;


var images = {};

(function() {
	var timeouts = [];
	var messageName = "zero-timeout-message";

        // Like setTimeout, but only takes a function argument.  There's
        // no time argument (always zero) and no arguments (you have to
        // use a closure).
function setZeroTimeout(fn) {
	timeouts.push(fn);
	window.postMessage(messageName, "*");
}

function handleMessage(event) {
	if (event.source == window && event.data == messageName) {
		event.stopPropagation();
		if (timeouts.length > 0) {
			var fn = timeouts.shift();
			fn();
		}
	}
}

window.addEventListener("message", handleMessage, true);

        // Add the one thing we want added to the window object.
        window.setZeroTimeout = setZeroTimeout;
    })();

    var collisionAABB = function(obj1, obj2){
    	if(!(obj1.x > obj2.x + obj2.width || obj1.x + obj1.width < obj2.x || obj1.y > obj2.y + obj2.height || obj1.y + obj1.height < obj2.y)){
    		return true;
    	}
    	return false;
    }

    var collisionSegments = function(l1x1, l1y1, l1x2, l1y2, l2x1, l2y1, l2x2, l2y2) {
    	var denominator = ((l2y2 - l2y1) * (l1x2 - l1x1)) - ((l2x2 - l2x1) * (l1y2 - l1y1));
    	if (denominator == 0) {
    		return false;
    	}
    	var a = l1y1 - l2y1;
    	var b = l1x1 - l2x1;
    	var numerator1 = ((l2x2 - l2x1) * a) - ((l2y2 - l2y1) * b);
    	var numerator2 = ((l1x2 - l1x1) * a) - ((l1y2 - l1y1) * b);
    	a = numerator1 / denominator;
    	b = numerator2 / denominator;

    	var x = l1x1 + (a * (l1x2 - l1x1));
    	var y = l1y1 + (a * (l1y2 - l1y1));
    	if (a > 0 && a < 1 && b > 0 && b < 1) {
    		return Math.sqrt(Math.pow(x - l1x1, 2) + Math.pow(y - l1y1, 2));
    	}
    	return false;
    };

    var collisionSegmentAABB = function(x1, y1, x2, y2, ax, ay, aw, ah){
    	var distance = 999999;
    	var d = [];
    	d.push(collisionSegments(x1, y1, x2, y2, ax, ay, ax + aw, ay));
    	d.push(collisionSegments(x1, y1, x2, y2, ax, ay, ax, ay + ah));
    	d.push(collisionSegments(x1, y1, x2, y2, ax + aw, ay,  ax + aw, ay + ah));
    	d.push(collisionSegments(x1, y1, x2, y2, ax, ay + ah,  ax + aw, ay + ah));

    	for(var i in d){
    		if(d[i] !== false && d[i] < distance){
    			distance = d[i];
    		}
    	}

    	return distance;
    }

    var speed = function(fps){
    	FPS = parseInt(fps);
    }

    var loadImages = function(sources, callback){
    	var nb = 0;
    	var loaded = 0;
    	var imgs = {};
    	for(var i in sources){
    		nb++;
    		imgs[i] = new Image();
    		imgs[i].src = sources[i];
    		imgs[i].onload = function(){
    			loaded++;
    			if(loaded == nb){
    				callback(imgs);
    			}
    		}
    	}
    }

    var Ship = function(json){
    	this.width = 30;
    	this.height = 30;
    	this.x = game.width/2 - this.width/2;
    	this.y = game.height/2 - this.height/2;

    	this.direction = 0;
    	this.movex = 0;
    	this.movey = 0;
    	this.sens = 0;

    	this.speed = 3;
    	this.rotationSpeed = 0.3;

    	this.alive = true;

    	this.init(json);
    }

    Ship.prototype.init = function(json){
    	for(var i in json){
    		this[i] = json[i];
    	}
    }

    Ship.prototype.getSensorDistances = function(){
    	var sensors = [];
    	for(var i = 0; i < nbSensors; i++){
    		sensors.push(1);
    	}

    	for(var i in game.asteroids){
    		var distance = Math.sqrt( Math.pow(game.asteroids[i].x + game.asteroids[i].width/2 - this.x + this.width/2, 2) + Math.pow(game.asteroids[i].y + game.asteroids[i].height/2 - this.y + this.height/2, 2));
    		if(distance <= maxSensorSize){
    			for(var j = 0; j < nbSensors; j++){
    				var x1 = this.x + this.width/2;
    				var y1 = this.y + this.height/2;
    				var x2 = x1 + Math.cos(Math.PI * 2 / nbSensors * j + this.direction) * maxSensorSize;
    				var y2 = y1 + Math.sin(Math.PI * 2/ nbSensors * j + this.direction) * maxSensorSize;

    				var objx = game.asteroids[i].x + game.asteroids[i].width/2;
    				var objy = game.asteroids[i].y + game.asteroids[i].height/2;


    				if(Math.abs(Math.atan2(objy - y1, objx - x1) - Math.atan2(y2 - y1, x2 - x1)) <= Math.PI * 2 / nbSensors){
    					var d = collisionSegmentAABB(x1, y1, x2, y2, game.asteroids[i].x, game.asteroids[i].y, game.asteroids[i].width, game.asteroids[i].height);
    					if(d/maxSensorSize < sensors[j]){
    						sensors[j] = d/maxSensorSize;
    					}		
    				}
    			}
    		}
    	}

    	for(var j = 0; j < nbSensors; j++){
    		var x1 = this.x + this.width/2;
    		var y1 = this.y + this.height/2;
    		var x2 = x1 + Math.cos(Math.PI / nbSensors * j + this.direction) * maxSensorSize;
    		var y2 = y1 + Math.sin(Math.PI / nbSensors * j + this.direction) * maxSensorSize;

    		var d = collisionSegmentAABB(x1, y1, x2, y2, 0, 0, game.width, game.height);
    		if(d/maxSensorSize < sensors[j]){
    			sensors[j] = d/maxSensorSize;
    		}
    	}

    	return sensors;
    }

    Ship.prototype.update = function(){
	//this.direction += this.sens * this.rotationSpeed;

	this.x += this.movex * this.speed;
	this.y += this.movey * this.speed;
}

Ship.prototype.isDead = function(){
	if(this.x < 0 || this.x + this.width > game.width){
		return true;
	}

	if(this.y < 0 || this.y + this.height > game.height){
		return true;
	}

	for(var i in game.asteroids){
		if(collisionAABB(this, game.asteroids[i])){
			return true;
		}
	}
	return false;
}


var Asteroid = function(json){
	this.x = 0;
	this.y = 0;
	this.width = 40;
	this.height = 40;

	this.speed = 2;

	this.vx = Math.random() * (Math.random() < 0.5 ? 1 : -1);
	this.vy = (1 - Math.abs(this.vx)) * (Math.random() < 0.5 ? 1 : -1);

	this.init(json);
}

Asteroid.prototype.init = function(json){
	for(var i in json){
		this[i] = json[i];
	}
}

Asteroid.prototype.update = function(){
	if(this.x + this.width/2 < 0 || this.x + this.width/2 > game.width){
		this.vx *= -1;
	}

	if(this.y + this.height/2 < 0 || this.y + this.height/2 > game.height){
		this.vy *= -1;
	}

	this.x += this.vx * this.speed;
	this.y += this.vy * this.speed;
}


var Game = function(){
	this.asteroids = [];
	this.ships = [];

	this.score = 0;

	this.canvas = document.querySelector("#asteroids");
	this.ctx = this.canvas.getContext("2d");
	this.width = this.canvas.width;
	this.height = this.canvas.height;

	this.spawnInterval = 120;
	this.interval = 0;
	this.maxAsteroids = 10;

	this.gen = [];

	this.alives = 0;
	this.generation = 0;
}

Game.prototype.start = function(){
	this.interval = 0;
	this.score = 0;
	this.asteroids = [];
	this.ships = [];

	this.gen = Neuvol.nextGeneration();
	for(var i in this.gen){
		var s = new Ship();
		this.ships.push(s);
	}
	this.generation++;
	this.alives = this.ships.length;
}

Game.prototype.update = function(){
	for(var i in this.ships){
		if(this.ships[i].alive){
			var inputs = this.ships[i].getSensorDistances();
			var res = this.gen[i].compute(inputs);
			this.ships[i].movex = 0;
			this.ships[i].movey = 0;

			if(res[0] > 0.65){
				this.ships[i].movex++;
			}
			if(res[0] < 0.45){
				this.ships[i].movex--;
			}

			if(res[1] > 0.65){
				this.ships[i].movey++;
			}
			if(res[1] < 0.45){
				this.ships[i].movey--;
			}

			this.ships[i].update();
			if(this.ships[i].isDead()){
				this.ships[i].alive = false;
				this.alives--;
				Neuvol.networkScore(this.gen[i], this.score);
				if(this.isItEnd()){
					this.start();
				}
			}

		}
	}

	for(var i in this.asteroids){
		this.asteroids[i].update();
	}

	if(this.interval == 0 && this.asteroids.length < this.maxAsteroids){
		this.spawnAsteroids();
	}

	this.interval++;
	if(this.interval == this.spawnInterval){
		this.interval = 0;
	}

	this.score++;
	var self = this;

	if (FPS == 0) {
		setZeroTimeout(function() {
			self.update();
		});
	}
	else {
		setTimeout(function(){
			self.update();
		}, 1000/FPS);
	}

	this.display();
}

Game.prototype.spawnAsteroids = function(){
	var spawns = [
	{x:0 + 30, y:0 + 30},
	//{x:0 + 30, y:this.height - 50},
	{x:this.width - 50, y:this.height - 50},
	//{x:this.width - 50, y:0 + 30}
	];
	for(var i in spawns){
		var a = new Asteroid({
			x:spawns[i].x,
			y:spawns[i].y,
		});
		this.asteroids.push(a);
	}
}

Game.prototype.isItEnd = function(){
	for(var i in this.ships){
		if(this.ships[i].alive){
			return false;
		}
	}
	return true;
}

Game.prototype.display = function(){
	this.ctx.clearRect(0, 0, this.width, this.height);
	this.ctx.drawImage(images.background, 0, 0, this.width, this.height);

	for(var i in this.ships){
		if(this.ships[i].alive){
			// this.ctx.strokeStyle = "#4C4B49";
			// for(var j = 0; j < nbSensors; j++){
			// 	var x1 = this.ships[i].x + this.ships[i].width/2;
			// 	var y1 = this.ships[i].y + this.ships[i].height/2;
			// 	var x2 = x1 + Math.cos(Math.PI * 2 / nbSensors * j + this.ships[i].direction) * maxSensorSize;
			// 	var y2 = y1 + Math.sin(Math.PI * 2 / nbSensors * j + this.ships[i].direction) * maxSensorSize;
			// 	this.ctx.beginPath();
			// 	this.ctx.moveTo(x1, y1);
			// 	this.ctx.lineTo(x2, y2);
			// 	this.ctx.stroke();
			// }

			this.ctx.strokeStyle = "red";
			this.ctx.strokeRect(this.ships[i].x, this.ships[i].y, this.ships[i].width, this.ships[i].height);
			this.ctx.drawImage(images.ship, this.ships[i].x, this.ships[i].y, this.ships[i].width, this.ships[i].height);

			/*this.ctx.save(); 
			this.ctx.translate(this.ships[i].x, this.ships[i].y);
			this.ctx.translate(this.ships[i].width/2, this.ships[i].height/2);
			this.ctx.rotate(this.ships[i].direction + Math.PI/2);
			this.ctx.drawImage(images.ship, -this.ships[i].width/2, -this.ships[i].height/2, this.ships[i].width, this.ships[i].height);
			this.ctx.restore();*/
		}
	}

	this.ctx.strokeStyle = "yellow";
	for(var i in this.asteroids){
		this.ctx.strokeRect(this.asteroids[i].x, this.asteroids[i].y, this.asteroids[i].width, this.asteroids[i].height);
		this.ctx.drawImage(images.asteroid, this.asteroids[i].x, this.asteroids[i].y, this.asteroids[i].width, this.asteroids[i].height);
	}

	this.ctx.fillStyle = "white";
	this.ctx.font="20px Arial";
	this.ctx.fillText("Score : "+this.score, 10, 25);
	this.ctx.fillText("Generation : "+this.generation, 10, 50);
	this.ctx.fillText("Alive : "+this.alives+" / "+Neuvol.options.population, 10, 75);
}

window.onload = function(){
	var sprites = {
		ship:"img/ship.png",
		asteroid:"img/asteroid.png",
		background:"img/fond.png"
	};

	var start = function(){
		Neuvol = new Neuroevolution({
			population:50,
			network:[nbSensors, [9], 2],
			randomBehaviour:0.1,
			mutationRate:0.5, 
			mutationRange:2, 
		});
		game = new Game();
		game.start();
		if (FPS == 0) {
			setZeroTimeout(function() {
				game.update();
			});
		}
		else {
			setTimeout(function(){
				game.update();
			}, 1000/FPS);
		}
	}


	loadImages(sprites, function(imgs){
		images = imgs;
		start();
	})

}