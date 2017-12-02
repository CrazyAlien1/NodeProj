var MemoryGame = require('./memoryGame.js');

class GameList
{
	constructor()
	{
		this.gamesCounterID = 0;
		this.games = new Map();
	}

	//GAME
	gameByID(gameID)
	{
    	return this.games.get(gameID);
    }

	getPendingGames()
	{
		return this.games.filter(game => game.status == 'Pendente' && game.maxPlayers != 1);
	}

	getRunningGames()
	{
		return this.games.filter(game => game.status == 'Ativo');
	}

	createGame(name, playerID, numPieces, maxPlayers)
	{
		let player = this.playerByID(playerID);
		if(player === undefined || player == null)
		{
			return false;
		}

		//TODO: adicionar logica de row * col = numberOfPieces

		let game = new MemoryGame(this.gamesCounterID, name, numPieces, player, maxPlayers);
		this.gamesCounterID++;
		this.games.set(ID, game);
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
		  user = game.players.find(ele => ele.socketID == socketID);
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

}

module.exports = GameList;