(function () {
	function scopeClone(scope) {
		var newScope = {};

		_.each(scope, function (value, name) {
			if (value instanceof Function) {
				newScope[name] = value;
			} else if(value !== null && value.clone) {
				newScope[name] = value.clone();
			} else {
				newScope[name] = math.clone(value);
			}
		});

		return newScope;
	}

	function Calque(inputEl, outputEl) {
		this.inputEl = inputEl;
		this.outputEl = outputEl;

		this.raw = '';
		this.lines = [];
		this.expressions = [];
		this.activeLine = 0;
		this.config = {};

		var handler = function () {
			this.updateActiveLine();
			this.input();

			if (this.inputEl.scrollTop !== this.outputEl.scrollTop) {
				this.outputEl.scrollTop = this.inputEl.scrollTop;
			}
		}.bind(this);

		handler();

		inputEl.onkeydown = handler;
		inputEl.onkeyup = handler;
	//	setInterval(handler, 50);

		outputEl.scrollTop = inputEl.scrollTop;
		inputEl.onscroll = function () {
			outputEl.scrollTop = inputEl.scrollTop;
		};

		// files support
		document.body.addEventListener('drop', this.openFile.bind(this), false);
		document.body.addEventListener('dragover', function(event){
			event.stopPropagation();
			event.preventDefault();
			event.dataTransfer.dropEffect = 'copy';
		}, false);

		// loading the last file
		try {
			var val = window.localStorage.getItem('text');
			if(val.replace(/\s/g, ''))
				inputEl.value = val;
		} catch(e){}
		window.onunload = function(){
			try {
				window.localStorage.setItem('text', inputEl.value);
			} catch(e){}
		}
	}

	Calque.prototype.updateActiveLine = function () {
		var value = this.inputEl.value;
		var selectionStart = this.inputEl.selectionStart;

		var match = value.substr(0, selectionStart).match(/\n/g);

		if (!match) {
			var activeLine = 1;
		} else {
			var activeLine = value.substr(0, selectionStart).match(/\n/g).length + 1;
		}

		if (this.activeLine !== activeLine) {
			this.activeLine = activeLine;
			this.repaint();
		}
	}

	Calque.prototype.input = function () {
		var raw = this.preprocess(this.inputEl.value);
		if (raw !== this.raw) {
			this.raw = raw;
			this.lines = this.raw.split("\n");
			this.recalc();
		}
	}

	Calque.prototype.recalc = function () {
		this.expressions.forEach(function (expression) {
			expression.line = null;
		});

		var scope = {
			last: null
		};

		var inComment = false;

		this.lines.forEach(function (code, index) {
			var oldSimilarExpressions = this.expressions.filter(function (expression) {
				if (expression.line !== null) return;
				if (expression.code !== code) return;
				return true;
			});

			// multiline comments
			if(code.indexOf('###') === 0){
				inComment = !inComment;
			}

			if (oldSimilarExpressions.length) {
				var expression = oldSimilarExpressions[0];
				if(!inComment)
					expression.eval(scope);
			} else {
				var expression = new Expression(code, scope, inComment);
				this.expressions.push(expression);
			}

			if(code !== '' && code.length - code.lastIndexOf('###') === 3){
				inComment = !inComment;
			}

			scope = scopeClone(expression.scopeOutput);

			if (expression.result !== undefined) {
				scope.last = expression.result;
			}

			expression.line = index;
		}.bind(this));

		_.remove(this.expressions, { line: null });

		this.repaint();
	};

	Calque.prototype.repaint = function () {
		var html = '';

		this.lines.forEach(function (line, index) {
			var expression = this.expressions.filter(function (expression) {
				return expression.line === index;
			})[0];

			if (expression.error) {
				if (this.activeLine === index + 1) {
					var type = 'empty';
				} else {
					var type = 'error';
				}
			} else if (expression.result === undefined) {
				var type = 'empty';
			} else {
				var type = 'result';
			}

			var prefix = '';
			for (var s = 0; s <= expression.code.length; s++) prefix += ' ';
			if (type === 'empty') prefix += ' ';
			if (type === 'result') {
				if (expression.result instanceof Function) {
					prefix += 'fn';
				} else {
					prefix += '= ';
				}
			}
			if (type === 'error') prefix += '// ';

			var data = '';
			if (type === 'result') {
				if (expression.result === null) {
					data = 'null';
				} else if (expression.result instanceof Function) {
					var source = expression.result.toString();
					data = '';
				} else {
					data = expression.result.toString();
				}
			};
			if (type === 'error') data = expression.error;

			var lineHtml = '<div class="' + type + '">';
			lineHtml += '<span class="prefix" data-prefix="' + prefix + '"></span>';
			lineHtml += '<span class="data">' + data + '</span>';
			lineHtml += '</div>';

			html += lineHtml;
		}.bind(this));

		this.outputEl.innerHTML = html;
	};

	Calque.prototype.openFile = function(event){
		if(!window.File || !window.FileReader || !window.FileList || !window.Blob)
			return;
		event.stopPropagation();
		event.preventDefault();

		var input = this.inputEl;
		var file = event.dataTransfer.files[0];
		var reader = new FileReader();
		reader.onload = function(e){
			if(input.value.replace(/\s/g, '') !== ''){
				if(!window.confirm("Are you sure? You\'ll lose your current text."))
					return;
			}
			input.value = e.target.result;
		};
		reader.readAsText(file);
	};

	Calque.prototype.preprocess = function(raw){
		var match,
			change = false;;
		if(match = raw.match(/#number\s+([a-z]+)/i)){
			match = match[1];
			if(match != this.config.number && (match == 'number' || match == 'bignumber' || match == 'fraction')){
				this.config.number = match;
				change = true;
			}
		}
		else if(this.config.number != 'number'){
			this.config.number = 'number';
			change = true;
		}

		if(match = raw.match(/#precision\s+([0-9]+)/i)){
			match = match[1];
			if(match != this.config.precision && +match == match){
				this.config.precision = match;
				change = true;
			}
		}
		else if(this.config.precision != 64){
			this.config.precision = 64;
			change = true;
		}

		if(match = raw.match(/#style\s+([a-z]+)/i)){
			match = match[1].toLowerCase();
			if(match != this.config.style && (match == 'monokai' || match == 'default')){
				this.config.style = match;
				change = true;
			}
		}

		if(match = raw.match(/#epsilon\s+([0-9-.e]+)/i)){
			match = match[1];
			if(match != this.config.epsilon && +match == match){
				this.config.epsilon = match;
				change = true;
			}
		}
		else if(this.config.epsilon != 1e-14){
			this.config.epsilon = 1e-14;
			change = true;
		}

		if(change)
			math.config(this.config);
		return raw;
	}

	// styles
	math.on('config', function(curr, prev){
		if(curr.style !== prev.style){
			if(curr.style == 'default')
				document.getElementById('stylelink').href = '';
			else
				document.getElementById('stylelink').href = 'style/' + curr.style + '.css';
		}
	});

	function Expression(code, scope, comment) {
		this.code = code;
		this.scopeInput = scopeClone(scope);
		this.scopeOutput = scopeClone(this.scopeInput);

		try {
			this.parse = math.parse(code);

			this.dependencies = [];
			this.parse.traverse(function (node) {
				if (node.isSymbolNode || node.isFunctionNode) {
					this.dependencies.push(node.name);
				}
			}.bind(this));

			if(!comment)
				this.eval(scope);
		} catch (e) {
			this.result = null;
			this.error = e;
		}

		this.line = null;
	};

	Expression.prototype.eval = function (scope) {
		this.scopeInput = scopeClone(scope);
		this.scopeOutput = scopeClone(this.scopeInput);

		try {
			this.result = this.parse.eval(this.scopeOutput);
			this.error = null;
		} catch (e) {
			this.result = null;
			this.error = e;
		}
	};

	window.Calque = Calque;
})();