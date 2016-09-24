"use strict";

var parse = require('co-busboy');
var os = require('os');
var path = require('path');
var fs = require('fs');
var config = require('../config/config.js');

var uploadImg = function*(){
	var parts = parse(this);
	var part, stream;
	while(part = yield parts){
		if(part.constructor.name != 'FileStream'){
			return this.errorCode = 42000;
		}
		var extname = path.extname(part.filename);
		if(extname != '.jpg' && extname != '.png'){
			return this.errorCode = 42000;
		}
		stream = fs.createWriteStream(path.join(config.img.carousel, Math.random().toString()+'_'+part.filename), {mode:0o755});
		part.pipe(stream);
		this.log.info('uploading %s  %s ', part.filename, stream.path);
		break;
	}
	return this.replyData = {
		path: stream.path
	};
}

var getImgs = function*(){
	var carouselPath = config.img.carousel;
	var imgs = [];
	var imgServer = config.img.server+'carousel';
	try{
		var list = fs.readdirSync(carouselPath);
		for(var i in list){
			console.log(list[i]);
			var extname = path.extname(list[i]);
			console.log(extname);
			if(extname != '.jpg' && extname != '.png'){
				continue;
			}
			imgs.push(imgServer+'/'+list[i]);
		}
	}
	catch(err){
		this.log.error(err);
	}
	return this.replyData = {
		imgs: imgs
	};
};	

module.exports = {
	uploadImg: uploadImg,
	getImgs: getImgs,
};
