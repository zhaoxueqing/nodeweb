'use strict';

var parse = require('co-busboy');
var qr = require('qr-image');
var os = require('os');
var path = require('path');
var fs = require('fs');
var dataStore = require('./dataStore.js');
var config = require('./config/config.js');
var redis = dataStore.redis;
var db = dataStore.db;

var whoami = function*(){
	this.log.info(this.request);
	this.log.info(this);
	var re = {
			name: "XUEGUA"
	};
	return this.replyData = re;
}

var err = function*(){
	this.errorCode = 40000;
	return;
}

var testImg = function*(){
	console.log(this.request.body);
	var parts = parse(this);
	var part;
	var res = [];
	while(part = yield parts){
		res = parsePart(part, res);
	}
	this.log.info(res);
	return this.replyData = res;
}

var testQR = function*(){
	var img = qr.image('test kk');
	img.pipe(fs.createWriteStream('testQR.png'));
}

var redisTest = function*(){
	yield redis.set('KK', 'kk');
	let kk = yield redis.get("KK");
	return this.replyData = {
		"kk" : kk
	}
}

var dbTest = function*(){
	let timestamp = yield db.query("select unix_timestamp() as time");
	return this.replyData = {
		"timestamp": timestamp[0].time
	}
}

var parsePart = function(part, res){
	var objName = part.constructor.name;
	if(objName == 'FileStream'){
		var extname = path.extname(part.filename);
		if(extname == '.jpg' || extname == '.png'){
				var stream = fs.createWriteStream(path.join(config.img.carousel, Math.random().toString()+'_'+part.filename), {mode:0o755});
				part.pipe(stream);
				console.log('uploading %s %s', part.filename, stream.path);
				res[part.fieldname] = config.img.server+'carousel'+stream.path;
		}
	}
	if(objName == 'Array' && part[0] != undefined && part[1] != undefined){
		res[part[0]] = part[1];
	}
	return res;
}

module.exports = {
	err: err,
	redisTest: redisTest,
	whoami: whoami,
	dbTest: dbTest,
	testImg: testImg,
	testQR: testQR
}
