/*
 * Module dependencies.
 */

var Lax = require('..');
var readdir = require('fs').readdirSync;
var read = require('fs').readFileSync;
var util = require('util');
var yaml = require('js-yaml');

process.stdout.write('\u001b[2J');

readdir('test/cases').forEach(function(file){
  var title = file.split('.raw')[0];
  describe(file, function(){
    it('should do stuff', function(){
      if (~file.indexOf('yml')) return;
      var raw = read('test/cases/' + title + '.raw', 'utf8');
      var yml = yaml.load(read('test/cases/' + title + '.yml', 'utf8'));

      var lax = new Lax(raw, file, yml.options);

      var toks = [];
      while (lax.input.length) {
        toks.push(lax.advance());
      }

      log(toks);

      for (var k, i = 0, l = yml.tokens.length; i < l; i++) {
        for (k in yml.tokens[i]) {
          toks[i][k].should.equal(yml.tokens[i][k]);
        }
      }

      log(toks)
    });
  });
});

function log(obj, str) {
  console.log();
  if (str) console.log(str.blue, '\n');
  console.log(util.inspect(obj, false, 12, true));
}
