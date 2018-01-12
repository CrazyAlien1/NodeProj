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
		//Se for admin mostra tb os singleplayer??
		let games = [];
		for (var [key, game] of this.games) 
		{
			if(game.status === 'pending'){
				games.push(game);
			}
		}
		return games;
	}

	getRunningGames()
	{
		return this.games.filter(game => game.status == 'active');
	}

	createGame(game, owner, time)
	{
		let newGame = new MemoryGame(game, owner, time);
		this.games.set(game.id, newGame);
		return newGame;
	}

//To be used when synching with laravel is done or not...
	addGame(ID, game){
		this.games.set(ID, game);
	}

	joinGame(gameID, player)
	{
		//No final do jogo é que se guarda tudo inclusive quem jogou
		console.log("[JOIN GAME]");
		let hasPlayer = this.games.get(gameID).getPlayer(player.ID);
		let game = this.gameByID(gameID);

		if(hasPlayer !== undefined) {
			//O jogador ja esta nesse jogo...
			console.log("User ja se encontra nesse jogo");
			return undefined;
		}else if(game !== undefined && !game.isFull){
			game.join(player);
			return game;
		}
		return undefined;
	}

	//USERS
	playerGames(ID)
	{
		let gamesUserHas = [];
		for (var [key, game] of this.games)
		{
		  if(game.getPlayer(ID) !== undefined)
		  {
		  	gamesUserHas.push(game);
		  }
		}
		if(gamesUserHas.length == 0){
			return undefined;
		}
		return gamesUserHas;
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
		//When the player leaves he loses his turn
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