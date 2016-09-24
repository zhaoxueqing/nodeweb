'use strict';

//系统配置文件
var config = require('../config/config.js');
var dataStore = require('../dataStore.js');
//mysql连接
var db = dataStore.db;
//redis连接
var redis = dataStore.redis;
//md5加密扩展
var md5 = require('md5');
//cookie处理扩展
var cookie = require('cookie');

/**
 * get users from db
 */
var getUsers= function*(){
	//查询所有的可用的用户
	var query = "select id, name, status from users where status = 1";
	//查询结果赋值给tmp
	var tmp = yield db.query(query);
	var result = [];
	for(var i in tmp){
		//存储在数组result中
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
var deleteUsers= function*(){
	var id = this.request.query.id;
	if( id == undefined){
		return this.errorCode = 42000
	}
	//检查用户ID是否存在
	var exists = yield db.query('select 1 from users where id ='+id);
	if(exists[0] == undefined){
		//用户ID不存在，返回错误
		return this.errorCode = 42001;
	}
	//将用户ID状态设置为0，表示已经删除
	var query = "update users set status = 0 where id = "+id;
	var result = yield db.query(query);
	return this.replyData = {
		//返回结果
		affectedRows: result.affectedRows
	};
}

/**
 * create users
 */
var createUsers= function*(){
	//用户名，密码
	var name = this.request.body.name;
	var password = this.request.body.password;
	var status = this.request.body.status;
	//用户状态
	status = status == undefined ? 0 : 1;
	//密码长度应大于6
	if(name == undefined || password == undefined || password.length < 6||name == ''){
		return this.errorCode = 42000;
	}
	//查询当前存在的用户中是否存在这个用户名，用户名应该是唯一的
	var exists = yield db.query('select 1 from users where status = 1 and name ="'+name+'"');
	if(exists[0] != undefined){
		//存在用户名name的用户，返回错误
		return this.errorCode = 42006;
	}
	//随机产生16位salt字符串
	var salt = randomString(16, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
	//加密
	salt = md5(salt);
	//用salt的md5值和用户输入密码产生新的密码，存入数据库
	password = md5(salt+md5(password));
	var query = "insert into users (name, password, salt, status, created_at) values('"+name+"', '"+password+"', '"+salt+"', 1 , unix_timestamp());";
	this.log.info(query);
	//返回结果
	var result = yield db.query(query);
	return this.replyData = {
		id: result['insertId']
	};
}

//用于随机产生指定长度的字符串的函数
var randomString = function (length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) 
		result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}


/**
 * update users 更新用户，逻辑和创建用户大致相同
 * 更新用户需要确认用户ID已存在
 */
var updateUsers= function*(){
	var id = this.request.query.id;
	if(id == undefined){
		return this.errorCode = 42000;
	}
	var exists = yield db.query('select 1 from users where status = 1 and id ='+id);
	if(exists[0] == undefined){
		return this.errorCode = 42001;
	}
	var salt = randomString(16, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
	var name = this.request.body.name;
	var password = this.request.body.password;
	exists = yield db.query('select 1 from users where status = 1 and name ="'+name+'" and id != '+id );
	if(exists[0] != undefined){
		return this.errorCode = 42006;
	}
	var status = this.request.body.status;
	status = status == undefined ? 0 : 1;
	if(name == undefined || password == undefined || password.length < 6){
		return this.errorCode = 42000;
	}
	password = md5(salt+md5(password));
	var query = "update users set name = '"+name+"', password = '"+password+"', salt = '"+salt+"', status = "+status+", updated_at = unix_timestamp() where id = "+id;
	this.log.info(query);
	var result = yield db.query(query);
	return this.replyData = {
		affectedRows: result.affectedRows
	};
}	

//用户登录的逻辑
var login = function*(){
	//获取用户输入的用户名和密码
	var name = this.request.body.name;
	var password = this.request.body.password;
	console.log(name+' '+password);
	if(name == undefined || password == undefined || password == ''){
		return this.errorCode = 42000;
	}
	//从数据库中查询当前可用的用户用户名为name的列表
	var query = "select * from users where status = 1 and name = '"+name+"' limit 1";
	this.log.info(query);
	var user = yield db.query(query);
	this.log.info(user);
	if(user[0] == undefined){
		//数据库中不存在用户名为name的用户
		return this.errorCode = 42007;
	}
	//从数据库取出该用户的信息
	user = user[0];
	var data = {};
	console.log(md5(user.salt+md5(password))+'   '+user.password);
	//判断用户输入的密码是否和数据库中的相同
	if(md5(user.salt+md5(password)) == user.password){
		//密码正确，产生用户的accessToken
		var token = md5(name+"/"+new Date().getTime());
		//将accessToken存入redis中
		yield redis.set("accessToken:"+token, user.id);
		//将accessToken存入用户浏览器的Cookie中
		this.cookies.set('accessToken', token);
		data.accessToken = token;
	}
	else{
		//密码错误，返回错误
		return this.errorCode = 42010;
	}
	//返回用户的accessToken
	return this.replyData = data;
}

var logout = function*(){
	var accessToken = this.cookies.get('accessToken');
	var res = yield redis.del('accessToken:'+accessToken);
	return this.replyData = {
		success: res
	};
}
	
module.exports = {
	getUsers: getUsers,
	updateUsers: updateUsers,
	deleteUsers: deleteUsers,
	createUsers: createUsers,
	login: login,
	logout: logout
};

