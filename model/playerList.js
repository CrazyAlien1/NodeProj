var Player = require('./player.js');

class PlayerList
{
	constructor(){
		this.playerList = new Map();
	}

	addPlayer(ID, player){
		this.playerList.set(ID, player);
	}

	removePlayer(ID){
		this.playerList.delete(ID); //ele faz a comparacao === e o ID é string
	}

	getUserByID(ID){
		return this.playerList.get(ID);
	}

	getUserBySocket(socket){
		for (var [key, player] of this.playerList){
			if(player.socketID == socket){
				return player;
			}
		}
	}

}

module.exports = PlayerList;