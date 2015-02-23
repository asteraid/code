/*
 * Класс для работы с хеш таблицей
 */

var events = require('events');
var util = require('util');

function HashTable(object){
	
	var hash = new Array();
	this.size = 0;

	
	HashTable.prototype.push = function(object){
		hash.push(object);
		this.size = hash.length;
	}
	
	HashTable.prototype.find_user = function(user){
		var ind = -1;
		  
		for(var i = 0; i < hash.length; i++)
		  {
		  if ( i in hash && hash[i].user == user )
			 {
			  ind = i;
			  break;
			 }
		  }
		return ind;
	}

	HashTable.prototype.find_sid = function(sid){
		var ind = -1;
		  
		for(var i = 0; i < hash.length; i++)
		  {
		  if ( i in hash && hash[i].sessionID == sid )
			 {
			  ind = i;
			  break;
			 }
		  }
		return ind;
	}
	
	HashTable.prototype.get_id = function(id){
		if ( id in hash )
			return hash[id];
		else
			return false;
	}	
	
	HashTable.prototype.set = function(id,object){
		if ( id in hash )
			{
			 for ( key in object){
			    hash[id][key] = object[key];
			 	}	
			 return true;
			}
		else
			return false;
	}
	
	HashTable.prototype.remove = function(id){
		if ( id in hash )
			{
				delete hash[id];
				return true;
			}
		else
				return false;
	}
	
	HashTable.prototype.get_hash = function(){
			return hash;
	}	
	
}



module.exports = HashTable;