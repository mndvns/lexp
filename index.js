/*
 * Module dependencies.
 */

var Lexer = module.exports = function Lexer(str, filename, options) {
  this.options = options || {};
  this.input = str.replace(/\r\n|\r/g, '\n');
  this.filename = filename;
  this.deferredTokens = [];
  this.lineno = 1;
  this.stash = [];
  this.indentStack = [];
};

Lexer.prototype = {
  tok: function(type, val) {
    return {
      type: type,
      line: this.lineno,
      val: val
    };
  },

  consume: function(len) {
    this.input = this.input.substr(len);
  },

  scan: function(regexp, type) {
    var captures;
    if (captures = regexp.exec(this.input)) {
      this.consume(captures[0].length);
      return this.tok(type, captures[1]);
    }
  },

  defer: function(tok) {
    this.deferredTokens.push(tok);
  },

  lookahead: function(n) {
    var fetch = n - this.stash.length;
    while (fetch-- > 0) this.stash.push(this.next());
    return this.stash[--n];
  },

  stashed: function() {
    return this.stash.length && this.stash.shift();
  },

  deferred: function() {
    return this.deferredTokens.length
      && this.deferredTokens.shift();
  },

  eos: function() {
    if (this.input.length) return;
    if (this.indentStack.length) {
      this.indentStack.shift();
      return this.tok('outdent');
    } else {
      return this.tok('eos');
    }
  },

  indent: function() {
    var captures, re;

    re = /^\n(\t*) */;
    captures = re.exec(this.input);

    // spaces
    if (captures && !captures[1].length) {
      re = /^\n( *)/;
      captures = re.exec(this.input);
    }

    if (captures) {
      var tok;
      var indents = captures[1].length;

      ++this.lineno;
      this.consume(indents + 1);

      // blank line
      if ('\n' == this.input[0]) return this.tok('newline');

      // outdent
      if (this.indentStack.length && indents < this.indentStack[0]) {
        while (this.indentStack.length && this.indentStack[0] > indents) {
          this.stash.push(this.tok('outdent'));
          this.indentStack.shift();
        }
        tok = this.stash.pop();
      // indent
      } else if (indents && indents != this.indentStack[0]) {
        this.indentStack.unshift(indents);
        tok = this.tok('indent', indents);
      // newline
      } else {
        tok = this.tok('newline');
      }

      return tok;
    }
  },

  warn: function () {
    var tok;
    if (tok = this.scan(/^([^\.\n][^\n]+)/, 'text')) {
      console.warn('Warning: missing space before text for line ' +
                   this.lineno + ' of file "' + this.filename + '"');
      return tok;
    }
  },

  fail: function () {
    if (/^ ($|\n)/.test(this.input)) {
      this.consume(1);
      return this.next();
    }
    throw new Error('unexpected text ' + this.input.substr(0, 5));
  },

  advance: function(){
    return this.stashed()
      || this.next();
  },

  select: function(){
    if (!this.options.length) return;
    var captures;
    var args;
    var str;
    var re;
    for (var i = 0, l = this.options.length; i < l; i++) {
      for (str in this.options[i]) {
        if (!~str.indexOf('select')) return;
        args = str.replace('select ', '').split(' ');
        re = new RegExp(this.options[i][str]);
        if (captures = re.exec(this.input)) {
          this.consume(captures[0].length);
          return this.tok(args[0], captures[1]);
        }
      }
    }
  },

  next: function() {
    var i = 0;
    return this.deferred()
      || this.eos()
      || this.select()
      || this.indent()
      || this.warn()
      || this.fail();
  }
};
