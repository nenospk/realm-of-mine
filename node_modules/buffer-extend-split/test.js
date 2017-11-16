
var test = require('tape');
var Buffer = require('./index');

test('split buffer by single char', function(t) {
  var buf = new Buffer('beep beep \n haha\n abc\n ');
  var list = buf.split('\n');
  t.equal(list[0].toString(), 'beep beep ');
  t.equal(list[1].toString(), ' haha');
  t.equal(list[2].toString(), ' abc');
  t.equal(list[3].toString(), ' ');
  t.end();
});

test('split buffer by multi chars', function(t) {
  var buf = new Buffer('beep beep \n haha\n abc\n ');
  var list = buf.split('\n ');
  t.equal(list[0].toString(), 'beep beep ');
  t.equal(list[1].toString(), 'haha');
  t.equal(list[2].toString(), 'abc');
  t.equal(list[3].toString(), '');
  t.end();
});