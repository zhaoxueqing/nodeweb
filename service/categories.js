'use strict';

var dataStore = require('../dataStore.js');
var db = dataStore.db;

/**
 * get categories from db
 */
var getCategories= function*(){
	var query = "select * from categories where status = 1";
	var tmp = yield db.query(query);
	var result = [];
	for(var i in tmp){
		result.push(tmp[i]);
	}
	this.log.info(result);
	return this.replyData = {
		data: result
	};
}

/**
 * delete one 
 */
var deleteCategories= function*(){
	var id = this.request.query.id;
	if( id == undefined){
		return this.errorCode = 42000
	}
	var exists = yield db.query('select 1 from categories where id ='+id);
	if(exists[0] == undefined){
		return this.errorCode = 42002;
	}
	var query = "update categories set status = 0 where id = "+id;
	var result = yield db.query(query);
	return this.replyData = {
		affectedRows: result.affectedRows
	};
}

/**
 * create categories
 */
var createCategories= function*(){
	var name = this.request.body.name;
	var description = this.request.body.description;
	if(name == undefined || description == undefined || name == ''){
		return this.errorCode = 42000;
	}
	var status = this.request.body.status;
	status = status == undefined ? 0 : 1;
	var query = "insert into categories (name, description, status, created_at) values('"+name+"', '"+description+"', '"+status+"', unix_timestamp());";
	this.log.info(query);
	var result = yield db.query(query);
	return this.replyData = {
		id: result['insertId']
	};
}

/**
 * update categories
 */
var updateCategories= function*(){
	var id = this.request.body.id;
	if(id == undefined){
		return this.errorCode = 42000;
	}
	var exists = yield db.query('select 1 from categories where id ='+id);
	if(exists[0] == undefined){
		return this.errorCode = 42002;
	}
	var name = this.request.body.name;
	exists = yield db.query('select 1 from categories where name ="'+name+'" and id != '+id );
	if(exists[0] != undefined){
		return this.errorCode = 42004;
	}
	var description = this.request.body.description;
	var status = this.request.body.status;
	status = status == undefined ? 0 : 1;
	if(name == undefined || description == undefined || name == ''){
		return this.errorCode = 42000;
	}
	var query = "update categories set name = '"+name+"', description = '"+description+"', status = "+status+", updated_at = unix_timestamp() where id = "+id;
	this.log.info(query);
	var result = yield db.query(query);
	return this.replyData = {
		affectedRows: result.affectedRows
	};
}	
	
module.exports = {
	getCategories: getCategories,
	updateCategories: updateCategories,
	deleteCategories: deleteCategories,
	createCategories: createCategories
};

