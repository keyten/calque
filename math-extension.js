// Math.js extension by Keyten
math.class = function(name, object){
	math.import({
		name: name,
		path: 'type',
		lazy: false,
		factory: function(type, config, load, typed){

			var cls = function(){
				return this.init.apply(this, arguments);
			};
			cls.prototype = object;

			math.typed.addType({
				name: name,
				test: object.test || (function(x){
					return x && x instanceof cls;
				})
			});

			return cls;
		}
	});

	// short constructor
	var make = {};
	make[ name.toLowerCase() ] = function(){
		return new math.type[name](arguments);
	};
	math.import(make);

	// imports
	var fns = {};
	if(object.import){
		object.import.forEach(function(fn){
			fns[fn] = object[fn];
		});
		math.extend(name, fns);
	}

	// operators
	['add', 'subtract', 'multiply', 'divide', 'equal'].forEach(function(operator){
		if(!object[operator])
			return;

		math.import({
			name: operator,
			factory: function(type, config, load, typed){
				var obj = {};
				obj[name + ', ' + name] = object[operator];
				return typed(operator, obj);
			}
		});
	});
};

math.extend = function(name, object){
	for(var fn in object){
		if(!Object.hasOwnProperty.call(object, fn))
			continue;
		(function(fn, obj){
			obj = {};
			obj[name] = object[fn];
			math.import({
				name: fn,
				factory: function(type, config, load, typed){
					return typed(fn, obj);
				}
			});
		})(fn, {});
	}
};

// Sets
math.class('Set', {
	init: function(args){
		this.elements = Array.prototype.slice.call(args);
	},

	clone: function(){
		return new math.type.Set(this.elements);
	},

	toString: function(){
		return '{' + this.elements.join(', ') + '}';
	}
});


// Matrices
math.extend('Matrix', {
	sym: function(matrix){
		return math.multiply(1/2, math.add(matrix, math.transpose(matrix)));
	},

	alt: function(matrix){
		return math.multiply(1/2, math.subtract(matrix, math.transpose(matrix)));
	}
});
// todo: make sqrt for matrices

math.import({
	diagonal: function(array){
		array = array._data;
		var result = [];
		for(var i = 0; i < array.length; i++){
			result[i] = Array(array.length+1).join(0).split('').map(function(a){ return 0; });
			result[i][i] = array[i];
		}
		return math.matrix(result);
	},

	commutator: function(a, b){
		return math.subtract( math.multiply(a, b), math.multiply(b, a) );
	},

	col: function(matrix, num, col){
		if(parseInt(num) != num)
			throw "Wrong column!";

		if(num < 1 || num > matrix._data[0].length)
			throw "Matrix hasn't this column";

		// counting from 1
		num--;

		if(!col){
			// return the col
			var column = [];
			for(var i = 0; i < matrix._data.length; i++){
				column[i] = matrix._data[i][num];
			}
			return math.matrix(column);
		}
		else {
			// clone the matrix
			matrix = math.matrix(matrix._data);
			for(var i = 0; i < col._data.length; i++){
				matrix._data[i][num] = col._data[i];
			}
			return matrix;
		}
	}
});

// Fraction
math.extend('Fraction', {
	sqrt: function(frac){
		if(frac.s == -1){
			throw "Complex fraction aren\'t supported.";
		}
		return math.fraction(math.sqrt(frac.n), math.sqrt(frac.d));
	}
})


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
			throw "0 is wrong step for integral!";

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
math.class('Color', {
	init: function(args){
		this.r = Math.round(Math.min(Math.max(args[0], 0), 255));
		this.g = Math.round(Math.min(Math.max(args[1], 0), 255));
		this.b = Math.round(Math.min(Math.max(args[2], 0), 255));

		if(isNaN(this.r))
			this.r = 0;
		if(isNaN(this.g))
			this.g = 0;
		if(isNaN(this.b))
			this.b = 0;
	},

	equal: function(a, b){
		return a.r == b.r && a.g == b.g && a.b == b.b;
	},

	add: function(a, b){
		return math.blend('add', a, b);
	},

	blend: function(mode, a, b){
		var r1 = a.r, g1 = a.g, b1 = a.b,
			r2 = b.r, g2 = b.g, b2 = b.b,
			r, g, b;
		switch(mode){
			case 'add': {
				r = r1 + r2;
				g = g1 + g2;
				b = b1 + b2;
			} break;
			case 'subtract': {
				r = r1 - r2;
				g = g1 - g2;
				b = b1 - b2;
			} break;
			case 'multiply': {
				r = r1 * r2;
				g = g1 * g2;
				b = b1 * b2;
			} break;
			default: {
				throw "Unknown blend mode";
			}
		}
		return math.color([r, g, b]);
	},

	import: ['blend'],

	clone: function(){
		return math.color([this.r, this.g, this.b]);
	},

	toString: function(){
		return '(' + [this.r, this.g, this.b].join(', ') + ')';
	}
});


