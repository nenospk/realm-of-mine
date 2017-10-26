var socket;
var address = 'localhost:3000';

var imgBomb;
var imgTrap;

var imgTile1;
var imgTile2;
var imgTile3;
var imgTile4;
var imgTile5;
var imgTileActive;
var imgBombActive;

var imgNeigh1;
var imgNeigh2;
var imgNeigh3;
var imgNeigh4;
var imgNeigh5;
var imgNeigh6;
var imgNeigh7;
var imgNeigh8;

var bombSound;
var matchSound;

var myHistory = [];
var myRanking = [];

var canvas;
var onlineDiv;
var onlineLabel;
var timerDiv;
var turnLabel;
var playerDiv;
var playerLabel_1;
var playerLabel_2;
var picLabel_1;
var picLabel_2;
var scoreLabel_1;
var scoreLabel_2;
var nameLabel;
var nameLabel2;
var nameInputDiv;
var nameInput;
var okButton;
var startButton;
var logoutButton;
var fbLogoutButton;

var playingPanel;
var onlinePanel;
var findMatchPanel;

var fbStatus = false;
var fbID = "";
var fbName = "";
var fbEmail = "";
var fbPic = "";

var connected = false;
var mode;

var player;
var turn;
var player_1;
var player_2;
var pic_1;
var pic_2;
var score_1;
var score_2;
var timer;
var countTime = 10;

var canvasWidth = 300;
var grid;
var cols;
var rows;
var cellWidth;

function setup() {
	$(document).on('mousemove', function (e) {
		var x = e.pageX-100;
		var y = e.pageY-100;

		$('.mask').css('left', x+'px');
		$('.mask').css('top', y+'px');
	});

	imgBomb = loadImage("img/bomb.png");
	imgTrap = loadImage("img/trap.png");

	imgTile1 = loadImage("img/tile1.png");
	imgTile2 = loadImage("img/tile2.png");
	imgTile3 = loadImage("img/tile3.png");
	imgTile4 = loadImage("img/tile4.png");
	imgTile5 = loadImage("img/tile5.png");
	imgTileActive = loadImage("img/tileActive.png");
	imgBombActive = loadImage("img/bombActive.png")
	imgNeigh1 = loadImage('img/1.png');
	imgNeigh2 = loadImage('img/2.png');
	imgNeigh3 = loadImage('img/3.png');
	imgNeigh4 = loadImage('img/4.png');
	imgNeigh5 = loadImage('img/5.png');
	imgNeigh6 = loadImage('img/6.png');
	imgNeigh7 = loadImage('img/7.png');
	imgNeigh8 = loadImage('img/8.png');

	canvas = createCanvas(0,0);

	bombSound = loadSound('bombSound.mp3');
	matchSound = loadSound('sound/matchmaking.mp3');

	onlineDiv = select('#onlineDiv');
	onlineLabel = select('#onlineLabel');
	timerDiv = select('#timerDiv');
	turnLabel = select('#turnLabel');
	playerDiv = select('#playerDiv');
	playerLabel_1 = select('#playerLabel_1');
	playerLabel_2 = select('#playerLabel_2');
	picLabel_1 = select('#picLabel_1');
	picLabel_2 = select('#picLabel_2');
	scoreLabel_1 = select('#scoreLabel_1');
	scoreLabel_2 = select('#scoreLabel_2');
	nameLabel = select('#nameLabel');
	nameLabel2 = select('#nameLabel2');
	nameInputDiv = select('#nameInputDiv');
	nameInput = select('#nameInput');
	timerDiv = select('#timerDiv');
	okButton = select('#okButton');
	startButton = select('#startButton');
	logoutButton = select('#logoutButton');
	fbLogoutButton = select('#fbLogoutButton');

	playingPanel = select('#playingPanel');
	onlinePanel = select('#onlinePanel');
	findMatchPanel = select('#findMatchPanel');

	fbLogoutButton.hide();
	logoutButton.hide();
	playingPanel.hide();
	onlinePanel.hide();
	findMatchPanel.hide();
	onlineDiv.hide();

	$('.matchPanel').hide();
	$('.disPanel').hide();
	$('.resultPanel').hide();
	$('.hisPanel').hide();
	$('.rankPanel').hide();
	$('.alarmPanel').hide();

	nameInput.input(function() {
		nameLabel.html(nameInput.value());
	});

	logoutButton.mousePressed(function () {
		logout();
	});

	fbLogoutButton.mousePressed(function () {
		facebookLogout();
	});

	okButton.mousePressed(function() {
		if(!connected) {
			if(nameInput.value().length<3) {
				console.log("Enter name");
			} else {
				startConnection();
			}
		} else {
			console.log("Already connected");
		}
	});

	startButton.mousePressed(function() {
		if(connected) {
			if(mode=="match") {
				console.log("You're finding a match already");
			} else if(mode=="game") {
				console.log("You're currently on game");
			} else {
				if($('input[name=selectMode]:checked').val() == null) {
					$('.alarmPanel').show(1000);
					$('.alarmPanel').hide(3000);
				} else {
					socket.emit('start', $('input[name=selectMode]:checked').val());
				}
			}
		} else {
			console.log("Please connect to server");
		}
	});
}

