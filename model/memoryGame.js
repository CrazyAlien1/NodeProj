const MAXPLAYERS = 4;
const MINPLAYERS = 2;
const MAXPIECES = 100;
const MINPIECES = 4;

var Bot = require('./bot.js');

class MemoryGame
{
	constructor(laravelGame, owner, timer, bots)
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
		this.currentWinner = undefined;
		this.winner = undefined;
		this.BOTS = bots;
	}

	join(player)
	{
		if(this.getPlayer(player.ID) === undefined)
		{
			if(this.isFull){
				console.log("Game is FUll", this.players.length);
				return;
			}
			
			//NOTA: Rever isto... so fazem join os que nao criaram o jogo
			//let userInGame = setUpUserForGame(player);
			if(player.playerType == 'HUMAN'){
				this.kickBot();
				player.Points = 0;
			}
			this.players.push(player);

			if(this.players.length == this.maxPlayers)
			{
				this.isFull = true;
			}
			return true;
		}
		return false;
	}

	kickBot(){
		for(let i = 0; i < this.players.length; i++){
			if(this.players[i].ID < 1){ //admin is 1
				console.log("Kicking bot so ", this.players[i].name," can join");
				this.removePlayer(this.players[i].ID);
				return;
			}
		}
	}

	removePlayer(id){
		
		for(var i = 0; i < this.players.length; i++) {
		    if (this.players[i].ID === id) {

		    	let lostPlayer = this.players[i];

		    	if(this.currentWinner !== undefined && this.currentWinner.ID == lostPlayer.ID){
		    		this.currentWinner = undefined;
		    		this.currentMaxPoints = 0;
		    	}

		    	if(this.type === 'multiplayer' && this.playerTurn === id && this.status == 'active'){
		    		let nextPlayer = this.nextPlayerToPlay();

					this.players.splice(i, 1);
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
		    	}else{
		    		this.players.splice(i, 1);
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

		for(let i = 0; i < this.players.length; i++) {
		    if (this.players[i].ID == this.playerTurn) {

		    	this.startTimer();

		    	let nextIndex =  (i+1) % this.players.length;

		    	if(this.players[nextIndex].playerType == 'BOT'){
		    		this.isBotTurn = true;
		    	}else{
		    		this.isBotTurn = false;
		    	}

		    	return this.players[nextIndex];
		    }
		}

	}

	start(callbackTime){
		this.status = 'active';
		this.newTurn = true;
		this.callbackTimeOut = callbackTime;
		this.allPlayers = [];
		for(let i = 0; i < this.players.length; i++){
			this.allPlayers.push(this.players[i].ID);
		}
		//generate the board!
		let size = this.cols * this.rows;
		for (var i = 0; i < size; i++) {
			this.board[i] = -1;
		}

		if(this.players.length == 1 && this.type == 'multiplayer'){
			console.log("Game started with 1 player");
			this.type = 'singleplayer';
		}

		if(this.BOTS !== undefined){
			for(let i = 0; i < this.BOTS.length; i++){
				let newBot = new Bot(-i, this.BOTS[i].name, this.BOTS[i].botType, this.board);
				this.join(newBot);
			}			
		}
		console.log(this.players);

		this.startTimer();
		

		this.finalBoard = generateBoard(size);
	}

	play(playerID, index, success, fail, error) {

		if(playerID === this.playerTurn && index > -1 && index < this.board.length){

			this.newTurn = false;
			let currPlayer = this.getPlayer(playerID);
			let pieceValue = this.finalBoard[index];

			if(this.board[index] !== -1){
				console.log("PLAYER: ",playerID," The piece was already flipped ->" , index, " BOARD: ", this.board);
				error('The piece was already flipped');
				return;
			}

			this.board[index] = pieceValue;
			if(this.BOTS !== undefined){
				for(let i = 0; i < this.players.length; i++){
					if(this.players[i].playerType == 'BOT'){
						this.players[i].watchGame(index, pieceValue);
					}
				}
			}

			if(this.piece1 === undefined){
				this.piece1 = {'value' : pieceValue, 'index' : index};
				success();
			}
			else if(this.piece2 === undefined){

				this.piece2 = {'value' : pieceValue, 'index' : index};

				
				//player has turned 2 pieces
				if(this.piece1.value === this.piece2.value){
					//player hit pieces with same image

					
					currPlayer.Points += 10;

					this.updateCurrentWinner(currPlayer);
					
					if(!this.checkVictory()){
						this.startTimer();
					}
					this.newTurn = true;
					success();				
					
				}else{

					this.playerTurn = this.nextPlayerToPlay().ID;
					fail();
				}
			}
		}else{
			if(playerID !== this.playerTurn){
				console.log(playerID, " :::Trying to play...");
				error('Not your turn');
			}
		}
	}

	startTimer(){
		if(this.type == 'multiplayer'){
			this.stopTimer();
			this.timeToPlay = setTimeout( () => {

	                this.callbackTimeOut(this);
				}, this.timer);
		}
	}

	stopTimer(){
		clearTimeout(this.timeToPlay);
	}

	finishTurn(){
		if(this.piece1 !== undefined && this.piece2 !== undefined){
			this.board[this.piece1.index] = -2;
			this.board[this.piece2.index] = -2;
			this.piece1 = undefined;
			this.piece2 = undefined;
		}
		console.log("Finish Turn", this.board);
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

		if(this.type === 'multiplayer' && this.players.length == 1){

			this.winner = this.players[0];
			this.gameEnded = true;
			this.status = 'terminated';

			this.stopTimer();
			return true;
		}

		//The gameBoard is not yet completely revealed
		for (var i = 0; i < this.board.length; i++) {
			if(this.board[i] == -1){
				return false;
			}
		}

		this.updateCurrentWinner();

		this.gameEnded = true;
		
		if(this.timeToPlay !== undefined){
			this.stopTimer();
		}

		this.winner = this.currentWinner;
		return true;
	}

	updateCurrentWinner(player){
		if(this.currentMaxPoints == undefined && player !== undefined){
			this.currentMaxPoints = player.Points;
			this.currentWinner = player; 
		}else{

			for (let i = 0; i < this.players.length; i++) {
				if(this.players[i].Points > this.currentMaxPoints){
					this.currentMaxPoints = this.players[i].Points;
					this.currentWinner = this.players[i];
				}
			}
		}		
	}

	addMessage(msg){
		this.message.push(msg);	
	}

	clearMessages(){
		this.message = [];
	}
}
module.exports = MemoryGame;


MemoryGame.prototype.playerWorthy = function(){
	var game = Object.assign({}, this); 
	delete game.finalBoard;
	delete game.timeToPlay;
	return game;
}


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