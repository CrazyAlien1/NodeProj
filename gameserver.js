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

var GameList = require('./model/gameList.js');
var PlayerList = require('./model/playerList.js');
var Player = require('./model/player.js');

app.listen(8080, function(){
    console.log('listening on *:8080');
});

const MAXPLAYERS = 4;
const MINPLAYERS = 2;

// ------------------------
// Estrutura dados - server
// ------------------------
let restRequiredFields = {create_game : ["gameID", "gameName", "rows", "cols"],
                          request_join_game : ["gameID"],
                          play_piece : ["gameID", "pieceIndex"],
                          create_chat : ["chatName"],
                          invite_to_chat : ["chatRoomID", "invitedPlayer"],
                          send_message : ["chatRoomID", "message"],
                        };

let games = new GameList();
let users = new PlayerList();

io.on('connection', function (socket) {

    //Sempre que alguem se connectar pede-lhe para se autenticar
    socket.emit('request_authenticate');

    socket.on('authenticate_server', function(data)
    {   //data: {userName: name}
        var newPlayer = new Player(socket.id, data.userName);
        users.addPlayer(socket.id, newPlayer);

        socket.emit('success_join_server', 'Welcome to the Server BOIII');

    });

	socket.on('disconnect', function()
	{
        //Warn every game this player was in
        let playerGames = games.playerByID(socket.id);
        if(playerGames !== undefined){

            playerGames.forEach(function(game){
                game.removePlayer(lostPlayer);
                io.to(game.ID).emit('disconnected_player', lostPlayer.name);
            });

        }
      
    });

    socket.on('create_game', function (data)
    {	//data {gameID: 2, gameName: 'war on pigs', rows: 2, cols: 2}
    	//create a new game and a room for it!
        //Emit to everyone new game is available
        if(!validateRest(data, restRequiredFields.create_game))
        {
            return;
        }

        let player = users.getUserByID(socket.id);
        if(player === undefined || player == null)
        {
            requestUserToJoin(socket);
            return false;
        }

        let game = games.createGame(data.gameID, data.gameName, player, data.rows, data.cols);

        if(game === undefined)
        {
            socket.emit('create_game_error', games.errors.getErrors());
            return;
        }

        socket.join(game.gameID);
        io.emit('lobby_changed');
    });

    socket.on('delete_game', function(gameID){
        games.deleteGame(gameID);
        io.emit('lobby_changed');
    });

    socket.on('resize_game_board', function(data)
    {   //data {gameID : 12, row : 12, col : 4}
        //get the game that is still pending!
        //generate a new board
        //emit to all inside the game that it has changed
    });

    socket.on('get_lobby', function()
    {
        //Get all games available to play
        socket.emit('lobby_updated', games.getPendingGames());
    });

	socket.on('request_join_game', function(gameID)
    {	//data {gameId : 1}
    	//find the game check whether it's still available maxPlayers or it has started...
    	//join the chatRoom of that game
    	//emit a refresh_game fo the game he just joined
        if(!validateRest(gameID, restRequiredFields.request_join_game))
        {
            return;   
        }

        let gameJoined = games.joinGame(gameID, socket.id);
        if(gameJoined !== undefined)
        {
            socket.join(gameId);
            io.to(gameId).emit('refresh_game', gameJoined);
        }else
        {
            socket.emit('request_join_error', 'Game you\'re trying to join is no longer available');
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

function requestUserToJoin(socket){
    socket.emit('request_authenticate');
}

//Checks whether the rest call has all members necessary to keep processing the request
function validateRest(dataToValidate, requiredData)
{
    let isSafe = true;
    requiredData.forEach((ele)=>{
        if(dataToValidate.hasOwnProperty(ele) === false)
        {
            console.log("[REST]:\t! Expecting: "+ ele+ " => "+ dataToValidate.ele);
            isSafe = false;
        }
    });
    return isSafe;
}