function draw() {
	background(255);
	for (var i = 0; i < cols; i++) {
		for (var j = 0; j < rows; j++) {
			grid[i][j].show();
		}
	}
}

function startConnection(source) {
	socket = io.connect(address);
	var nameSet;
	var picSet;
	if(source == "fb") {
		nameSet = fbName;
		picSet = fbPic;
		fbLogoutButton.show();
	} else {
		nameSet = nameInput.value();
		picSet = "img/profile.png";
		logoutButton.show();
	}

	onlinePanel.show();
	findMatchPanel.show();
	onlineDiv.show();

	var dat = {
		name: nameSet,
		pic: picSet
	}
	socket.emit('name', dat);

	nameLabel2.html(nameSet);
	$('#profImg').attr('src', picSet);

	// Connected to server
	socket.on('server', function(data) {
		console.log(data);
		connected = true;
		socket_id = socket.id;
		$('.loginPanel').hide(1000);
	});

	// Update Online player
	socket.on('onlinePlayerCount', function(data) {
		onlineLabel.html(data);
	});

	// Matching
	socket.on('matching', function(data) {
		//console.log(data);

		// Reset
		$('#match1').attr('src', "img/profileWait.png");
		$('#match2').attr('src', "img/profileWait.png");
		$('#match2').css("border", "none");
		$('.resultPanel').hide(1000);
		$('.disPanel').hide(1000);

		// Matching and Starting Game
		if(data == 1 || data == 2) {
			console.log("Finding match ...");
			console.log("You are player " + data);
			mode = "match";
			player = data;
			$('.matchPanel').show(1000);
			if(data == 1) {
				$('#match1').attr('src', picSet);
			}
		} else {
			turn = data.turn;
			//turnLabel.html(data.turn);
			if(turn == 1) {
				//$('#turn_1').css("opacity", "1");
				//$('#turn_2').css("opacity", "0");
				//$('#turn_1').css("background-color", "black");
				//$('#turn_2').css("background-color", "white");
				$('.player_1_panel').addClass('shadow-pulse');
			} else {
				//$('#turn_2').css("opacity", "1");
				//$('#turn_1').css("opacity", "0");
				//$('#turn_2').css("background-color", "black");
				//$('#turn_1').css("background-color", "white");
				$('.player_2_panel').addClass('shadow-pulse');
			}

			player_1 = data.player1_nickname;
			player_2 = data.player2_nickname;
			playerLabel_1.html(player_1);
			playerLabel_2.html(player_2);

			score_1 = data.player1_score;
			score_2 = data.player2_score;
			scoreLabel_1.html(score_1);
			scoreLabel_2.html(score_2);

			pic_1 = data.player1_pic;
			pic_2 = data.player2_pic;
			$('#pic1Label').attr('src', pic_1);
			$('#pic2Label').attr('src', pic_2);

			$('#match1').attr('src', pic_1);
			$('#match2').attr('src', pic_2);

			socket.on('mode', function(data) {
				//console.log("Game Start");
				matchSound.play();
				setTimeout(function() {
					$('.matchPanel').hide(1000);
					createGame(data);
				}, 2000);
			});
		}
	});

	// Sync game
	socket.on('syncGame', function(data) {
		var player1_nickname = data.player1_nickname;
		var player2_nickname = data.player2_nickname;
		var player1_pic = data.player1_pic;
		var player2_pic = data.player2_pic;
		var player1_score = data.player1_score;
		var player2_score = data.player2_score;
		var player1_combo = data.player1_combo;
		var player2_combo = data.player2_combo;
		var playerturn = data.turn;
		var cellX = data.x;
		var cellY = data.y;

		// Update game
		grid[cellX][cellY].setReveal();

		// Update Combo
		$('#comboLabel_1').html(player1_combo);
		$('.player_1_combo').removeClass('combo');
		$('.player_1_combo').addClass('combo');
		$('#comboLabel_2').html(player2_combo);
		$('.player_2_combo').removeClass('combo');
		$('.player_2_combo').addClass('combo');

		var lastTurn = turn;

		// Update turn
		turn = playerturn;

		// Set timer
		if(lastTurn!=turn) {
			clearInterval(timer);
			countTime = 10;
			timerDiv.html(countTime);
			function time() {
				countTime--;
				if(countTime >= 0) {
					timerDiv.html(countTime);
				} else if(player == turn){
					var detail = {
						playerSocket: socket.id,
						player: player,
						foul: true,
						bomb: false
					}
					socket.emit('sync', detail);
					clearInterval(timer);
				}
			}
			timer = setInterval(time, 1000);
		}

		if(data.bomb) {
			bombSound.play();
		}

		if(data.trap) {
			//console.log("trap");
		}

		//turnLabel.html(turn);
		if(turn == 1) {
			$('.player_1_panel').addClass('shadow-pulse');
			$('.player_2_panel').removeClass('shadow-pulse');
		} else {
			$('.player_1_panel').removeClass('shadow-pulse');
			$('.player_2_panel').addClass('shadow-pulse');
		}

		// Update Name
		player_1 = player1_nickname;
		player_2 = player2_nickname;
		playerLabel_1.html(player_1);
		playerLabel_2.html(player_2);

		// Update Score
		score_1 = player1_score;
		score_2 = player2_score;
		scoreLabel_1.html(score_1);
		scoreLabel_2.html(score_2);

		checkEnd();

		// Update profile pic
		if(pic_1!=player1_pic) {
			pic_1 = player1_pic;
			$('#pic1Label').attr('src', pic_1);
		}
		if(pic_2!=player2_pic) {
			pic_2 = player2_pic;
			$('#pic2Label').attr('src', pic_1);
		}
	});

	socket.on('history', function(data) {
		myHistory.push(data);
		$('#hisLabel').append("<div> Mode : " + data.mode + " | " + data.player1_nickname + 
			" [" + data.player1_score + "]" + " VS " + 
			data.player2_nickname + " [" + data.player2_score + "]</div>");
		console.log(myHistory);
		myRanking = myHistory.sort(compareScore);
		console.log(myRanking);
		$('#rankLabel').html('');
		for (var i = 0; i <= myRanking.length; i++) {
			var winner;
			if(myRanking[i].player1_score > myRanking[i].player2_score){
				winner = myRanking[i].player1_nickname;
				score = myRanking[i].player1_score + "-" + myRanking[i].player2_score;
			}else if(myRanking[i].player1_score < myRanking[i].player2_score){
				winner = myRanking[i].player2_nickname;
				score = myRanking[i].player2_score + "-" + myRanking[i].player1_score;
			}else{
				winner = "draw";
				score = myRanking[i].player1_score + "-" + myRanking[i].player2_score;
			}
			$('#rankLabel').append("<div> "+(i+1)+") " + winner + " [ "+ score +" ] </div>");
		}
		
	});

	// socket.on('ranking', function(data) {
	// 	myRanking.push(data);
	// 	$('#rankLabel').append("<div> Mode : " + data.mode + " | " + data.player1_nickname + " [" + data.player1_score + "]" + " VS " + 
	// 		data.player2_nickname + " [" + data.player2_score + "]</div>");
	// });

	socket.on('disGame', function(data) {
		if(data) {
			//console.log("Another user disconnected");
			$('.disPanel').show(1000);
			clearInterval(timer);
			mode = "end";
		}
	});
}

