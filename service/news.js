'use strict';

var dataStore = require('../dataStore.js');
//数据库链接
var db = dataStore.db;

/**
 * get news from db
 */
var getNews= function*(){
	//获取请求的页面size和offset，用于分页
	//type为news为新闻，announcement为公告
	var type = this.request.query.type;
	var page = this.request.query.page || 1;
	var size = this.request.query.size || 10;
	var offset = (page - 1) * size;
	this.log.info("page "+page+" size "+size);
	if(type != 'news' && type != 'announcement'){
		return this.errorCode = 42000;
	}
	type = type == 'news' ? 0 : 1;
	//查询数据库中status=1存在的新闻或者公告，status=0，表示被删除
	var query = "select * from news where status = 1";
	query += " and type = " + type;
	query += " limit "+offset+", "+size+" ";
	var tmp = yield db.query(query);
	var result = [];
	for(var i in tmp){
		this.log.info(tmp[i]);
		//将结果存入数组中
		result.push(tmp[i]);
	}
	this.log.info(result);
	return this.replyData = {
		//返回结果
		data: result
	};
}

/**
 * delete one 
 */
var deleteNews= function*(){
	//删除逻辑，基本逻辑都是先检查ID是否存在，不存在则报错
	//存在在将该ID状态设置为0，表示删除，然后更新数据库
	var id = this.request.query.id;
	if( id == undefined){
		return this.errorCode = 42000
	}
	var exists = yield db.query('select 1 from news where id ='+id);
	if(exists[0] == undefined){
		return this.errorCode = 42001;
	}
	var query = "update news set status = 0 where id = "+id;
	var result = yield db.query(query);
	return this.replyData = {
		affectedRows: result.affectedRows
	};
}

/**
 * create news or announcement
 */
var createNews= function*(){
	//获取新闻的标题，内容，类型
	var titel = this.request.body.titel;
	var content = this.request.body.content;
	var type = this.request.body.type;
	if(type != 'news' && type != 'announcement'){
		return this.errorCode = 42000;
	}
	type = type == 'news' ? 0 : 1;
	//新闻或者公告的缩略图url，目前无用
	var thumd_url = this.request.body.thumd_url;
	if(titel == undefined || content == undefined||titel == '' || content == ''){
		return this.errorCode = 42000;
	}
	var status = this.request.body.status;
	status = status == undefined ? 0 : 1;
	//存入数据库
	var query = "insert into news (titel, content, type, status, thumd_url, created_at) values('"+titel+"', '"+content+"', '"+type+"', "+status+" , '"+thumd_url+"', unix_timestamp());";
	this.log.info(query);
	var result = yield db.query(query);
	return this.replyData = {
		id: result['insertId']
	};
}

/**
 * update news
 */
var updateNews= function*(){
	//在更新逻辑中，基本上都是先检查ID是否存在，不存在则报错
	//存在，则更新
	var id = this.request.body.id;
	if(id == undefined){
		return this.errorCode = 42000;
	}
	var exists = yield db.query('select 1 from news where status = 1 and id ='+id);
	if(exists[0] == undefined){
		return this.errorCode = 42001;
	}
	var titel = this.request.body.titel;
	var content = this.request.body.content;
	var type = this.request.body.type;
	var status = this.request.body.status;
	status = status == undefined ? 0 : 1;
	if(type != 'news' && type != 'announcement'){
		return this.errorCode = 42000;
	}
	type = type == 'news' ? 0 : 1;
	var thumd_url = this.request.body.thumd_url;
	if(titel == undefined || content == undefined||titel == '' || content == ''){
		return this.errorCode = 42000;
	}
	//更新到数据库中
	var query = "update news set titel = '"+titel+"', content = '"+content+"', type = "+type+", status = "+status+", thumd_url = '"+thumd_url+"', updated_at = unix_timestamp() where id = "+id;
	this.log.info(query);
	var result = yield db.query(query);
	return this.replyData = {
		affectedRows: result.affectedRows
	};
}

//搜索数据，目前只是搜索新闻或者公告中标题含有的字
var searchNews = function*(){
	var titel = this.request.query.titel;
	if(titel == undefined || titel == ''){
		return this.errorCode = 42000;
	}
	var type = this.request.query.type;
	if(type != 'news' && type != 'announcement'){
		return this.errorCode = 42000;
	}
	type = type == 'news' ? 0 : 1;
	//从数据库中搜索titel中带有指定字的新闻或者公告
	var query = "select * from news where status = 1 and titel like '%"+titel+"%' and type = '"+type+"'";
	var tmp = yield db.query(query);
	var result = [];
	for(var i in tmp){
		this.log.info(tmp[i]);
		//将结果存入数组中
		result.push(tmp[i]);
	}
	this.log.info(result);
	return this.replyData = {
		data: result
	};
}
	
module.exports = {
	getNews: getNews,
	updateNews: updateNews,
	deleteNews: deleteNews,
	createNews: createNews,
	searchNews: searchNews
};

