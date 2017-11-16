
buffer-split
==================
node buffer extension: support `split`

### Installation
```sh
$ npm install buffer-extent-split --save
```

### Usage
```js
var buf = new Buffer('beep\r\nboop');
var list = buf.split('\r\n');
// or
// var list = buf.split([10, 13]);
assert.equal(list[0], 'beep');
assert.equal(list[1], 'boop');
```

### License
MIT
