var portNum = 3000;

/*
var dgram = require('dgram');
var broadcastServer = dgram.createSocket('udp4');

broadcastServer.bind(4000);

//when client ask for ip and port from broadcasting, send it to that client
broadcastServer.on('message', (msg, rinfo) => {
	var message = portNum.toString();
	broadcastServer.send(message, 0, message.length, rinfo.port, rinfo.address);
});
*/

var express = require('express');
var socket = require('socket.io');

var app = express();
var server  = app.listen(portNum);
//app.use(express.static('public'));
app.get('/',function(req,res) {
	res.sendFile(__dirname + '/index.html');
});

console.log("Server is running ...");

var io = socket(server);
io.sockets.on('connection', newConnection);

var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://rom:nenaneno@ds259855.mlab.com:59855/realm-of-mine";
//var url = "mongodb://localhost:27017/mydb";


MongoClient.connect(url, function(err, db) {
	var myquery = {};
	db.collection("members").update(myquery, {$set: {online: false}}, function(err, res) {
	});
});

/*
MongoClient.connect(url, function(err, db) {
	if (err) {
		throw err;
	} else {
		var query = {};
		db.collection("members").find(query, { _id: false, name: true, pic: true, history: true, online: true, email: "" }).toArray(function(err, result) {
			console.log(result);
			db.close();
		});
	}
});

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  db.collection("members").drop(function(err, delOK) {
    if (err) throw err;
    if (delOK) console.log("Collection deleted");
    db.close();
  });
}); 


MongoClient.connect(url, function(err, db) {
	if (err) {
		throw err;
	} else {
		var query = {};
		db.collection("members").find(query, {}).toArray(function(err, result) {
			console.log(result);
			db.close();
		});
	}
});
*/

var onlinePlayerCount = 0;
var onlinePlayerList = [];
var matching_easy = [];
var matching_medium = [];
var matching_hard = [];
var game = [];
var history = [];
var allplayer = [];
var ranking = ["-","-","-","-","-"];

MongoClient.connect(url, function(err, db) {
	if (err) {
		throw err;
	} else {
		var query = {};
		db.collection("members").find(query, {}).toArray(function(err, result) {
			//console.log(result);
			allplayer = result;
			db.close();

			allplayer.sort(function(a, b) {
			    return parseFloat(a.score) - parseFloat(b.score);
			});
			
			ranking = allplayer.slice(0,5);
			//console.log(ranking);
		});
	}
});

