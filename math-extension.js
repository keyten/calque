// Math.js extension by Keyten

// Analysis
math.import({
	der: function(fn, point, delta){
		if(delta == null)
			delta = 0.000000000000001;

		return (fn(point + delta) - fn(point - delta)) / (delta * 2);
	}
});

math.import({
	'int': function(fn, a, b, delta){
		if(delta == null)
			delta = 0.1;

		if(delta == 0)
			throw new Error("0 is wrong step for integral!");

		if(b < a)
			return -math.int(fn, b, a, delta);

		var sum = 0;
		for(var i = a; i < b; i += delta){
			sum += fn(i) * delta;
		}
		return sum;
	}
});

// Colors
math.import({
	color: function(){
		return new math.type.Color(arguments);
	}
});

math.import({
	name: 'Color',
	path: 'type',
	factory: function(type, config, load, typed){
		
		function Color(args){
			this.r = Math.round(Math.min(Math.max(args[0], 0), 255));
			this.g = Math.round(Math.min(Math.max(args[1], 0), 255));
			this.b = Math.round(Math.min(Math.max(args[2], 0), 255));

			if(isNaN(this.r))
				this.r = 0;
			if(isNaN(this.g))
				this.g = 0;
			if(isNaN(this.b))
				this.b = 0;
		}

		Color.prototype.toString = function(){
			return '(' + [this.r, this.g, this.b].join(', ') + ')';
		};

		typed.addType({
			name: 'Color',
			test: function(x){
				return x && x instanceof Color;
			}
		});

		return Color;

	},
	lazy: false
});

math.import({
	name: 'add',
	factory: function(type, config, load, typed){
		return typed('add', {
			'Color, Color': function(a, b){
				return math.blend('add', a, b);
			}
		});
	}
});

math.import({
	name: 'subtract',
	factory: function(type, config, load, typed){
		return typed('subtract', {
			'Color, Color': function(a, b){
				return math.blend('subtract', a, b);
			}
		});
	}
});

math.import({
	name: 'multiply',
	factory: function(type, config, load, typed){
		return typed('multiply', {
			'Color, Color': function(a, b){
				return math.blend('multiply', a, b);
			}
		});
	}
});

math.import({
	name: 'divide',
	factory: function(type, config, load, typed){
		return typed('divide', {
			'Color, Color': function(a, b){
				return math.blend('divide', a, b);
			}
		});
	}
});

math.import({
	name: 'equal',
	factory: function(type, config, load, typed){
		return typed('equal', {
			'Color, Color': function(a, b){
				return true;
			}
		});
	}
});

// Numbers
math.import({
	calcPi: function(n){
		if(n == null)
			n = 2;
		var sum = 0;
		for(var i = 1; i < n; i++){
			console.log(i, Math.pow(-1, i + 1) / (i * i));
			sum += Math.pow(-1,n + 1) / (i * i);
		}
		return Math.sqrt(-2 * sum);
		// :C wrong
	},

	calcE: function(n){
		if(n == null)
			n = '10000000000000000000000000000';
		return math.eval('n = bignumber(' + n + '); (1 + 1/n) ^ n').entries;
	}
});

math.import({
	fib: function(n){
		var sq5 = Math.sqrt(5);
		return (Math.pow((1 + sq5) / 2, n) - Math.pow((1 - sq5) / 2, n)) / sq5;
	}
});

// tribonacci
math.tribs = [0, 0, 1];
math.import({
	trib: function(n){
		var tribs = math.tribs;

		if(n in tribs)
			return tribs[n];
		n++;
		for(var i = tribs.length; i < n; i++){
			tribs[i] = tribs[i - 1] + tribs[i - 2] + tribs[i - 3];
		}
		return tribs[n - 1];
	}
});

// todo: add bignumber

// Polynom
math.import({
	name: 'Polynom',
	path: 'type',
	factory: function(type, config, load, typed){

		function Polynom(args){
			this.c = args;
		}

		Polynom.prototype.toString = function(){
			var c = this.c,
				str = [];

			function cf(coef, power){
				var xp = 'x<em class="power">' + power + '</em>';

				if(coef == 0)
					return '';

				if(power == 0)
					xp = '';
				else if(coef == 1)
					coef = '';
				else if(coef == -1)
					coef = '-';

				if(power == 1)
					xp = 'x';

				return coef + xp; //str.push(coef + xp);
			}

			for(var power = 0; power < c.length; power++){
				var coef = c[power];
				if(coef.im){
					str.push( cf(coef.re, power) + ' + ' + cf(coef.im, power) + 'i' );
				}
				else {
					var s = cf(coef, power);
					if(s)
						str.push( s );
				}

			}

			return str.join(' + ').replace(/\s\+\s\-/g, ' - ');
		};

		typed.addType({
			name: 'Polynom',
			test: function(x){
				return x && x instanceof Polynom;
			}
		});

		return Polynom;

	},
	lazy: false
});

