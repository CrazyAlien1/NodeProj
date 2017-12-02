class MemoryGame
{
	constructor(ID, name, numPieces, player, maxPlayers)
	{
		this.ID = ID;
		this.name = name;
		this.maxPlayers = maxPlayers;
		this.status = 'Pendente';
		this.board = [];
		this.finalBoard = [];
		this.owner = player;

		this.players = new Map();
		this.players.set(this.owner.socketID, this.owner);
	}

	join(player)
	{
		if(player !== undefined || player !== null)
		{
			this.players.set(player.socketID, player);
		}else
		{
			return false;
		}
	}

	leave(playerID)
	{
		return this.players.delete(playerID);
	}

	start()
	{
		this.status = 'Ativo';
	}
}

module.exports = MemoryGame;