function make2DArray(cols, rows) {
	var arr = new Array(cols);
	for (var i = 0; i < arr.length ; i++) {
		arr[i] = new Array(rows);
	}
	return arr;
}

function createGame(data) {
	cols = data[0];
	rows = data[1];
	var bomb = data[2];
	var trap = data[3];
	var tile = data[4];

	cellWidth = Math.floor(canvasWidth / cols);
	canvas = createCanvas(canvasWidth,canvasWidth);
	canvas.show();

	canvas.mousePressed(function() {
		// Need to check if in canvas
		if(mode == "game" && turn == player) {
			var cellX = floor(mouseX / cellWidth);
			var cellY = floor(mouseY / cellWidth);
			// Check grid already revealed
			if(!grid[cellX][cellY].revealed) {

				grid[cellX][cellY].setReveal();

				var bomb = false;
				var trap = false;

				if(grid[cellX][cellY].bomb) {
					bomb = true;
				}
				if(grid[cellX][cellY].trap) {
					trap = true;
				}

				var detail = {
					playerSocket: socket.id,
					player: player,
					bomb: bomb,
					trap: trap,
					x: cellX,
					y: cellY,
					foul: false,
				}

				socket.emit('sync', detail);

			} else {
				console.log("This spot already picked");
			}
		} else if(mode == "game" && turn != player) {
			console.log("Not your turn");
		}
	});

	mode = "game";

	// Initial Cell
	grid = make2DArray(cols,rows);

	// Assign Tile
	var a;
	for (var i = 0; i < cols; i++) {
		for (var j = 0; j < rows; j++) {
			grid[i][j] = new Cell(i, j, cellWidth);
			if(tile[i][j] == 1) {
				a = imgTile1;
			} else if(tile[i][j] == 2) {
				a = imgTile2;
			} else if(tile[i][j] == 3) {
				a = imgTile3;
			} else if(tile[i][j] == 4) {
				a = imgTile4;
			} else {
				a = imgTile5;
			}
			grid[i][j].setTile(a);
		}
	}

	// Assign bomb
	for (var i = 0; i < bomb.length; i++) {
		var choice = bomb[i];
		var col = choice[0];
		var row = choice[1];
		grid[col][row].setBomb();
	}

	// Assign trap
	for (var i = 0; i < trap.length; i++) {
		var choice = trap[i];
		var col = choice[0];
		var row = choice[1];
		grid[col][row].setTrap();
	}

	// Paint cell

	// Neighbor count
	for (var i = 0; i < cols; i++) {
		for (var j = 0; j < rows; j++) {
			grid[i][j].neighborCount();
		}
	}

	playingPanel.show();
}

