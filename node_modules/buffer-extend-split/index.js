
Buffer.prototype.split = function(delim) {
  if (!(delim instanceof Buffer)) {
    delim = new Buffer(delim);
  }
  var buf = this;
  var ret = [];
  var delimIdx = 0;
  var stOffset = 0;
  var edOffset = 0;
  var histroy = [];

  for (var i = 0; i < this.length; i++) {
    if (buf[i] === delim[delimIdx]) {
      histroy.push(i);
      delimIdx += 1;
    }
    if (delimIdx === delim.length) {
      edOffset = histroy[0];
      ret.push(buf.slice(stOffset, edOffset));
      stOffset = edOffset + delim.length;
      delimIdx = 0;
      histroy = [];
    }
  }

  ret.push(buf.slice(stOffset, this.length));
  return ret;
};

module.exports = Buffer;