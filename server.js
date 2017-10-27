var express = require('express');
var socket = require('socket.io');

var app = express();
var server = app.listen(3000);

app.use(express.static('public'));

console.log("Server is running ...");

var io = socket(server);
io.sockets.on('connection', newConnection);

var onlinePlayerCount = 0;
var onlinePlayerList = [];
var matching_easy = [];
var matching_medium = [];
var matching_hard = [];
var game = [];
var history = [];
var ranking = [];

function newConnection(socket) {
    io.sockets.connected[socket.id].emit('server', "You're connected to server");

    // Assign name
    socket.on('name', function(data) {
        socket.nickname = data.name;
        socket.pic = data.pic;
        socket.position = onlinePlayerList.length;

        // Player connect
        onlinePlayerCount++;
        onlinePlayerList.push({ socketId: socket.id, nickname: socket.nickname, pic: socket.pic });

        // Annouce Player
        console.log("[Connected] " + socket.nickname + " [Online] " + onlinePlayerCount);
        io.emit('onlinePlayerCount', onlinePlayerCount);
        io.emit('onlinePlayerList', onlinePlayerList);

        //Set current Ranking
        io.emit('ranking', ranking);
        //console.log("ranking from start: ");
        //console.log(ranking);

    });

    socket.on('start', function(data) {
        var select;
        if (data == "easy") {
            select = matching_easy;
        } else if (data == "medium") {
            select = matching_medium;
        } else if (data == "hard") {
            select = matching_hard;
        } else {
            console.log("No selected Mode!");
            return;
        }

        if (select.length == 0) {
            console.log("[Matching][" + data + "] Player 1 : " + socket.nickname);
            select.push({ socketId: socket.id, nickname: socket.nickname, pic: socket.pic });
            // Let User know
            io.sockets.connected[socket.id].emit('matching', 1);
        } else {
            console.log("[Matching][" + data + "] Player 2 : " + socket.nickname);
            select.push({ socketId: socket.id, nickname: socket.nickname, pic: socket.pic });
            // Let User know
            io.sockets.connected[socket.id].emit('matching', 2);
            console.log("[Game][" + data + "] " + game.length + " Start [" + select[0].nickname + ", " + select[1].nickname + "]");

            // Game Setting
            if (random(0, 1) >= 0.5) {
                var turn = 1;
            } else {
                var turn = 2;
            }
            var detail = {
                player1_socketId: select[0].socketId,
                player2_socketId: select[1].socketId,
                player1_nickname: select[0].nickname,
                player2_nickname: select[1].nickname,
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
            if (data == "easy") {
                mode = randomBombAndTrap(3, 3, 3, 2);
            } else if (data == "medium") {
                mode = randomBombAndTrap(5, 5, 8, 5);
            } else if (data == "hard") {
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
            if (data == "easy") {
                matching_easy = [];
            } else if (data == "medium") {
                matching_medium = [];
            } else if (data == "hard") {
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
        if (player == 1) {
            gameIndex = indexArray("player1_socketId", data.playerSocket, game);
        } else {
            gameIndex = indexArray("player2_socketId", data.playerSocket, game);
        }

        if (!data.foul) {
            // Update score
            game[gameIndex]['bomb'] = false;
            game[gameIndex]['trap'] = false;

            if (data.bomb) {
                // Update Score
                game[gameIndex]['player' + player + '_score'] += (1 * game[gameIndex]['player' + player + '_combo']);
                console.log("[Game][" + game[gameIndex]['mode'] + "] " + gameIndex + " [Score] " + game[gameIndex]['player1_score'] + " - " + game[gameIndex]['player2_score']);
                game[gameIndex]['bomb'] = true;
                // Update Combo
                if (game[gameIndex]['player' + player + '_combo'] < 5) game[gameIndex]['player' + player + '_combo'] += 1;
            } else if (data.trap) {
                // Update Score
                if (game[gameIndex]['player' + player + '_score'] > 0) game[gameIndex]['player' + player + '_score'] -= 1;
                console.log("[Game][" + game[gameIndex]['mode'] + "] " + gameIndex + " [Score] " + game[gameIndex]['player1_score'] + " - " + game[gameIndex]['player2_score']);
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
        if (game[gameIndex]['turn'] == 1) game[gameIndex]['turn'] = 2;
        else game[gameIndex]['turn'] = 1;

        // Sync Update
        io.sockets.connected[game[gameIndex]['player1_socketId']].emit('syncGame', game[gameIndex]);
        io.sockets.connected[game[gameIndex]['player2_socketId']].emit('syncGame', game[gameIndex]);
    });

    socket.on('end', function(data) {
        var gameIndex;
        var player = data.player;
        var winner = data.winner;

        if (player == 1) {
            gameIndex = indexArray("player1_socketId", data.playerSocket, game);
        } else {
            gameIndex = indexArray("player2_socketId", data.playerSocket, game);
        }

        if (gameIndex > -1 && data.end) {

            if (winner == 0) {
                winner = "Draw";
            } else if (winner == 1) {
                winner = game[gameIndex].player1_nickname;
            } else if (winner == 2) {
                winner = game[gameIndex].player2_nickname;
            } else {
                winner = "Error";
            }

            console.log("[Game] " + gameIndex + " End [" + game[gameIndex].player1_nickname + ", " + game[gameIndex].player2_nickname + "] Winner [" + winner + "]");

            // Update History for each player
            io.sockets.connected[game[gameIndex]['player1_socketId']].emit('history', game[gameIndex]);
            io.sockets.connected[game[gameIndex]['player2_socketId']].emit('history', game[gameIndex]);
        
            history.push(game[gameIndex]);
            ranking.push(game[gameIndex]);
            ranking = ranking.sort(compareScore); //sort array of games by compare diff in score

            // Update ranking
            io.sockets.connected[game[gameIndex]['player1_socketId']].emit('ranking', ranking);
            io.sockets.connected[game[gameIndex]['player2_socketId']].emit('ranking', ranking);

            game.splice(gameIndex, 1);

            //console.log(history);
            console.log(ranking);
        }
    });

    // Player Logout
    socket.on('logout', function(data) {
        socket.disconnect();
        console.log(socket + " Logout");
    });

    // Player disconnect
    socket.on('disconnect', function() {
        if (onlinePlayerCount > 0) onlinePlayerCount--;
        var disIndex = indexArray("socketId", socket.id, onlinePlayerList);
        if (disIndex > -1) onlinePlayerList.splice(disIndex, 1);

        console.log("[Disconnected] " + socket.nickname + " [Online] " + onlinePlayerCount);
        socket.broadcast.emit('onlinePlayerCount', onlinePlayerCount);
        socket.broadcast.emit('onlinePlayerList', onlinePlayerList);

        // Remove from matching if exist
        if (matching_easy.length > 0) {
            if (matching_easy[0].socketId == socket.id) {
                console.log("[Matching][easy] Disconnected " + matching_easy[0].nickname);
                matching_easy = [];
            }
        }
        if (matching_medium.length > 0) {
            if (matching_medium[0].socketId == socket.id) {
                console.log("[Matching][medium] Disconnected " + matching_medium[0].nickname);
                matching_medium = [];
            }
        }
        if (matching_hard.length > 0) {
            if (matching_hard[0].socketId == socket.id) {
                console.log("[Matching][hard] Disconnected " + matching_hard[0].nickname);
                matching_hard = [];
            }
        }

        // Tell another user
        var gameIndex = Math.max(indexArray("player1_socketId", socket.id, game), indexArray("player2_socketId", socket.id, game));
        if (gameIndex >= 0) {
            console.log("[Game] " + gameIndex + " Disconnect [" + game[gameIndex].player1_nickname + ", " + game[gameIndex].player2_nickname + "]");
            if (game[gameIndex]['player1_socketId'] == socket.id) {
                io.sockets.connected[game[gameIndex]['player2_socketId']].emit('disGame', true);
            } else {
                io.sockets.connected[game[gameIndex]['player1_socketId']].emit('disGame', true);
            }
            history.push(game[gameIndex]);
            game.splice(gameIndex, 1);
        }
    });
}

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function indexArray(field, value, arr) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i][field] == value) {
            return i;
        }
    }
    return -1;
}

function randomBombAndTrap(cols, rows, totalBomb, totalTrap) {
    var dat = [];

    if (totalBomb + totalTrap > cols * rows) {
        totalTrap = (cols * rows) - totalBomb;
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
        if (choice == null) {
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
        if (choice == null) {
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
            ran = random(1, 5);
            if (ran == 1) {
                cover = 1;
            } else if (ran == 2) {
                cover = 2;
            } else if (ran == 3) {
                cover = 3;
            } else if (ran == 4) {
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
    for (var i = 0; i < arr.length; i++) {
        arr[i] = new Array(rows);
    }
    return arr;
}

function compareScore(game1,game2){
    var dif1 = Math.abs(game1.player1_score-game1.player2_score);
    //console.log('dif1 = '+dif1);
    var dif2 = Math.abs(game2.player1_score-game2.player2_score);
    // console.log('dif2 = '+dif2);
    // console.log('dif1-dif2 = '+(dif1-dif2));
    return dif2-dif1;
}

var stdin = process.openStdin();

stdin.addListener("data", function(d) {
    console.log("you entered: [" + d.toString().trim() + "]");
});