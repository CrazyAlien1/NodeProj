class ErrorHandler
{
	constructor()
	{
		this.errorsCounterID = 0;
		this.errors = new Map();
	}

	addError(msg){
		this.errors.set(this.errorsCounterID, msg);
		this.errorsCounterID++;
	}

	getErrors(){
		let erros = [];
		for(var [key, erro] of this.errors){
			erros.push(erro);
		}
		return erros;
	}

	clearErrors(){
		this.errors.clear();
	}

}

module.exports = ErrorHandler;