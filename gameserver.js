/*jshint esversion: 6 */

var app = require('http').createServer();

// CORS TRIALS
// var app = require('http').createServer(function(req,res){
//  // Set CORS headers
//  res.setHeader('Access-Control-Allow-Origin', 'http://dad.p6.dev');
//  res.setHeader('Access-Control-Request-Method', '*');
//  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
//  res.setHeader('Access-Control-Allow-Credentials', true);
//  res.setHeader('Access-Control-Allow-Headers', req.header.origin);
//  if ( req.method === 'OPTIONS' ) {
//      res.writeHead(200);
//      res.end();
//      return;
//  }
// });

var io = require('socket.io')(app);

var Player = require('./model/player.js');
var TicTacToeGame = require('./model/memoryGame.js');
var GameList = require('./model/gameList.js');

app.listen(8080, function(){
    console.log('listening on *:8080');
});

// ------------------------
// Estrutura dados - server
// ------------------------

let games = new GameList();

io.on('connection', function (socket) {

	socket.on('disconnect', function()
	{
      console.log('Got disconnected client!');
      //Warn every game this player was in
    });

    socket.on('create_game', function (data)
    {	//data {socketID : 1232321, gameName: 'war on pigs', maxPlayers: 3}
    	//create a new game!
    });

    socket.on('get_lobby', function()
    {
        //Get all games available to play
    });

	socket.on('request_join_game', function(gameID)
    {	//data {gameId : 1}
    	//find the game check whether it's still available maxPlayers or it has started...
    	//join the chatRoom of that game
    	//emit a refresh_game fo the game he just joined
    });

    socket.on('play_piece', function(data)
    {  //data {gameId : 1, pieceIndex : 4}
    	//Find the game and check whether he has the turn to play 
    });

    socket.on('my_active_games', function()
    {
    	//Find the user By his socket.id
    	//grab all his games
    });

    //CHAT STUFF

    socket.on('create_chat', function(data)
    {	//data {chatName: 'Let's talk shit behind someone's back' }	
    	//Create a chatRoom with ID associate the creator to that Room 
    	//emit the chat_created
    });

    socket.on('invite_to_chat', function(data)
    {	//data {chatRoomId : 12, invitedPlayer: 'Bob o construtor'}
    	//Find the user By his name and retrieve his socketId
    	//associate invitedPlayer to chatRoomId
    });

    socket.on('send_message', function(data)
    {	//data {chatRoomId : 12, message: 'You're going down Boii'}
    	//emit to that chatRoom the message but not this guy
    	//
    });
});