function checkEnd() {
	var gridCount = 0;
	for (var i = 0; i < cols; i++) {
		for (var j = 0; j < rows; j++) {
			if(grid[i][j].revealed) gridCount++;
		}
	}

	if(gridCount>=(cols * rows)) {
		clearInterval(timer);

		var winner;
		var msg;
		
		// Determine result
		if(score_1 == score_2) {
			msg = "Draw!";
			winner = 0;
		} else if(score_1 > score_2) {
			if(player == 1) {
				msg = "Victory!";
			} else {
				msg = "Defeated!";
			}
			winner = 1;
		} else if(score_1 < score_2) {
			if(player == 2) {
				msg = "Victory!";
			} else {
				msg = "Defeated!";
			}
			winner = 2;
		}

		mode = "end";
		$('.player_1_panel').removeClass('shadow-pulse');
		$('.player_2_panel').removeClass('shadow-pulse');

		var detail = {
					playerSocket: socket.id,
					player: player,
					winner: winner,
					end: true
				}
		socket.emit('end', detail);
		console.log(msg);
		$('#resultLabel').html(msg);
		$('.resultPanel').show(1000);
		setTimeout(function() {
			$('.resultPanel').hide(1000);
		}, 3000);
	}
}

// FB
window.fbAsyncInit = function() {
  FB.init({
    appId      : '1553519231393477',
    cookie     : true,
    xfbml      : true,
    version    : 'v2.10'
  });
  FB.AppEvents.logPageView();   
};

(function(d, s, id){
   var js, fjs = d.getElementsByTagName(s)[0];
   if (d.getElementById(id)) {return;}
   js = d.createElement(s); js.id = id;
   js.src = "//connect.facebook.net/en_US/sdk.js";
   fjs.parentNode.insertBefore(js, fjs);
 }(document, 'script', 'facebook-jssdk'));

function statusChangeCallback(response) {
  if(fbStatus == false)
  {
    fbID = response.authResponse.userID;

      if (response.status == 'connected') {
      	getCurrentUserInfo(response)
      } else {
      FB.login(function(response) {
        if (response.authResponse){
        	getCurrentUserInfo(response)
        } else {
        	console.log('Auth cancelled.')
        }
      }, { scope: 'email' });
      }
  }
  fbStatus = true;
}

function getCurrentUserInfo() {
FB.api('/me?fields=first_name,middle_name,email,picture.width(200)', function(userInfo) {
	fbName = userInfo.first_name + " " + userInfo.middle_name;
	fbEmail = userInfo.email;
	fbPic = userInfo.picture.data.url;

	// Connect to server
	if(!connected) {
		startConnection("fb");
	} else {
		console.log("Already connected");
	}

});
}

function checkLoginState() {
FB.getLoginStatus(function(response) {
  statusChangeCallback(response);
});
}

function facebookLogout() {
	FB.logout(function(response) {
		console.log("You are disconnected");
		fbStatus = false;
		connected = false;
		mode = "";
		socket.disconnect();

		$('.matchPanel').hide();
		$('.disPanel').hide();
		$('.resultPanel').hide(1000);
		onlinePanel.hide();
		onlineDiv.hide();
		findMatchPanel.hide();
		playingPanel.hide();
		canvas.hide();
		$('.loginPanel').show(1000);
	});
}

function logout() {
	console.log("You are disconnected");
	connected = false;
	mode = "";
	socket.disconnect();

	$('.matchPanel').hide();
	$('.disPanel').hide();
	$('.resultPanel').hide(1000);
	onlinePanel.hide();
	onlineDiv.hide();
	findMatchPanel.hide();
	playingPanel.hide();
	canvas.hide();
	$('.loginPanel').show(1000);
}

function compareScore(game1,game2){
	var dif1 = Math.abs(game1.player1_score-game1.player2_score);
	console.log('dif1 = '+dif1);
	var dif2 = Math.abs(game2.player1_score-game2.player2_score);
	console.log('dif2 = '+dif2);
	console.log('dif1-dif2 = '+(dif1-dif2));
	return dif2-dif1;
}