function newConnection(socket) {
	// Assign name
	socket.on('name', function(data) {
		socket.nickname = data.name;
		socket.pic = data.pic;
		socket.position = onlinePlayerList.length;
		socket.isMember = data.isMember;
		socket.member = data.member;

		if(data.isMember) {
			MongoClient.connect(url, function(err, db) {
				if (err) throw err;
				db.collection("members").findOne({"email": data.member}, function(err, result) {
					if (err) throw err;
					if(result!=null) {
						// User already exist
						//socket.memberId = result._id;
						if(result.online) {
							onlinePlayerCount++;
							io.sockets.connected[socket.id].emit('server', false);
						} else {
							// Update online
							var myquery = {"email": data.member};
							db.collection("members").update(myquery, {$set: {online: true}}, function(err, res) {
								if (err) throw err;
								//io.sockets.connected[socket.id].emit('member', result._id);
								io.sockets.connected[socket.id].emit('server', true);
								db.close();
								// Player connect
								onlinePlayerCount++;
								onlinePlayerList.push({socketId: socket.id, nickname: socket.nickname, pic: socket.pic, member: socket.member, isMember: socket.isMember});

								// Annouce Player
								console.log("[Connected][Member] " + socket.nickname + " [Online] " + onlinePlayerCount);
								io.emit('onlinePlayerCount', onlinePlayerCount);
								io.emit('onlinePlayerList', onlinePlayerList);
								io.emit('ranking', ranking);
							});

							MongoClient.connect(url, function(err, db) {
								if (err) {
									throw err;
								} else {
									var query = {"email": data.member};
									db.collection("members").find(query, {}).toArray(function(err, result) {
										io.emit('history', result[0].history);
										db.close();
									});
								}
							});
						}
					} else {
						// Add user
						var myobj = { name: data.name, pic: data.pic, email: data.member, history: [], online: true, win: 0, lose: 0, draw: 0, score: 0};
						db.collection("members").insertOne(myobj, function(err, res) {
							if (err) throw err;
							//io.sockets.connected[socket.id].emit('member', myobj._id);
							io.sockets.connected[socket.id].emit('server', true);
							//socket.memberId = myobj._id;

							console.log("[Member] " + data.name + " [Added to database]");

							// Player connect
							onlinePlayerCount++;
							onlinePlayerList.push({socketId: socket.id, nickname: socket.nickname, pic: socket.pic, member: socket.member, isMember: socket.isMember});

							// Annouce Player
							console.log("[Connected][Member] " + socket.nickname + " [Online] " + onlinePlayerCount);
							io.emit('onlinePlayerCount', onlinePlayerCount);
							io.emit('onlinePlayerList', onlinePlayerList);
							io.emit('ranking', ranking);
						});
					}
					db.close();
				});
			});
		} else {
			// Login Success
			io.sockets.connected[socket.id].emit('server', true);
			// Player connect
			onlinePlayerCount++;
			onlinePlayerList.push({socketId: socket.id, nickname: socket.nickname, pic: socket.pic, member: socket.member, isMember: socket.isMember});

			// Annouce Player
			console.log("[Connected] " + socket.nickname + " [Online] " + onlinePlayerCount);
			io.emit('onlinePlayerCount', onlinePlayerCount);
			io.emit('onlinePlayerList', onlinePlayerList);
			io.emit('ranking', ranking);
		}
	});

	socket.on('start', function(data) {
		var select;
		if(data == "easy") {
			select = matching_easy;
		} else if(data == "medium") {
			select = matching_medium;
		} else if(data == "hard") {
			select = matching_hard;
		} else {
			console.log("No selected Mode!");
			return;
		}

		if(select.length == 0) {
			console.log("[Matching][" + data + "] Player 1 : " + socket.nickname);
			select.push({socketId: socket.id, nickname: socket.nickname, pic: socket.pic, member: socket.member, isMember: socket.isMember});
			// Let User know
			io.sockets.connected[socket.id].emit('matching', 1);
		} else {
			console.log("[Matching][" + data + "] Player 2 : " + socket.nickname);
			select.push({socketId: socket.id, nickname: socket.nickname, pic: socket.pic, member: socket.member, isMember: socket.isMember});
			// Let User know
			io.sockets.connected[socket.id].emit('matching', 2);
			console.log("[Game][" + data + "] " + game.length + " Start [" + select[0].nickname + ", " + select[1].nickname + "]");

			// Game Setting
			if(random(0,1) >= 0.5) {
				var turn = 1;
			} else {
				var turn = 2;
			}
			var detail = {
				player1_socketId: select[0].socketId,
				player2_socketId: select[1].socketId,
				player1_nickname: select[0].nickname,
				player2_nickname: select[1].nickname,
				player1_member: select[0].member,
				player2_member: select[1].member,
				player1_isMember: select[0].isMember,
				player2_isMember: select[1].isMember,
				player1_pic: select[0].pic,
				player2_pic: select[1].pic,
				player1_score: 0,
				player2_score: 0,
				player1_combo: 1,
				player2_combo: 1,
				turn: turn,
				mode: data
			}
			game.push(detail);

			// Send Game Setting
			// Can use data for game setting
			//var mode = randomBombAndTrap(6, 6, 10, 5);
			var mode;
			if(data == "easy") {
				mode = randomBombAndTrap(3, 3, 3, 2);
			} else if(data == "medium") {
				mode = randomBombAndTrap(5, 5, 8, 5);
			} else if(data == "hard") {
				mode = randomBombAndTrap(6, 6, 12, 10);
			} else {
				console.log("Test mode!");
				mode = randomBombAndTrap(2, 2, 1, 1);
			}
			io.sockets.connected[select[0].socketId].emit('matching', detail);
			io.sockets.connected[select[0].socketId].emit('mode', mode);
			io.sockets.connected[select[1].socketId].emit('matching', detail);
			io.sockets.connected[select[1].socketId].emit('mode', mode);

			// Reset
			if(data == "easy") {
				matching_easy = [];
			} else if(data == "medium") {
				matching_medium = [];
			} else if(data == "hard") {
				matching_hard = [];
			} else {
				console.log("No selected Mode to clear!");
			}
		}
	});

	socket.on('sync', function(data) {
		//console.log(data);
		var gameIndex;
		var player = data.player;
		if(player == 1) {
			gameIndex = indexArray("player1_socketId", data.playerSocket, game);
		} else {
			gameIndex = indexArray("player2_socketId", data.playerSocket, game);
		}

		if(!data.foul) {
			// Update score
			game[gameIndex]['bomb'] = false;
			game[gameIndex]['trap'] = false;

			if(data.bomb) {
				// Update Score
				game[gameIndex]['player' + player + '_score'] += (1 * game[gameIndex]['player' + player + '_combo']);
				console.log("[Game][" + game[gameIndex]['mode'] + "] " + gameIndex + " Score [" + game[gameIndex]['player1_score'] + " - " + game[gameIndex]['player2_score'] + "]");
				game[gameIndex]['bomb'] = true;
				// Update Combo
				if(game[gameIndex]['player' + player + '_combo'] < 5) game[gameIndex]['player' + player + '_combo'] += 1;
			} else if(data.trap) {
				// Update Score
				if(game[gameIndex]['player' + player + '_score'] > 0) game[gameIndex]['player' + player + '_score'] -= 1;
				console.log("[Game][" + game[gameIndex]['mode'] + "] " + gameIndex + " Score [" + game[gameIndex]['player1_score'] + " - " + game[gameIndex]['player2_score'] + "]");
				game[gameIndex]['trap'] = true;
				// Update Combo
				game[gameIndex]['player' + player + '_combo'] = 1;
			} else {
				// Update Combo
				game[gameIndex]['player' + player + '_combo'] = 1;
			}

			// Add last position
			game[gameIndex]['x'] = data.x;
			game[gameIndex]['y'] = data.y;			
		} else {
			game[gameIndex]['bomb'] = data.bomb;
			game[gameIndex]['trap'] = data.trap;
		}

		game[gameIndex]['foul'] = true;
		//game[gameIndex]['bomb'] = data.bomb;

		// Update turn
		if(game[gameIndex]['turn']==1) game[gameIndex]['turn'] = 2;
		else game[gameIndex]['turn'] = 1;
		
		// Sync Update
		io.sockets.connected[game[gameIndex]['player1_socketId']].emit('syncGame', game[gameIndex]);
		io.sockets.connected[game[gameIndex]['player2_socketId']].emit('syncGame', game[gameIndex]);
	});

	socket.on('end', function(data) {
		var gameIndex;
		var player = data.player;
		var winner = data.winner;

		if(player == 1) {
			gameIndex = indexArray("player1_socketId", data.playerSocket, game);
		} else {
			gameIndex = indexArray("player2_socketId", data.playerSocket, game);
		}

		if(gameIndex>-1 && data.end) {
			var status1 = 0;
			var status2 = 0;
			
			if(winner==0) {
				winner = "Draw";
				status1 = 0;
				status2 = 0;
			} else if(winner==1) {
				winner = game[gameIndex].player1_nickname;
				status1 = 1;
				status2 = -1;
			} else if(winner==2) {
				winner = game[gameIndex].player2_nickname;
				status1 = -1;
				status2 = 1;
			} else {
				winner = "Error";
			}
			
			console.log("[Game] " + gameIndex + " End [" + game[gameIndex].player1_nickname + ", " + game[gameIndex].player2_nickname + "] Winner [" + winner + "]");

			// Update History for each player
			io.sockets.connected[game[gameIndex]['player1_socketId']].emit('history2', game[gameIndex]);
			io.sockets.connected[game[gameIndex]['player2_socketId']].emit('history2', game[gameIndex]);

			if(game[gameIndex].player1_isMember) {
				var member = game[gameIndex]['player1_member'];
				var newvalues = game[gameIndex];
				var upScore = game[gameIndex]['player1_score'];
				// Update database
				MongoClient.connect(url, function(err, db) {
					if (err) throw err;
					var myquery = {'email': member};
					db.collection("members").update(myquery, { $push: {'history': newvalues}}, function(err, res) {
						if (err) throw err;
						db.close();
					});
					// Update win lose score
					db.collection("members").update(myquery, { $inc: {'score': upScore}}, function(err, res) {
						if (err) throw err;
						db.close();
					});
					if(status1==0) {
						db.collection("members").update(myquery, { $inc: {'draw': 1}}, function(err, res) {
							if (err) throw err;
							db.close();
						});
					} else if(status1==1) {
						db.collection("members").update(myquery, { $inc: {'win': 1}}, function(err, res) {
							if (err) throw err;
							db.close();
						});
					} else if(status1==-1) {
						db.collection("members").update(myquery, { $inc: {'lose': 1}}, function(err, res) {
							if (err) throw err;
							db.close();
						});
					}
				});
			}

			if(game[gameIndex].player2_isMember) {
				var member = game[gameIndex]['player2_member'];
				var newvalues = game[gameIndex];
				var upScore = game[gameIndex]['player2_score'];
				// Update database
				MongoClient.connect(url, function(err, db) {
					if (err) throw err;
					var myquery = {'email': member};
					db.collection("members").update(myquery, { $push: {'history': newvalues}}, function(err, res) {
						if (err) throw err;
						db.close();
					});
					// Update win lose score
					db.collection("members").update(myquery, { $inc: {'score': upScore}}, function(err, res) {
						if (err) throw err;
						db.close();
					});
					if(status2==0) {
						db.collection("members").update(myquery, { $inc: {'draw': 1}}, function(err, res) {
							if (err) throw err;
							db.close();
						});
					} else if(status2==1) {
						db.collection("members").update(myquery, { $inc: {'win': 1}}, function(err, res) {
							if (err) throw err;
							db.close();
						});
					} else if(status2==-1) {
						db.collection("members").update(myquery, { $inc: {'lose': 1}}, function(err, res) {
							if (err) throw err;
							db.close();
						});
					}
				});
			}

			// Update ranking
			MongoClient.connect(url, function(err, db) {
				if (err) {
					throw err;
				} else {
					var query = {};
					db.collection("members").find(query, {}).toArray(function(err, result) {
						//console.log(result);
						allplayer = result;
						db.close();

						allplayer.sort(function(a, b) {
						    return parseFloat(a.score) - parseFloat(b.score);
						});
						
						ranking = allplayer.slice(0,5);
						//console.log(ranking);
						io.emit('ranking', ranking);
					});
				}
			});

			history.push(game[gameIndex]);
			game.splice(gameIndex,1);
		}
	});

	// Player disconnect
	socket.on('disconnect', function() {
		if(onlinePlayerCount > 0) onlinePlayerCount--;
		var disIndex = indexArray("socketId", socket.id, onlinePlayerList);
		if(disIndex>-1) onlinePlayerList.splice(disIndex,1);

		console.log("[Disconnected] " + socket.nickname + " [Online] " + onlinePlayerCount);
		socket.broadcast.emit('onlinePlayerCount', onlinePlayerCount);
		socket.broadcast.emit('onlinePlayerList', onlinePlayerList);
		var dat = {
			isMember: socket.isMember,
			member: socket.member
		}
		socket.broadcast.emit('out', dat);

		// Change to offline
		if(socket.isMember) {
			MongoClient.connect(url, function(err, db) {
				var myquery = {"email": socket.member};
				db.collection("members").update(myquery, {$set: {online: false}}, function(err, res) {
				});
			});
		}

		// Remove from matching if exist
		if(matching_easy.length > 0) {
			if(matching_easy[0].socketId == socket.id) {
				console.log("[Matching][easy] Disconnected " + matching_easy[0].nickname);
				matching_easy = [];
			}
		}
		if(matching_medium.length > 0) {
			if(matching_medium[0].socketId == socket.id) {
				console.log("[Matching][medium] Disconnected " + matching_medium[0].nickname);
				matching_medium = [];
			}
		}
		if(matching_hard.length > 0) {
			if(matching_hard[0].socketId == socket.id) {
				console.log("[Matching][hard] Disconnected " + matching_hard[0].nickname);
				matching_hard = [];
			}
		}

		// Tell another user
		var gameIndex = Math.max(indexArray("player1_socketId", socket.id, game), indexArray("player2_socketId", socket.id, game));
		if(gameIndex>=0) {
			console.log("[Game] " + gameIndex + " Disconnect [" + game[gameIndex].player1_nickname + ", " + game[gameIndex].player2_nickname + "]");
			if(game[gameIndex]['player1_socketId'] == socket.id) {
				io.sockets.connected[game[gameIndex]['player2_socketId']].emit('disGame', true);
			} else {
				io.sockets.connected[game[gameIndex]['player1_socketId']].emit('disGame', true);
			}
			history.push(game[gameIndex]);
			game.splice(gameIndex,1);
		}
	});
}

