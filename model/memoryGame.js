class MemoryGame
{
	constructor(ID, name, numPieces, player)
	{
		this.ID = ID;
		this.name = name;
		this.status = 'Pendente';
		this.board = [];
		this.finalBoard = [];
		this.owner = player.name;
		this.isFull = false;
		this.numPieces = numPieces;
		this.players = new Map();
		this.players.set(this.owner.socketID, this.owner);
	}

	join(player)
	{
		if(player !== undefined || player !== null)
		{
			this.players.set(player.socketID, player);
			if(this.players.size == MAXPLAYERS)
			{
				this.isFull = true;
			}
			return true;
		}
		return false;
	}

	removePlayer(playerID){
		let outcome = this.players.delete(playerID);
		//Se removeu o player e se o estado do jogo ainda estiver por começar e se o numero de jogadores
		//for abaixo do maximo muda o estado do jogo para available
		if(outcome && this.status == 'pending' && this.players.size < this.maxPlayers)
		{
			this.isFull = false;
		}
	}

	hasPlayer(playerID){
		return this.players.get(playerID);
	}

	start(){
		this.status = 'Ativo';
	}

}

module.exports = MemoryGame;