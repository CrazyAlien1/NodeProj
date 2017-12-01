class Player
{
	constructor(socketID, name)
	{
		this.socketID = socketID;
		this.name = name;
	}

	joinGame(game)
	{
		this.games.set(game.gameID, game);
	}

	getGames()
	{
		return this.games;
	}

}