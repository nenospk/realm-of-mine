console.log("Client is running ...");

// Find server
var broadcast_addr = '192.168.1.255';
var port = 4000;
var setup;

var dgram = require('dgram');
var client = dgram.createSocket('udp4');

//request data
var message = '';
client.send(message, 0, message.length, port, broadcast_addr);

client.on('message', (msg, rinfo) => {
	setup = rinfo.address + ':' + msg.toString();
	console.log("Server: " + setup);
	//console.log(setup);
	client.close();
});

var express = require('express');
var socket = require('socket.io');

var app = express();
var server  = app.listen(5000);

app.use(express.static('public'));

var io = socket(server);
io.sockets.on('connection', function(socket){
	console.log("Client connected");
	io.sockets.connected[socket.id].emit('server', setup);
});

io.sockets.on('connection', function(socket){
	console.log("Client connected");
	io.sockets.connected[socket.id].emit('server', setup);
});

if(setup==null) console.log("Server is unavailable!");