function random(min,max) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}

function indexArray(field, value, arr) {
	for (var i = 0; i < arr.length; i++) {
		if(arr[i][field] == value) {
			return i;
		}
	}
	return -1;
}

function randomBombAndTrap(cols, rows, totalBomb, totalTrap) {
	var dat = [];	

	if(totalBomb + totalTrap > cols * rows) {
		totalTrap = ( cols * rows ) - totalBomb;
	}

	//Pick Bomb
	var bucket = [];
	var bomb = [];
	var trap = [];
	for (var i = 0; i < cols; i++) {
		for (var j = 0; j < rows; j++) {
			bucket.push([i, j]);
		}
	}

	for (var i = 0; i < totalBomb; i++) {
		var index = random(0, bucket.length);
		var choice = bucket[index];
		if(choice == null) {
			i--;
		} else {
			var col = choice[0];
			var row = choice[1];
			bomb.push([col, row]);
			bucket.splice(index, 1);
		}
	}

	//Pick Trap
	for (var i = 0; i < totalTrap; i++) {
		var index = random(0, bucket.length);
		var choice = bucket[index];
		if(choice == null) {
			i--;
		} else {
			var col = choice[0];
			var row = choice[1];
			trap.push([col, row]);
			bucket.splice(index, 1);
		}
	}

	//Pick Tile
	var tile = make2DArray(cols, rows);
	var ran;
	var cover;
	for (var i = 0; i < cols; i++) {
		for (var j = 0; j < rows; j++) {
			ran = random(1,5);
			if(ran == 1) {
				cover = 1;
			} else if(ran == 2) {
				cover = 2;
			} else if(ran == 3) {
				cover = 3;
			} else if(ran == 4) {
				cover = 4;
			} else {
				cover = 5;
			}
			tile[i][j] = cover;
		}
	}

	dat.push(cols);
	dat.push(rows);
	dat.push(bomb);
	dat.push(trap);
	dat.push(tile);
	return dat;
}

