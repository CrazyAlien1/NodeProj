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
		this.playerList.delete(ID);
	}

	getUserByID(ID){
		return this.playerList.get(ID);
	}

	getUserBySocket(socket){
		for (var [key, player] of this.playerList){
			console.log(player.socketID + " == "+ socket);
			if(player.socketID === socket){
				return player;
			}
		}
	}

}

module.exports = PlayerList;