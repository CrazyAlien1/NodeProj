const URI_GAMES = "/api/games";
const URI_USERS = "/api/users";
const URI_USER_GAMES = "/api/games/users/";
var axios = require('axios');
class LaravelApiEndPoint
{
	constructor(url, port){
		this.url = url;
		this.port = port;
		this.axios = axios.create({
		  proxy: {
		    host: this.url,
		    port: this.port,
		    /*auth: {
		      username: 'mikeymike',
		      password: 'rapunz3l'
		    }*/
		  },
		});
	}

	login(ID, success, error){
		this.axios.get(URI_USERS + "/"+ ID)
		.then(resp => {
			success(resp);
		})
		.catch(resp => {
			error(resp);
		});
	}

	postCreateGame(gameRequest, success, error){
		this.axios.post(URI_GAMES, {
                //falta o auth token!
                'userID' : gameRequest.player.ID,
                'type' : gameRequest.game.gameType,
                'name' : gameRequest.game.gameName,
                'rows' : gameRequest.game.rows,
                'cols' : gameRequest.game.cols,
        }).then(resp => {
        	success(resp);
        }).catch(resp => {
        	console.log(resp);
			error(resp);
        });
	}

	postJoinGame(user, gameToJoin){
		//post to laravel that some user wants to join the game
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