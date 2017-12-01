var Player = require('./webplayer.js');
var TicTacToeGame = require('./gamemodel.js');

class GameList
{
	constructor()
	{
		this.gamesCounterID = 0;
		this.playersCounterID = 0;
		this.games = new Map();
		this.players = new Map();
	}

	//USER
	userByID(socketID)
	{
		return this.players.get(socketID);
	}

	userByName(name)
	{
		for (var [key, player] of this.players) 
		{
		  if(player.name == name)
		  {
		  	return player;
		  }
		}
	}

	removeUser(gameID, )

	//GAME
	gameByID(gameID) 
	{
    	return this.games.get(gameID);
    }

	getPendingGames()
	{
		return this.games.filter(game => game.status == 'Pendente');
	}

	getRunningGames()
	{
		return this.games.filter(game => game.status == 'Ativo');
	}

}

module.exports = GameList;