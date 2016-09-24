'use strict';

var qr = require('qr-image');
var parse = require('co-busboy');
var os = require('os');
var path = require('path');
var fs = require('fs');
var config = require('../config/config.js');
var dataStore = require('../dataStore.js');
var db = dataStore.db;

/**
 * get cases from db
 */
var getCases= function*(){
	var query = "select * from cases where status = 1";
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
var deleteCases= function*(){
	var id = this.request.query.id;
	if( id == undefined){
		return this.errorCode = 42000
	}
	var exists = yield db.query('select 1 from cases where id ='+id);
	if(exists[0] == undefined){
		return this.errorCode = 42001;
	}
	var query = "update cases set status = 0 where id = "+id;
	var result = yield db.query(query);
	return this.replyData = {
		affectedRows: result.affectedRows
	};
}

/**
 * create cases or announcement
 */
var createCases= function*(){
	var parts = parse(this);
	var part;
	var res = [];
	while(part = yield parts){
		res = parsePart(part, res);
	}
	this.log.info(res);
	var name = res['name'];
	var exists = yield db.query('select 1 from cases where name ="'+name+'" and status = 1');
	if(exists[0] != undefined){
		return this.errorCode = 42005;
	}
	var tag = res['tag'];
	var description = res['description'];
	var img_url = res['img'];
	var status = res['status'];
	status = status == undefined ? 0 : 1;
	if(name == undefined || tag == undefined||name==''||tag==''||img_url==''){
		return this.errorCode = 42000;
	}
	var qr_url = getQrUrl(name, tag);
	var query = "insert into cases (name, tag, description, status, img_url, qr_url, created_at) values('"+name+"', '"+tag+"', '"+description+"', "+status+" , '"+img_url+"' , '"+qr_url+"', unix_timestamp());";
	this.log.info(query);
	var result = yield db.query(query);
	return this.replyData = {
		id: result['insertId']
	};
}

/**
 * update cases
 */
var updateCases= function*(){
	var id = this.request.query.id;
	if(id == undefined){
		return this.errorCode = 42000;
	}
	var exists = yield db.query('select 1 from cases where status = 1 and id ='+id);
	if(exists[0] == undefined){
		return this.errorCode = 42001;
	}
	var parts = parse(this);
	var part;
	var res = [];
	while(part = yield parts){
		res = parsePart(part, res);
	}
	this.log.info(res);
	var name = res['name'];
	exists = yield db.query('select 1 from cases where status = 1 and name ="'+name+'" and id != '+id );
	if(exists[0] != undefined){
		return this.errorCode = 42005;
	}
	var tag = res['tag'];
	var description = res['description'];
	var img_url = res['img'];
	var status = res['status'];
	status = status == undefined ? 0 : 1;
	if(img_url==''|| img_url== undefined || name == undefined || tag == undefined||name == '' || tag == ''){
		return this.errorCode = 42000;
	}
	var qr_url = getQrUrl(name, tag);
	var query = "update cases set name = '"+name+"', tag = '"+tag+"', description = '"+description+"', status = "+status+", img_url = '"+img_url+"', qr_url = '"+qr_url+"', updated_at = unix_timestamp() where id = "+id;
	this.log.info(query);
	var result = yield db.query(query);
	return this.replyData = {
		affectedRows: result.affectedRows
	};
}	

var parsePart = function(part, res){
	var objName = part.constructor.name;
	if(objName == 'FileStream'){
		var extname = path.extname(part.filename);
		if(extname == '.jpg' || extname == '.png'){
				var stream = fs.createWriteStream(path.join(config.img.img, Math.random().toString()+'_'+part.filename), {mode:0o755});
				part.pipe(stream);
				console.log('uploading %s %s', part.filename, stream.path);
				res[part.fieldname] = config.img.server+'img/'+path.basename(stream.path);
		}
	}
	if(objName == 'Array' && part[0] != undefined && part[1] != undefined){
		res[part[0]] = part[1];
	}
	return res;
}
	
var getQrUrl = function(tag, name){
	var qr_img = qr.image(name+'  '+tag);
	var stream = fs.createWriteStream(path.join(config.img.QR, Math.random().toString()+'_QR.png'), {mode:0o755});
	qr_img.pipe(stream);
	return config.img.server+'QR/'+path.basename(stream.path);
}

module.exports = {
	getCases: getCases,
	updateCases: updateCases,
	deleteCases: deleteCases,
	createCases: createCases
};

