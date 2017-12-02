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
var GameList = require('./model/gameList.js');

app.listen(8080, function(){
    console.log('listening on *:8080');
});

// ------------------------
// Estrutura dados - server
// ------------------------
let restRequiredFields = {"create_game" : ["gameName", "maxPlayers"],
                          "request_join_game" : ["gameID"],
                          "play_piece" : ["gameID", "pieceIndex"],
                          "create_chat" : ["chatName"],
                          "invite_to_chat" : ["chatRoomID", "invitedPlayer"],
                          "send_message" : ["chatRoomID", "message"]

                        };

let games = new GameList();

io.on('connection', function (socket) {

	socket.on('disconnect', function()
	{
      console.log('Got disconnected client!');
      //Warn every game this player was in
      let lostPlayer = games.playerByID(socket.id);
      let games = lostPlayer.games();
      games.forEach(function(game){
        game.removePlayer(lostPlayer);
        io.to(game.ID).emit('disconnected_player', lostPlayer.name);
      });
    });

    socket.on('create_game', function (data)
    {	//data {gameName: 'war on pigs', quantPiece: 4, maxPlayers: 3}
    	//create a new game
        //Emit to everyone new game is available
        if(!validateRest(data, restRequiredFields.create_game))
        {
            return;
        }

        games.createGame(data.gameName, data.maxPlayers);
        io.emit('lobby_changed', games.getPendingGames());
        
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
        if(!validateRest(data, restRequiredFields.request_join_game))
        {
            return;   
        }
    });

    socket.on('play_piece', function(data)
    {  //data {gameId : 1, pieceIndex : 4}
    	//Find the game and check whether he has the turn to play 
        if(!validateRest(data, restRequiredFields.play_piece))
        {
            return;   
        }
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
        if(!validateRest(data, restRequiredFields.create_chat))
        {
            return;   
        }
    });

    socket.on('invite_to_chat', function(data)
    {	//data {chatRoomId : 12, invitedPlayer: 'Bob o construtor'}
    	//Find the user By his name and retrieve his socketId
    	//associate invitedPlayer to chatRoomId
        if(!validateRest(data, restRequiredFields.invite_to_chat))
        {
            return;
        }
    });

    socket.on('send_message', function(data)
    {	//data {chatRoomId : 12, message: 'You're going down Boii'}
    	//emit to that chatRoom the message but not this guy
        if(!validateRest(data, restRequiredFields.send_message))
        {
            return;
        }
    });
});

//Checks whether the rest call has all members necessary to keep processing the request
function validateRest(dataToValidate, requiredData)
{
    requiredData.forEach((ele)=>{
        if(dataToValidate.hasOwnProperty(ele) === false)
        {
            console.log("[REST]:\t! Expecting: "+ ele+ " => "+ data.ele);
            return false;
        }
    });
}