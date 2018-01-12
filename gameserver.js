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

const MAXPLAYERS = 4;
const MINPLAYERS = 1;
const MAXPIECES = 100;
const MINPIECES = 4;

var GameList = require('./model/gameList.js');
var PlayerList = require('./model/playerList.js');
var Player = require('./model/player.js');
util = require('util');


var LaravelApiEndPoint = require('./LaravelEndpoint');

app.listen(8080, function(){
    console.log('listening on *:8080');
});

// ------------------------
// Estrutura dados - server
// ------------------------
let restRequiredFields = {
                          authenticate_server: ["userID"],
                          create_game : ["gameName", "gameType", "gameMaxPlayers", "rows", "cols"],
                          request_join_game : ["gameId"],
                          play_piece : ["gameId", "pieceIndex"],
                          remove_player_game : ["gameId", "userID"],
                          leave_game : ["gameId"],
                          game_refresh : ["gameId"],
                          create_chat : ["chatName"],
                          invite_to_chat : ["chatRoomID", "invitedPlayer"],
                          send_message : ["gameId", "message"],
                          delete_game : ["gameId"],
                        };

let gamesList = new GameList();
let users = new PlayerList();
let laravelApi = new LaravelApiEndPoint("127.0.0.1", 8000);
const setTimeoutPromise = util.promisify(setTimeout);

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

        if(users.getUserByID(data.userID) !== undefined){
            console.log("JA CONNECTADO!!!!!");
            console.log("ID: ", data.userID);
            console.log(users);
            console.log("JA CONNECTADO!!!!!");
            return;
        }

        laravelApi.login(data.userID,
            (success) => {
                console.log("***********[LOGGIN SUCCESS]**********");
                userInfo = success.data.data;
                var newPlayer = new Player(userInfo.id, socket.id, userInfo.nickname);
                users.addPlayer(data.userID, newPlayer);
                socket.emit('success_join_server', success.data.data);
                socket.emit('lobby_updated', gamesList.getPendingGames());
                console.log("USERS IN NODE: "+ users.playerList.size);
            },
            (error) => {
                console.log("*********[LOGIN FAILED]*********");
                socket.emit('login_failed', 'SERVER: '+ error);
            }
        );

    });

    socket.on('disconnect', function()
    {
        //Warn every game this player was in
        let player = socketToUser(socket);
        if(player === undefined){
            return;
        }
        users.removePlayer(player.ID);
        let games = gamesList.playerGames(player.ID);
        if(games !== undefined){

            games.forEach( (game) => {
                game.removePlayer(player.ID);
                io.to(game.id).emit('player_disconnected', {'player': player.name, 'game': game});
                if(game.players.length == 0 || (game.owner.id == player.ID && game.status == 'pending')){
                    gamesList.deleteGame(game.id);
                }
            });

        }
    });

    socket.on('create_game', function (data)
    {   //data {gameName: 'war on pigs', gameType: 'Multiplayer', gameMaxPlayers: 2, rows: 2, cols: 2}
        //create a new game and a room for it!
        //Emit to everyone new game is available
        if(!validateRest(data, restRequiredFields.create_game))
        {
            return;
        }

        let player = socketToUser(socket);
        if(player === undefined){
            return;
        }

        if(data.gameMaxPlayers < MINPLAYERS || data.gameMaxPlayers > MAXPLAYERS){
            socket.emit('create_game_error', 'Num of players from: '+MINPLAYERS+' to '+ MAXPLAYERS);
            return;
        }

        if(validateBoardSize(data.rows, data.cols) > 0) {
            laravelApi.postCreateGame({'game': data, 'player' : player} , 
                (resp) => {
                    console.log("Laravel accepted the game");
                    let game = resp.data.data;
                    game.maxPlayers = data.gameMaxPlayers;
                    //Laravel recebeu com sucesso o meu pedido de novo jogo
                    //Criar o jogo aqui no servidor Node

                    let owner = users.getUserByID(game.created_by.id);
                    game = gamesList.createGame(game, owner, 30000);
                    
                    socket.join(game.id);


                    if(game.type == 'singleplayer'){
                        game.start();
                        emitGameStarted(game);
                    }else{
                        io.emit('lobby_changed');
                    }

                }, (error) => {
                    socket.emit('create_game_error', error)
                }
            );

        }else{
            socket.emit('create_game_error', 'Game size is incorrect');
        }

    });


    socket.on('get_lobby', function()
    {
        //Get all gamesList available to play
        console.log("get_lobby");
        socket.emit('lobby_updated', gamesList.getPendingGames());
    });

    socket.on('request_join_game', function(data)
    {   //data {gameId : 1}
        //find the game check whether it's still available maxPlayers or it has started...
        //join the chatRoom of that game
        //emit a refresh_game fo the game he just joined

        console.log('request_join_game');
        if(!validateRest(data, restRequiredFields.request_join_game))
        {
            return;
        }
        
        let player = socketToUser(socket);
        if(player === undefined){
            console.log("[LOGIN MISSING]: joining game but user not logged in");
            return;
        }

        let gameJoined = gamesList.joinGame(data.gameId, player);
        if(gameJoined !== undefined)
        {
            socket.join(gameJoined.id);

            io.emit('lobby_changed');
        }else
        {
            console.log("[ERROR] on request_join_error");
            socket.emit('request_join_error', 'Game you\'re trying to join is no longer available');
        }

    });

    socket.on('start_game', function(data)
    {//data: {gameId : 2}

        let game = gamesList.gameByID(data.gameId);

        game.start(
                (gameTimedOut) => {
                    if(gameTimedOut !== undefined){
                        let user = users.getUserByID(gameTimedOut.playerTurn);

                        //Avaliar porq esta a enviar a msg de victory para todos

                        gameTimedOut.removePlayer(gameTimedOut.playerTurn);

                        //gameTimedOut.checkVictory();

                        if(gameTimedOut.gameEnded){

                            closeGame(gameTimedOut);
                        }else{
                            io.to(game.id).emit('game_switch_turn', game.playerWorthy());
                            //io.to(gameTimedOut.id).emit('game_refresh', gameTimedOut.playerWorthy());
                        }
                    }
                });
        emitGameStarted(game);

        io.to(game.id).emit('got_message', {'game' : game.id, 
                                                    'msg' : {
                                                            'text' : 'Game on!',
                                                           }
                                                    });
    });

    socket.on('play_piece', function(data)
    {  //data {gameId : 1, pieceIndex : 4}
        //Find the game and check whether he has the turn to play 
        if(!validateRest(data, restRequiredFields.play_piece))
        {
            return;
        }

        let player = socketToUser(socket);
        let game = gamesList.gameByID(data.gameId);

        if(game !== undefined){
            console.log("Playing piece");
            game.play(player.ID, data.pieceIndex, 
                (success) => {
                    
                    console.log("Success Play");
                    if(game.gameEnded){

                        closeGame(game);

                        laravelApi.postSaveGame(game,
                            (success) => {

                            },
                            (error) => {
                                socket.emit('create_game_error', error);
                            });

                    }else{

                        io.to(game.id).emit('game_refresh', game.playerWorthy());
                        if(game.newTurn){
                            setTimeoutPromise(1000).then(
                            () => {
                                io.to(game.id).emit('game_refresh', game.playerWorthy()); 
                            }
                            );
                        }
                    }
                },
                (fail) => {

                    console.log("Failed Play");
                    io.to(game.id).emit('game_switch_turn', game.playerWorthy());
                    setTimeoutPromise(1000).then(
                        () => {
                            io.to(game.id).emit('game_refresh', game.playerWorthy()); 
                        }
                    );
                },
                (error) => {
                    console.log("failed");
                    if(game.gameEnded){
                        closeGame(game);
                    }
                    else{
                        socket.emit('invalid_play', error);
                    }
                }
            );

        }else{
            console.log("FAILED GAME"+ game);
        }
    });

    // socket.on('game_refresh', function(data)
    // {
    //     if(!validateRest(data, restRequiredFields.remove_player_game))
    //     {
    //         return;
    //     }

    //     let user = socketToUser(socket);
    //     let game = gamesList.gameByID(data.gameId);

    //     if(user !== undefined && game !== undefined){
    //         if(game.getPlayer(user.ID)){
    //             console.log("USER Requesting his game to be updated");
    //             socket.emit('game_refresh', game);
    //         }
    //     }

    // });

    socket.on('remove_player_game', function(data)
    {//data {gameId : 1, userID : 4}
        //Find the game and check whether he has the turn to play 
        if(!validateRest(data, restRequiredFields.remove_player_game))
        {
            return;
        }

        console.log('remove_player_game');

        let gameOwner = socketToUser(socket);
        let playerToKick = users.getUserByID(data.userID);
        let game = gamesList.gameByID(data.gameId);

        if(gameOwner !== undefined && playerToKick !== undefined && game !== undefined){
            if(game.owner.ID == gameOwner.ID){
                if(game.getPlayer(playerToKick.ID) !== undefined){

                    //it's the owner requesting to remove a legit player in his game
                    game.removePlayer(playerToKick.ID);

                    io.sockets.connected[playerToKick.socketID].leave(game.id);
                    // io.to(playerToKick.socketID).leave(game.id);
                    
                    // Esta a limpar o lobby do owner ou seja a remover o jogo que ele kickou o player
                    io.to(playerToKick.socketID).emit('game_kick', 'You were kicked from '+ game.name+ ' by the owner');
                    io.emit('lobby_changed');
                }
            }
        }

    });

    socket.on('leave_game', function(data)
    {
        if(!validateRest(data, restRequiredFields.leave_game))
        {
            return;
        }

        console.log('leave_game');

        let player = socketToUser(socket);

        let game = gamesList.gameByID(data.gameId);

        if(game.getPlayer(player.ID) !== undefined){

            io.sockets.connected[player.socketID].leave(game.id);
            // io.to(player.socketID).leave(game.id);
            game.removePlayer(player.ID);
        }

        io.emit('lobby_changed');
    });

    socket.on('delete_game', function(data)
    {
        if(!validateRest(data, restRequiredFields.delete_game))
        {
            return;
        }

        let player = socketToUser(socket);

        let game = gamesList.gameByID(data.gameId);

        if(game.owner.ID === player.ID){
            gamesList.deleteGame(game.id);
        }

        io.emit('lobby_changed');

    });

    socket.on('send_message', function(data)
    { //data {gameId : 123, message: 'Hello World'}
      //emit to that chatRoom the message but not this guy
        if(!validateRest(data, restRequiredFields.send_message))
        {
            return;
        }

        let user = socketToUser(socket);

        let game = gamesList.gameByID(data.gameId);

        if(user !== undefined && game !== undefined){

            io.to(game.id).emit('got_message', {    'game' : game.id, 
                                                    'msg' : {
                                                            'text' : data.message, 
                                                            'date' : new Date(),
                                                            'sender' : user.name,
                                                           }
                                                    });
        }
    });
});

