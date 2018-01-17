class Player
{
	constructor(ID, socketID, token,name, playerType)
	{
		this.ID = ID;
		this.socketID = socketID;
		this.token = token;
		this.name = name;
		this.playerType = (playerType !== undefined) ? 'BOT' : 'HUMAN';
	}

	isConnected(){
		return (this.socketId !== undefined && this.socketId !== null);
	}

}

module.exports = Player;