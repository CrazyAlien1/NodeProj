const MAXPLAYERS = 4;
const MINPLAYERS = 2;
const MAXPIECES = 100;
const MINPIECES = 4;

class MemoryGame
{
	constructor(laravelGame, owner, timer)
	{
		Object.assign(this, laravelGame); //this = laravelGame;
		this.board = []; //generate now the board with laravelGame.rows and laravelGame.cols
		this.finalBoard = [];
		this.isFull = false;
		this.piece1 = undefined;
		this.piece2 = undefined;
		this.players = [];
		this.owner = setUpUserForGame(owner);
		delete this.created_by;
		this.players.push(this.owner);
		this.playerTurn = owner.ID;
		this.timer = timer;
		this.gameEnded = false;
		this.callbackTimeOut;
	}

	join(player)
	{
		if(this.getPlayer(player.ID) === undefined)
		{
			if(this.isFull){
				console.log("Game is FUll", this.players.length);
				return;
			}
			//Create a new instance because a user can be in multiple games
			//and the points are refered to one game
			let userInGame = setUpUserForGame(player);
			console.log("USER JOINED: ", userInGame);
			this.players.push(userInGame);

			if(this.players.length == MAXPLAYERS)
			{
				this.isFull = true;
			}
			return true;
		}
		return false;
	}

	removePlayer(id){
		
		for(var i = 0; i < this.players.length; i++) {
		    if (this.players[i].ID === id) {

		    	let lostPlayer = this.players[i];

		    	this.players.splice(i, 1);

		    	if(this.type === 'multiplayer' && this.playerTurn === id && this.status == 'active'){
		    		let nextPlayer = this.nextPlayerToPlay();

		    		this.resetTurn();

		    		if(this.checkVictory()){
		    			console.log("[ Victory by withdrawal ]");
		    			this.stopTimer();
		    			this.addMessage("Game won by withdrawal of other players");
		    		}else{
		    			console.log("[ Disconnection ]");
		    			if(nextPlayer !== undefined){
			    			this.playerTurn = nextPlayer.ID;
			    		}
		    			this.addMessage("Disconnected Player "+ lostPlayer.name + " gave his turn to "+ nextPlayer.name);
		    		}
		    	}

		        

		        if(this.status == 'pending' && this.players.length < this.maxPlayers)
				{
					this.isFull = false;
				}
		    }
		}
	}

	getPlayer(id){
		for(var i = 0; i < this.players.length; i++) {
		    if (this.players[i].ID === id) {
		        return this.players[i];
		    }
		}
		return undefined;
	}

	nextPlayerToPlay(){
		//Cuidado na ordem de chamada das funcoes
		this.clearMessages();
		this.newTurn = true;
		for(var i = 0; i < this.players.length; i++) {
		    if (this.players[i].ID === this.playerTurn) {

		    	this.startTimer();

		        if(i == this.players.length -1){
		        	return this.players[0];
		        }else{
		        	//Buscar o proximo player
		        	return this.players[i+1];
		        }
		    }
		}

	}

	start(callbackTime){
		this.status = 'active';
		this.winner = undefined;
		this.newTurn = true;
		this.callbackTimeOut = callbackTime;
		//generate the board!
		let size = this.cols * this.rows;
		for (var i = 0; i < size; i++) {
			this.board[i] = -1;
		}

		if(this.players.length == 1 && this.type == 'multiplayer'){
			console.log("Game started with 1 player");
			this.type = 'singleplayer';
		}

		if(this.type == 'multiplayer'){
			this.startTimer();
		}

		this.finalBoard = generateBoard(size);
	}

	play(playerID, index, success, fail, error) {

		if(playerID === this.playerTurn && index > -1 && index < this.board.length){

			this.newTurn = false;
			let currPlayer = this.getPlayer(playerID);
			let pieceValue = this.finalBoard[index];

			if(this.board[index] !== -1){
				error('The piece was already flipped');
				return;
			}

			this.board[index] = pieceValue;

			if(this.piece1 === undefined){
				this.piece1 = {'value' : pieceValue, 'index' : index};
				success();
			}
			else if(this.piece2 === undefined){

				this.piece2 = {'value' : pieceValue, 'index' : index};

				
				//player has turned 2 pieces
				if(this.piece1.value === this.piece2.value){
					//player hit pieces with same image

					this.piece1 = undefined;
					this.piece2 = undefined;
					currPlayer.Points += 10;
					
					if(!this.checkVictory()){
						this.startTimer();
					}
					success();
				}else{

					this.playerTurn = this.nextPlayerToPlay().ID;
					console.log("NEXT PLAYER: ", this.playerTurn);
					
					fail();

					this.resetTurn();
				}
				
			}
			
		}else{
			if(playerID !== this.playerTurn){
				error('Not your turn');
			}
		}
	}

	startTimer(){
		this.stopTimer();
		this.timeToPlay = setTimeout( () => {

                this.callbackTimeOut(this);
			}, this.timer);
	}

	stopTimer(){
		console.log("´´´´´´´´´´´´´´STOPPING TIMER´´´´´´´´´´´´´´");
		clearTimeout(this.timeToPlay);
	}

	resetTurn(){
		if(this.piece1 !== undefined)
			this.board[this.piece1.index] = -1;
		if(this.piece2 !== undefined)
			this.board[this.piece2.index] = -1;
		this.piece1 = undefined;
		this.piece2 = undefined;
	}

	checkVictory(){

		console.log(this.type, this.players.length);

		if(this.type === 'multiplayer' && this.players.length == 1){

			this.winner = this.players[0];
			this.gameEnded = true;

			this.stopTimer();
			return true;
		}

		//The gameBoard is not yet completely revealed
		for (var i = 0; i < this.board.length; i++) {
			if(this.board[i] !== this.finalBoard[i]){
				return false;
			}
		}
		
		
		//Calculate the winner

		this.gameEnded = true;
		
		if(this.timeToPlay !== undefined){
			this.stopTimer();
		}

		let maxPoints = 0;
		let winner = undefined;
		for (var i = 0; i < this.players.length; i++) {
			if(this.players[i].Points > maxPoints){
				maxPoints = this.players[i].Points;
				winner = this.players[i];
			}
			//E se for empate?
		}

		this.winner = winner;
		return true;
	}

	addMessage(msg){
		this.message.push(msg);	
	}

	clearMessages(){
		this.message = [];
	}
}

MemoryGame.prototype.playerWorthy = function(){
	var game = Object.assign({}, this); 
	delete game.finalBoard;
	delete game.timeToPlay;
	return game;
}

module.exports = MemoryGame;

function setUpUserForGame(player){
		let userInGame = Object.assign({}, player);
		userInGame.Points = 0;
		return userInGame;
}

function generateBoard(size){
	let quantImages = size / 2;
	let arr = new Array(size);
	let count = 0;
	for(let i = 0; i < arr.length -1; i+=2){
		arr[i] = count;
		arr[i+1] = count;
		count++;
	}

	return shuffleArray(arr);
}

function shuffleArray(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}