// function handleGameTimeout(gameTimedOut){
//     //gameTimedOut.checkVictory();
//     console.log("TIMEOUT! "+ gameTimedOut.playerTurn.name);

//     if(gameTimedOut !== undefined){

//         if(gameTimedOut.gameEnded){

//             io.to(game.id).emit('game_ended', game.playerWorthy());
//             gamesList.deleteGame(gameTimedOut.id);
//         }else{
//             io.to(gameTimedOut.id).emit('game_refresh', gameTimedOut.playerWorthy());
//         }
//     }
// }

function closeGame(game){
    game.status = 'terminated';
    io.to(game.id).emit('game_ended', game.playerWorthy());

    //for(let i = 0; i < game.players.length; i++){
        //io.to(game.players[i].socketID).leave();
    //}
    
    gamesList.deleteGame(game.id);
}

function socketToUser(socket){
    let player = users.getUserBySocket(socket.id);
    if(player === undefined || player == null)
    {
        requestUserToJoin(socket);
        return undefined;
    }
    return player;
}

function emitGameStarted(game){
    //Emite que mmudou um jogo e lanca outravez o lobby
    io.to(game.id).emit('game_started', game.playerWorthy());
    console.log("~~~~~~~Game Started~~~~~~");
    io.emit('lobby_changed');
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

function nodeStats(){
    console.log("******************************************");
    console.log("* USERS: "+ users.players.size+ "  GAMES:"+ gamesList.games.size+ " *");
    
}