var MemoryGame = require('./memoryGame.js');
var ErrorHandler = require('./errorHandler.js');

class GameList
{
	constructor()
	{
		//Se houver uma lista do laravel com jogos entao converter para Map
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
			if(game.status == 'pending'){
				games.push(game);
			}
		}
		return games;
	}

	getRunningGames()
	{
		return this.games.filter(game => game.status == 'active');
	}

	createGame(game, owner)
	{
		let newGame = new MemoryGame(game, owner);
		this.games.set(game.id, newGame);
		return game;
	}

	addGame(ID, game){
		this.games.set(ID, game);
	}

	joinGame(gameID, playerID)
	{
		let player = this.games.get(gameID).hasPlayer(playerID);
		let game = this.gameByID(gameID);
		if(player !== undefined && game !== undefined && !game.isFull)
		{
			game.join(player);
			return game;
		}
		return undefined;
	}

	//USERS
	playerByID(ID)
	{
		let user;
		for (var [key, game] of this.games)
		{
		  user = game.hasPlayer(ID);
		  if(user !== undefined)
		  {
		  	return user;
		  }
		}
		return undefined;
	}

	playerByID(socket)
	{
		let user;
		for (var [key, game] of this.games)
		{
		  user = game.hasPlayer(socket);
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

module.exports = GameList;