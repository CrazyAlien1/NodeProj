const URI_GAMES = "/api/games";
const URI_USERS = "/api/users";
const URI_USER_GAMES = "/api/games/users/";
var axios = require('axios');
class LaravelApiEndPoint
{
	constructor(url, port){
		this.url = url;
		//this.port = port;
		this.axios = axios.create({
		  proxy: {
		    host: this.url,
		    //port: this.port,
		    /*auth: {
		      username: 'mikeymike',
		      password: 'rapunz3l'
		    }*/
		  },
		});
	}

	login(request, success, error){
		console.log(request);
		axios({method: 'get', url: "http://dadproj.dad/api/users" + "/"+ request.userID, headers: {
	            'Accept' : 'application/json',
	            'Content-Type' : 'application/json',
	            'Authorization': request.token,
        	}})
		.then(resp => {
			success(resp);
			console.log(resp);
		})
		.catch(resp => {
			error(resp);
			console.log(resp);
		});
	}

	postCreateGame(gameRequest, success, error){
		axios({method: 'post', url: "http://dadproj.dad/api/games", headers: {
	            'Accept' : 'application/json',
	            'Content-Type' : 'application/json',
	            'Authorization': gameRequest.player.token,
        	}, data: {
        		'userID' : gameRequest.player.ID,
                'type' : gameRequest.game.gameType,
                'name' : gameRequest.game.gameName,
                'rows' : gameRequest.game.rows,
                'cols' : gameRequest.game.cols,
        	}}).then(resp => {
        	success(resp);
        }).catch(resp => {
        	console.log(resp);
			error(resp);
        });
	}

	postSaveGame(game, success, error){
		let allPlayers = [];
		for(let i = 0; i < game.players.length; i++){
			if(game.players[i].playerType == 'HUMAN'){
				allPlayers.push(game.players[i].ID);			
			}
		}
		console.log("SAVING", allPlayers, " Winner: ", game.winner.name);
		axios({method: 'put', url: "http://dadproj.dad/api/games", headers: {
	            'Accept' : 'application/json',
	            'Content-Type' : 'application/json',
	            'Authorization': game.token,
        	}, data: {
        		'id' : game.id,
                'status' : game.status,
                'type' : game.type,
                'winner' : game.winner.ID,
                'players' : allPlayers,
        	}}).then(resp => {
        	success(resp);
        }).catch(resp => {
        	console.log(resp);
			error(resp);
        });
	}

//****************************  USERS  *******************************************
	getUsers(success, error){
		this.axios.get(URI_USERS)
		.then(resp => {
			success(resp);
		})
		.catch(resp => {
			error(resp);
		});
	}


//****************************  GAMES  *******************************************
	getGames(success, error){
		this.axios.get(URI_GAMES)
		.then(resp => {
			success(resp);
		})
		.catch(resp => {
			error(resp);
		});
	}

	getGamesPending(success, error){
		//Buscar todos os jogos no laravel que estejam pendentes
		this.axios.get(URI_GAMES, 
		{
			'status' : 'Pending'
		})
		.then(resp => {
			success(resp);
		})
		.catch(error =>{
			error(error);
		});
	}

	getGamesActive(success, error){
		this.axios.get(URI_GAMES,
		{
			'status' : 'Active'
		})
		.then(resp => {
			success(resp);
		})
		.catch(resp => {
			error(resp);
		});
	}

	getGamesDone(success, error){
		this.axios.get(URI_GAMES,
		{
			'status' : 'Done'
		})
		.then(resp => {
			success(resp);
		})
		.catch(resp => {
			error(resp);
		});
	}


}

module.exports = LaravelApiEndPoint;