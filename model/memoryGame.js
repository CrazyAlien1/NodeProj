class MemoryGame
{
	constructor(laravelGame, owner)
	{
		Object.assign(this, laravelGame);
		//this = laravelGame;
		this.board = []; //generate now the board with laravelGame.rows and laravelGame.cols
		this.finalBoard = [];
		this.players = new Map();
		this.players.set(owner.ID, owner);
	}

	join(player)
	{
		if(player !== undefined || player !== null)
		{
			this.players.set(player.ID, player);
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