/*jshint esversion: 6 */

//var app = require('http').createServer();

//CORS TRIALS
var app = require('http').createServer(function(req,res){
 // Set CORS headers
 res.setHeader('Access-Control-Allow-Origin', '127.0.0.1:8000');
 res.setHeader('Access-Control-Request-Method', '*');
 res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST');
 res.setHeader('Access-Control-Allow-Credentials', true);
 res.setHeader('Access-Control-Allow-Headers', req.header.origin);
 if ( req.method === 'OPTIONS' ) {
     res.writeHead(200);
     res.end();
     return;
 }
});

var io = require('socket.io')(app);


var GameList = require('./model/gameList.js');
var PlayerList = require('./model/playerList.js');
var Player = require('./model/player.js');

var LaravelApiEndPoint = require('./LaravelEndpoint');

app.listen(8080, function(){
    console.log('listening on *:8080');
});

const MAXPLAYERS = 4;
const MINPLAYERS = 2;
const MAXPIECES = 100;
const MINPIECES = 4;

// ------------------------
// Estrutura dados - server
// ------------------------
let restRequiredFields = {
                          authenticate_server: ["userID"],
                          create_game : ["gameName", "gameType", "rows", "cols"],
                          request_join_game : ["gameId"],
                          play_piece : ["gameId", "pieceIndex"],
                          create_chat : ["chatName"],
                          invite_to_chat : ["chatRoomID", "invitedPlayer"],
                          send_message : ["chatRoomID", "message"],
                        };

let gamesList = new GameList();
let users = new PlayerList();
let laravelApi = new LaravelApiEndPoint("127.0.0.1", 8000);

//synchNodeServerWithLaravel();

io.on('connection', function (socket) {

    //Sempre que alguem se connectar pede-lhe para se autenticar
    socket.emit('request_authenticate');

    socket.on('authenticate_server', function(data)
    {   //data: {userID : 2, userName: name}
        if(!validateRest(data, restRequiredFields.authenticate_server))
        {
            return;
        }

        laravelApi.login(data.userID,
            (success) => {
                console.log("authenticated");
                userInfo = success.data.data;
                var newPlayer = new Player(userInfo.id, socket.id, userInfo.nickname);
                users.addPlayer(data.userID, newPlayer);
                socket.emit('success_join_server', success.data.data);
            },
            (error) => {
                console.log("FAILED authenticate");
                socket.emit('login_failed', 'SERVER: '+ error);
            }
        );

    });

	socket.on('disconnect', function()
	{
        //Warn every game this player was in
        let playerGames = gamesList.playerByID(socket.id);
        if(playerGames !== undefined){

            playerGames.forEach(function(game){
                game.removePlayer(lostPlayer);
                io.to(game.ID).emit('disconnected_player', lostPlayer.name);
            });

        }      
    });

    socket.on('create_game', function (data)
    {	//data {gameName: 'war on pigs', gameType: 'Multiplayer', rows: 2, cols: 2}
    	//create a new game and a room for it!
        //Emit to everyone new game is available
        if(!validateRest(data, restRequiredFields.create_game))
        {
            return;
        }

        let player = users.getUserBySocket(socket.id);
        if(player === undefined || player == null)
        {
            requestUserToJoin(socket);
            return false;
        }

        if(validateBoardSize(data.rows, data.cols) > 0) {
            laravelApi.postCreateGame({'game': data, 'player' : player} , 
                (resp) => {
                    console.log("Laravel accepted the game");
                    let game = resp.data.data;
                    //console.log(game)
                    console.log(game);
                    //Laravel recebeu com sucesso o meu pedido de novo jogo
                    //Criar o jogo aqui no servidor Node

                    let owner = users.getUserByID(game.created_by.id);

                    gamesList.createGame(game, owner);

                    socket.join(game.id);
                    io.emit('lobby_changed');

                }, (error) => {
                    socket.emit('create_game_error', error)
                }
            );

        }else{
            socket.emit('create_game_error', 'Game size is incorrect');
        }

    });

    socket.on('delete_game', function(gameID){
        gamesList.deleteGame(gameID);
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
        //Get all gamesList available to play
        console.log(gamesList.getPendingGames());
        socket.emit('lobby_updated', gamesList.getPendingGames());
    });

	socket.on('request_join_game', function(data)
    {	//data {gameId : 1}
    	//find the game check whether it's still available maxPlayers or it has started...
    	//join the chatRoom of that game
    	//emit a refresh_game fo the game he just joined

        console.log('request_join_game');
        if(!validateRest(data, restRequiredFields.request_join_game))
        {
            return;   
        }

        let player = users.getUserBySocket(socket.id);

        let gameJoined = gamesList.joinGame(data.gameId, player.ID);
        if(gameJoined !== undefined)
        {
            socket.join(data.gameId);
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

function synchNodeServerWithLaravel() {
    //Fill the list of gamesList
    laravelApi.getGames(
        (resp) => {
            let laravelGames = resp.data.data;
            let usersInGame = [];
            for(let i = 0; i < laravelGames.length; i++) {

                //Save the users in a Seperate list
                for (let j = 0; j < laravelGames[i].players.length; j++) {

                    let player = new Player(laravelGames[i].players[j].id, undefined, laravelGames[i].players[j].nickname);
                    users.addPlayer(laravelGames[i].players[j].id, player);
                    usersInGame.push(player);
                }

                gameList.createGame();

                let game = new MemoryGame(laravelGames[i], );
                gamesList.addGame(game.id, game);

                usersInGame = []; //nao é necessário visto que existira sempre quem o criou...

            }
        }, 
        (error) => {
            console.log(error);
        });    
}

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

function validateBoardSize(rows, cols){
    let piecesQuant = -1;
    let quant = rows * cols;
    if(quant >= MINPIECES && quant <= MAXPIECES){
        if(quant % 2 == 0){
            piecesQuant = quant;
        }
    }
    
    return piecesQuant;
    
}