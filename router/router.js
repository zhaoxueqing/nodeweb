'use strict';

var routerTest = require('../test.js');
//redis连接
var redis = require('../dataStore.js').redis;
var routes, checkToken;
//路由扩展
var router = require('koa-middlewares').router();
//新闻和公告的处理API
var news = require('../service/news.js');
var categories = require('../service/categories.js');
var img = require('../service/img.js');
//案例的处理API
var cases = require('../service/cases.js');
//招聘的处理API
var jobs = require('../service/jobs.js');
//用户的处理API
var users = require('../service/users.js');

//参数检查逻辑，目前没有用到
var checkIntParam = function(name){
	return router.param(name, function*(n, next){
		if(!(/^\d+$/.test(n))){
			this.errorCode = 40000;
		}
		else{
			this[name] = n;
			info = {};
			info[name] = n;
			this.log = this.log.child(info);
			return (yield next);
		}
	});
};

//这部分逻辑移到了index.js
exports.checkToken = function*(next){
	var url = this.resquest.url;
	var method = this.resquest.method;
	url = method+' '+url;
	if(url in config.noCheckUrl){
		return (yield next);
	}
	var token = this.cookies.get('accessToken');
	this.log.info('token : '+token);
	var uid = redis.get('accessToken:'+token);
	if(token == undefined || token == '' || uid == undefined || uid == ''){
		return this.errorCode = 42011;
	}
	this.uid = uid;
	return (yield next);
};


module.exports = routes = function(){
	//some fields need to be check in here
	
	//routers 测试的API
	router.get('/whoami', routerTest.whoami);
	router.get('/err', routerTest.err);
	router.get('/redisTest', routerTest.redisTest);
	router.get('/dbTest', routerTest.dbTest);
	router.post('/testImg', routerTest.testImg);
	router.get('/testQR', routerTest.testQR);
	
	//news or announce 新闻和公告的API
	router.get('/news', news.getNews);
	router.post('/news', news.createNews);
	router.put('/news', news.updateNews);
	router.del('/news', news.deleteNews);
	router.get('/news/search', news.searchNews);

	//categories
	router.get('/categories', categories.getCategories);
	router.post('/categories', categories.createCategories);
	router.put('/categories', categories.updateCategories);
	router.del('/categories', categories.deleteCategories);

	//cases 案例的API
	router.get('/cases', cases.getCases);
	router.post('/cases', cases.createCases);
	router.post('/cases/update', cases.updateCases);
	router.del('/cases', cases.deleteCases);

	//img 轮波图的API
	router.post('/img', img.uploadImg);
	router.get('/img', img.getImgs);

	//jobs 招聘信息的API
	router.get('/jobs', jobs.getJobs);
	router.post('/jobs', jobs.createJobs);
	router.post('/jobs/update', jobs.updateJobs);
	router.del('/jobs', jobs.deleteJobs);

	//users 用户的API
	router.get('/users', users.getUsers);
	router.post('/users', users.createUsers);
	router.put('/users', users.updateUsers);
	router.del('/users', users.deleteUsers);

	//login 登录的API
	router.post('/login', users.login);
	//logout 
	router.get('/logout', users.logout);

	return router;
}

