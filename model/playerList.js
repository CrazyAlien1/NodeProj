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

}

module.exports = PlayerList;