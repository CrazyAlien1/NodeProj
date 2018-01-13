function play(success){
	console.log("Play before");
	success();
	console.log("Play After");
}

function botTurn(){
	console.log("Bot");
}

function socketPlay(){
	play(
		() => {
			console.log("Play success");
		});
	botTurn();
}

socketPlay();

function getOnly(board, compare){
	let arr = [];
	for(let i = 0; i < board.length; i++){
		
		if(compare(board[i])){
			console.log("->",board[i], " == 0");
			arr.push(board[i]);
		}
	}
	return arr;
}

function Random(board){
	let hidden = getOnly(board, (ele)=>{ return ele == 0 }); //array
	console.log(hidden);
}

function Smart(board){
	let hidden = getOnly(board, (ele) => { return ele == 1 }); //array
	console.log(hidden);
}

let board = [1, 1, 1, 2, 3, 2, 5, 34, 0, 0];

Random(board);
console.log("-------------");
//Smart(board);