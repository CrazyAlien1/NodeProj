class Player
{
	constructor(ID, socketID, name)
	{
		this.ID = ID;
		this.socketID = socketID;
		this.name = name;
	}

	isConnected(){
		return (this.socketId !== undefined && this.socketId !== null);
	}

}

module.exports = Player;