// Numbers
math.import({
	calc: function(num, n){
		switch(num){

			case 'pi': {
				// Ramanujan's formula
				if(n == null)
					n = 3;
				var sum = 0;
				for(var k = 0; k < n; k++){
					sum += (math.factorial(4*k) * (1103 + 26390 * k))/(Math.pow(math.factorial(k), 4) * Math.pow(396, 4*k));
				}
				return 1 / (((2 * Math.sqrt(2))/9801) * sum);
			} break;

			case 'e': {
				if(n == null)
					n = 5;
			} break;

			default:
				throw "Unknown constant type";
		}
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
math.class('Polynom', {
	init: function(args){
		this.c = args;
	},

	add: function(a, b){
		var c = [];
		for(var i = 0, l = Math.max(a.c.length, b.c.length); i < l; i++){
			c.push( (a.c[i] || 0) + (b.c[i] || 0) );
		}
		return new math.type.Polynom(c);
	},

	clone: function(){
		return new math.type.Polynom(this.c);
	},

	solve: function(arg, value){
		if(value == null)
			value = 0;

		// constant
		if(arg.c.length == 1)
			return math.matrix(arg.c[0]);

		// linear
		if(arg.c.length == 2)
			return math.matrix(math.divide(math.multiply(arg.c[0], -1), arg.c[1]));

		// quadratic
		if(arg.c.length == 3){
			var a = arg.c[2],
				b = arg.c[1],
				c = arg.c[0],
				D = math.subtract(math.pow(b, 2), math.multiply(4, math.multiply(a, c))),
				one = math.divide( math.add(math.multiply(b, -1), math.sqrt(D)) , math.multiply(2, a) ),
				two = math.divide( math.subtract(math.multiply(b, -1), math.sqrt(D)) , math.multiply(2, a) );
			return math.matrix(one, two); //return one + '; ' + two;
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
	},

	import: ['solve'],

	toString: function(){
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
	}
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

// Linear recurrent ranges
/*
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
/*
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
}); */

// Units
math.import({
	equalBase: function(a, b){
		if(math.typeof(a) !== 'Unit')
			throw "First argument is not an unit";
		if(math.typeof(b) !== 'Unit')
			throw "Second argument is not an unit";
		return a.equalBase(b);
	}
});

// Utilities
math.import({
	// storage
	getData: function(key){
		return window.localStorage.getItem('calque_' + key);
	},
	setData: function(key, value){
		window.localStorage.setItem('calque_' + key, value);
		return 'Success';
	}
});


// Quaternion
math.class('Quaternion', {
	init: function(args){
		this.re = args[0];
		this.i = args[1];
		this.j = args[2];
		this.k = args[3];
	},

	equal: function(a, b){
		return a.re == b.re && a.i == b.i && a.j == b.j && a.k == b.k;
	},

	add: function(a, b){
		return math.quaternion(a.re + b.re, a.i + b.i, a.j + b.j, a.k + b.k);
	},

	sin: function(a, b){
		// use the Taylor series?
	},

	clone: function(){
		return math.quaternion([this.re, this.i, this.j, this.k]);
	},

	toString: function(){
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

//		return this.re + ' + ' + this.i + 'i + ' + this.j + 'j + ' + this.k + 'k';
	}
});

/*

	Quaternions:
		a, vec u{b, c, d}.
		isInteger: 2a, 2b, 2c, 2d is int and одинаковой чётности;
		sgn(q): q / abs(q);
		arg(q): arccos(a / abs(q))
		exp(q): exp(a) * (cos(abs(u)) + sin(abs(u)) * u`);
		ln(q): ln |q| + arg(q) * u` // u` is u / abs(u) ?
		sin(q): sin a * ch |u| + cos a sh |u| u`
		cos(q): cos a * ch |u| - sin a sh |u| u`

 */
