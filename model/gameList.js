var MemoryGame = require('./memoryGame.js');
var ErrorHandler = require('./errorHandler.js');

const MAXPIECES = 100;
const MINPIECES = 4;
class GameList
{
	constructor()
	{
		this.gamesCounterID = 0;
		this.games = new Map();
		this.errors = new ErrorHandler();
	}

	//GAME
	gameByID(gameID)
	{
    	return this.games.get(gameID);
    }

	getPendingGames()
	{
		let games = [];
		for (var [key, game] of this.games) 
		{
			if(game.status == 'Pendente'){
				games.push(game);
			}
		}
		return games;
	}

	getRunningGames()
	{
		return this.games.filter(game => game.status == 'Ativo');
	}

	createGame(ID, name, player, rows, cols)
	{

		let boardSize = validateBoardSize(rows, cols);
		if(boardSize > 0)
		{

			let game = new MemoryGame(ID, name, boardSize, player);
			this.games.set(ID, game);
			this.errors.clearErrors();
			return game;

		}else{
			this.errors.addError('Game board size not available pls insert an even result');
			return undefined;
		}
	}

	joinGame(gameID, playerID)
	{
		let player = this.playerID(playerID);
		let game = this.gameByID(gameID);
		if(player !== undefined && game !== undefined && !game.isFull)
		{
			game.join(socket.id);
			return game;
		}
		return undefined;
	}

	//USERS
	playerByID(socketID)
	{
		let user;
		for (var [key, game] of this.games) 
		{
		  user = game.hasPlayer(socketID);
		  if(user !== undefined)
		  {
		  	return user;
		  }
		}
		return undefined;
	}

	userByName(name)
	{
		let user;
		for (var [key, game] of this.games) 
		{
		  user = game.players.find(ele => ele.name == name);
		  if(user !== undefined)
		  {
		  	return user;
		  }
		}
		return undefined;
	}

	removePlayer(gameID, socketID)
	{
		let game = this.games.get(gameID);
		if(game !== undefined)
		{
			game.removePlayer(socketID);
		}else
		{
			return false;
		}
	}

	deleteGame(gameID){
		let game = this.games.delete(gameID);
	}

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

module.exports = GameList;