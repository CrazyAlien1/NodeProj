class Player
{
	constructor(ID, socketID, name, playerType)
	{
		this.ID = ID;
		this.socketID = socketID;
		this.name = name;
		this.playerType = (playerType !== undefined) ? 'BOT' : 'HUMAN';
	}

	isConnected(){
		return (this.socketId !== undefined && this.socketId !== null);
	}

}

module.exports = Player;