math.import({
	name: 'add',
	factory: function(type, config, load, typed){
		var polynumber = function(a, b){
				var copy = [].slice.call(a.c);
				copy[0] = math.add(copy[0], b);
				return new math.type.Polynom(copy);
			},
			inverted = function(a, b){ return math.add(b, a); };

		return typed('add', {
			'Polynom, Polynom': function(a, b){
				var c = [];
				for(var i = 0, l = Math.max(a.c.length, b.c.length); i < l; i++){
					c.push( (a.c[i] || 0) + (b.c[i] || 0) );
				}
				return new math.type.Polynom(c);
			},

			'Polynom, number': polynumber,
			'Polynom, BigNumber': polynumber,
			'Polynom, Complex': polynumber,
			'Polynom, Fraction': polynumber,

			'number, Polynom': inverted,
			'BigNumber, Polynom': inverted,
			'Complex, Polynom': inverted,
			'Fraction, Polynom': inverted
		});
	}
});

math.import({
	name: 'multiply',
	factory: function(type, config, load, typed){
		return typed('multiply', {
			'Polynom, Polynom': function(a, b){
				var coefs = { length: 0 };
				for(var i = 0; i < a.c.length; i++){
					for(var j = 0; j < b.c.length; j++){
						var power = i + j,
							coef = a.c[i] * b.c[j];

						if(!coefs[power])
							coefs[power] = 0;
						coefs[power] += coef;

						if(coefs.length < power)
							coefs.length = power;
					}
				}
				coefs.length++;
				return new math.type.Polynom(coefs);
			}
		});
	}
});


math.import({
	polynom: function(arg){
		if(arg._data)
			return new math.type.Polynom(arg._data);
		return new math.type.Polynom(arguments);
	}
});

math.import({
	solve: function(arg, value){
		if(value == null)
			value = 0;

		if(arg.c.length == 1)
			return arg.c[0];

		if(arg.c.length == 2)
			return -arg.c[0] / arg.c[1];

		if(arg.c.length == 3){
			var a = arg.c[2],
				b = arg.c[1],
				c = arg.c[0],
				D = b * b - 4 * a * c,
				one = math.divide( math.add(-b, math.sqrt(D)) , 2 * a ),
				two = math.divide( math.subtract(-b, math.sqrt(D)) , 2 * a );
			return math.eval('[' + one + ', ' + two + ']'); //return one + '; ' + two;
		}

		// 4,2,0 => ax^4 + bx^2 + c => a,0,b,0,c
		// 6,3,0 => ax^6 + bx^3 + c => a,0,0,b,0,0,c
		// 8,4,0 => ax^8 + bx^4 + c => a,0,0,0,b,0,0,0,c
		if(arg.c.length % 2 === 1){
			// check
			var i = arg.c.length - 1,
				period;
			while(i){
				if(arg.c[i] != 0){
					console.log(i);
					period = arg.c.length - i;
					break;
				}
				i--;
			}
		}

		throw "Can\'t solve this polynom.";
	}
});

// Linear recurrent ranges
math.import({
	name: 'RecurrentRange',
	path: 'type',
	factory: function(type, config, load, typed){

		function RecurrentRange(args){
			this.c = [].slice.call(args);
		}

		RecurrentRange.prototype.toString = function(){
			var c = this.c,
				str = [],
				power = c.length;

			while(power--){
				var coef = c[power],
					pow = 'n + ' + power;

				if(coef == 0)
					continue;
				else if(coef == 1)
					coef = '';
				else if(coef == -1)
					coef = '-';

				if(power == 0)
					pow = 'n';

				str.push(coef + 'u<em class="subpower">' + pow + '</em>');
			}

			return 'u<em class="subpower">n + ' + c.length + '</em> = ' + str.join(' + ').replace(/\s\+\s\-/g, ' - ');

		};

		typed.addType({
			name: 'RecurrentRange',
			test: function(x){
				return x && x instanceof RecurrentRange;
			}
		});

		return RecurrentRange;

	},
	lazy: false
});

math.import({
	recrange: function(arg){
		if(arg._data)
			return new math.type.RecurrentRange(arg._data);
		return new math.type.RecurrentRange(arguments);
	}
});

math.import({
	exec: function(range){ // doesntworks
		var power = range.c.length;
		var numbers = [];
		while(power--)
			numbers.push(1);
		for(var k = range.c.length, max = 10 - k; k < max; k++){
			var number = 0;
			for(var j = range.c.length; j--;)
				number += range.c[j] * numbers[j - k];
			numbers.push(number);
		}
		return numbers.join(', ');
	}
});
