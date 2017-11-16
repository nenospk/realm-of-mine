console.log("Client is running ...");
console.log("Searching for server ...");

var ip = require('ip');
//var cmd = require('node-cmd');

/*
var firstvariable = "Subnet Mask . . . . . . . . . . . : ";
var secondvariable = " Default Gateway . . . . . . . . .";
var test = "Subnet Mask . . . . . . . . . . . : 255.255.255.0 Default Gateway . . . . . . . . .";
var a = test.match(new RegExp(firstvariable + "(.*)" + secondvariable));
//console.log(a[1]);
*/

var os = require('os');
var network = os.networkInterfaces();

var subnetmask = '';

for(i in network){
	for(j in network[i]){
		if(network[i][j].family=="IPv4" && !network[i][j].internal) {
			subnetmask = network[i][j].netmask;
			findServer();
			detect();
		}
	}
}

/*
cmd.get(
    'ipconfig',
    function(err, data, stderr){
    	/*
    	var firstvariable = "   Subnet Mask . . . . . . . . . . . : ";
    	var secondvariable = "   Default Gateway . . . . . . . . .";
    	var result = data.match(new RegExp(firstvariable + "(.*)" + secondvariable));
    	

    	var index_1 = data.search("Subnet Mask . . . . . . . . . . . :") + 36;
    	var index_2 = data.search("Default Gateway . . . . . . . . . :")
    	var sub = data.substring(index_1, index_2);
    	subnetmask = sub.trim();
    	//console.log(subnetmask);
    	findServer();
    }
);
*/

var express = require('express');
var socket = require('socket.io');

var app = express();
var server  = app.listen(5001);

app.use(express.static('public'));

var io = socket(server);

var setup;

function findServer() {
	// Find server
	var broadcast_addr = ip.or(ip.address(), ip.not(subnetmask));
	var port = 4000;

	var dgram = require('dgram');
	var client = dgram.createSocket('udp4');
	client.bind( function() { client.setBroadcast(true) } );

	//request data
	var message = '';
	client.send(message, 0, message.length, port, broadcast_addr);

	client.on('message', (msg, rinfo) => {
		setup = rinfo.address + ':' + msg.toString();
		//console.log("Server: " + setup);
		//console.log(setup);
		client.close();
	});
}

function detect() {

/*
	function myFunc() {
		if(setup==null) {
			console.log("Server is unavailable!");
		}
	}
	setTimeout(myFunc, 2000);
*/
	var again = setInterval(function(){
		if(setup==null) {
			console.log("Server is unavailable!");
			console.log("Try again in 3 seconds");
			findServer();
		} else {
			clearInterval(again);
			console.log("----------------------------------------");
			console.log("Server is now available!");
			console.log("Server: " + setup);
			io.sockets.on('connection', function(socket){
				//console.log("Client connected");
				io.sockets.connected[socket.id].emit('server', setup);
				socket.on('disconnect', function() {
					//console.log("Client disconnected");
				});
			});
		}
	}, 3000);
}