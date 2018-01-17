var Player = require('./player.js');

class Bot {

	constructor(ID, name, botLevel, board){
		Object.assign(this, new Player(ID, undefined, undefined, name, 'BOT'));
		this.botLevel = botLevel;
		this.botMemory = board.slice(); //deep Copy of the array
		this.nextCombo = undefined;
		this.firstPiece = undefined;
	}

	playFirstPiece(board){
		let piece = undefined;
		this.updateMemory(board);
		this.checkAvailableCombo();
		
		this.forgetPieces();
		//console.log("\t\t\t\tBot FIRST PLAY", this.botMemory);
		if(this.botLevel == 1){
			piece = this.playRandom(board);
			
		}else if(this.botLevel == 4 || this.botLevel == 3 || this.botLevel == 2){

			if(this.nextCombo !== undefined) {
				piece = this.nextCombo.play1;
				//console.log("\t\t COMBO: ", this.nextCombo);
			}else{
				piece = this.playRandomSmart(board); //doest play where it knows the piece already
				//console.log("\t\tPlaying Random", piece);
			}
		}
		this.firstPiece = piece;
		return piece;
	}

	playSecondPiece(board){
		let piece = undefined;
		this.updateMemory(board);
		this.checkAvailableCombo();
		console.log("\t\t\t\tBot ",this.name,"SECOND PLAY");
		if(this.botLevel == 1){
			piece = this.playRandom(board);
		}else if(this.botLevel == 3 || this.botLevel == 2){

			if(this.nextCombo !== undefined){
				//console.log("\t\t COMBO: ", this.nextCombo);
				piece = (this.firstPiece == this.nextCombo.play1) ? this.nextCombo.play2 : this.nextCombo.play1;
			}else{
				piece = this.playRandom(board);
				//console.log("Playing Random", piece);
			}
		}else if(this.botLevel == 4){

			if(this.nextCombo !== undefined){
				//console.log("\t\t COMBO: ", this.nextCombo);
				piece = (this.firstPiece == this.nextCombo.play1) ? this.nextCombo.play2 : this.nextCombo.play1;
			}else{
				piece = this.playRandomSmart(board);
				//console.log("Playing Random", piece);
			}
		}
		return piece;
	}

	watchGame(pos, value){
		//console.log("..Bot memory update..");
		this.botMemory[pos] = value;
		
	}

	updateMemory(board){
		console.log(board, " => ", this.botMemory);
		//console.log("Board: ", board, "  Memory: ", this.botMemory);
		for(let i = 0; i < this.botMemory.length; i++){
			if(board[i] == -2 && this.botMemory[i] != -2){  //Peça ja foi combinada tirar da Memoria
				this.botMemory[i] = -2;
			}
		}
	}

	checkAvailableCombo(){
		//console.log("..Bot is comboing..",this.botMemory);
		for(let i = 0; i < this.botMemory.length; i++){
			if(this.botMemory[i] >= 0){
				for(let k = 0; k < this.botMemory.length; k++) {

					//Se nao for a msm peca & nao for peca virada ou por virar & que sejam iguais
					if(i != k && this.botMemory[i] == this.botMemory[k]) {
						this.nextCombo = {
							"play1" : i,
							"play2" : k
						}
						return;
					}
				}
			}
		}
		this.nextCombo = undefined;
	}

	forgetPieces(){
		if( this.botLevel == 2 || this.botLevel == 3){
			let size = Math.floor(this.botMemory.length / 2);

			if(this.botLevel == 2){

			}
		}
	}
}

Bot.prototype.getTypePiecesIndex = function(board, compare){
	let arr = [];
	for(let i = 0; i < board.length; i++){
		
		if(compare(board[i])){
			arr.push(i);
		}
	}
	return arr;
}

Bot.prototype.getHiddenPiecesIndex = function(board){
	let arr = [];
	for(let i = 0; i < board.length; i++){
		if(board[i] == -1){
			arr.push(i);
		}
	}
	return arr;
}

Bot.prototype.playRandom = function(board){
	let hidden = this.getTypePiecesIndex(board, (ele) => { return ele == -1 });
	//let hidden = this.getHiddenPiecesIndex(board, (ele)=>{ ele == -1 }); //array
	let random = Math.floor(Math.random() * hidden.length) + 0;
	return hidden[random];
}

Bot.prototype.playRandomSmart = function(){
	let hidden = this.getTypePiecesIndex(this.botMemory, (ele) => { return ele == -1 });
	//let hidden = this.getHiddenPiecesIndex(this.botMemory, (ele) => { ele == -1 }); //array
	
	let random = Math.floor(Math.random() * hidden.length) + 0;
	return hidden[random];
}

module.exports = Bot;