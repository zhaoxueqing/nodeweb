'use strict';

var parse = require('co-busboy');
var os = require('os');
var path = require('path');
var fs = require('fs');
var config = require('../config/config.js');
var dataStore = require('../dataStore.js');
var db = dataStore.db;

/**
 * get jobs from db
 */
var getJobs= function*(){
	//获取所有状态为1的招聘信息
	var query = "select * from jobs where status = 1";
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
var deleteJobs= function*(){
	var id = this.request.query.id;
	if( id == undefined){
		return this.errorCode = 42000
	}
	var exists = yield db.query('select 1 from jobs where id ='+id);
	if(exists[0] == undefined){
		return this.errorCode = 42001;
	}
	var query = "update jobs set status = 0 where id = "+id;
	var result = yield db.query(query);
	return this.replyData = {
		affectedRows: result.affectedRows
	};
}

/**
 * create jobs
 */
var createJobs= function*(){
	var parts = parse(this);
	var part;
	var res = [];
	while(part = yield parts){
		//解析表单提交的数据
		res = parsePart(part, res);
	}
	this.log.info(res);
	var name = res['name'];
	//检查招聘信息是否已经存在
	var exists = yield db.query('select 1 from jobs where name ="'+name+'" and status = 1');
	if(exists[0] != undefined){
		return this.errorCode = 42003;
	}
	//从解析的数据中获取招聘要求
	var requirement = getValueFromRes(res, 'requirement', 10);
	this.log.info(requirement);
	requirement = JSON.stringify(requirement);
	//从解析的数据中获取招聘职责
	var responsibility = getValueFromRes(res, 'responsibility', 10);
	this.log.info(responsibility);
	responsibility = JSON.stringify(responsibility);
	//招聘信息的图片链接
	var img_url = res['img'];
	var status = res['status'];
	status = status == undefined ? 0 : 1;
	if(name == undefined || requirement == undefined || responsibility == undefined||name == '' || requirement == '[]' || responsibility == '[]'){
		return this.errorCode = 42000;
	}
	var query = "insert into jobs (name, requirement, responsibility, status, img_url, created_at) values('"+name+"', '"+requirement+"', '"+responsibility+"', "+status+" , '"+img_url+"', unix_timestamp());";
	this.log.info(query);
	var result = yield db.query(query);
	return this.replyData = {
		id: result['insertId']
	};
}

/**
 * update jobs
 */
var updateJobs= function*(){
	//更新招聘信息
	var id = this.request.query.id;
	if(id == undefined){
		return this.errorCode = 42000;
	}
	var exists = yield db.query('select 1 from jobs where status = 1 and id ='+id);
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
	exists = yield db.query('select 1 from jobs where status = 1 and name ="'+name+'" and id != '+id );
	if(exists[0] != undefined){
		return this.errorCode = 42003;
	}
	var requirement = getValueFromRes(res, 'requirement', 10);
	this.log.info(requirement);
	requirement = JSON.stringify(requirement);
	var responsibility = getValueFromRes(res, 'responsibility', 10);
	this.log.info(responsibility);
	responsibility = JSON.stringify(responsibility);
	var img_url = res['img'];
	var status = res['status'];
	status = status == undefined ? 0 : 1;
	if(img_url==''|| img_url== undefined ||name == undefined || requirement == undefined || responsibility == undefined||name == '' || requirement == '' || responsibility == ''){
		return this.errorCode = 42000;
	}
	var query = "update jobs set name = '"+name+"', requirement = '"+requirement+"', responsibility = '"+responsibility+"', status = "+status+", img_url = '"+img_url+"', updated_at = unix_timestamp() where id = "+id;
	this.log.info(query);
	var result = yield db.query(query);
	return this.replyData = {
		affectedRows: result.affectedRows
	};
}	

//从表单提交的数据中获取指定字段的值，用户获取招聘信息要求和职责
var getValueFromRes = function(res, key, num){
	var require = [];
	for(var i = 1 ; i <= num ; i++){
		var tmpKey = key + i;
		if(res[tmpKey] != undefined && res[tmpKey] != ''){
			require.push(res[tmpKey]);
		}
	}
	return require;
}

var parsePart = function(part, res){
	var objName = part.constructor.name;
	if(objName == 'FileStream'){
		var extname = path.extname(part.filename);
		if(extname == '.jpg' || extname == '.png'){
			//将图片存在配置中的目录下
				var stream = fs.createWriteStream(path.join(config.img.img, Math.random().toString()+'_'+part.filename), {mode:0o755});
				part.pipe(stream);
				console.log('uploading %s %s', part.filename, stream.path);
				res[part.fieldname] = config.img.server+'img/'+path.basename(stream.path);
		}
	}
	if(objName == 'Array' && part[0] != undefined && part[1] != undefined&&part[0] != '' && part[1] != ''){
		res[part[0]] = part[1];
	}
	return res;
}
	
//根据tag和name生成二维码并存在配置的二维码目录下，返回二维码的链接
var getQrUrl = function(tag, name){
	var qr_img = qr.image(name+'  '+tag);
	var stream = fs.createWriteStream(path.join(config.img.QR, Math.random().toString()+'_QR.png'), {mode:0o755});
	qr_img.pipe(stream);
	return config.img.server+'QR/'+path.basename(stream.path);
}

module.exports = {
	getJobs: getJobs,
	updateJobs: updateJobs,
	deleteJobs: deleteJobs,
	createJobs: createJobs
};