function make2DArray(cols, rows) {
	var arr = new Array(cols);
	for (var i = 0; i < arr.length ; i++) {
		arr[i] = new Array(rows);
	}
	return arr;
}

var stdin = process.openStdin();

stdin.addListener("data", function(d) {
	//console.log("you entered: [" + d.toString().trim() + "]");
	var input = d.toString().trim();
	if(input == "reset") {
		console.log("Server has been reset!");
	} else if(input == "rank") {
		//console.log(ranking);
		if(ranking.length==0) console.log("No Ranking");
		for (var i = 0; i < ranking.length; i++) {
			var no = i+1;
			console.log("[" + no + "][" + ranking[i].name + "] Score: " + ranking[i].score + " W/D/L: " + ranking[i].win + "/" + ranking[i].draw + "/" + ranking[i].lose);
		}
	} else if(input == "history") {
		//console.log(history);
		if(history.length==0) console.log("No History");
		for (var i = 0; i < history.length; i++) {
			console.log("[History] [" + history[i].mode + "][" + history[i].player1_nickname + ", " + history[i].player2_nickname + "]" + " [" + history[i].player1_score + " - " + history[i].player2_score + "]");
		}
	} else if(input == "online") {
		console.log(onlinePlayerCount + " player(s) online");
		for (var i = 0; i < onlinePlayerList.length; i++) {
			console.log(onlinePlayerList[i].nickname + " is online");
		}
	}
});