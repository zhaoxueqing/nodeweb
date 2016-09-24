'use strict';

// 需要的扩展
var koa = require('koa');


var middlewares = require('koa-middlewares');
var urlParse = require('url');
var app = koa();
// 路由配置
var router = require('./router/router.js')();
// 日志扩展
var koaBunyanLogger = require('koa-bunyan-logger');
// 系统配置
var config = require('./config/config.js');
// 处理结果中间件
var handling = require('./handling.js');
// redis的连接
var redis = require('./dataStore.js').redis;

//logger配置
app.use(koaBunyanLogger(config.logging.server));
app.use(koaBunyanLogger.requestLogger());
app.use(koaBunyanLogger.timeContext());

//http body解析配置
app.use(middlewares.bodyParser({
	jsonLimit: '3mb',
	formLimit: '5mb'
}));

//跨域服务器设置，只允许config.frontDomain的域名调用
app.use(function *(next){
	this.set("Access-Control-Allow-Origin", config.frontDomain);
	this.set("Access-Control-Allow-Credentials", true);
	this.set("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTION");
        this.set("Content-Type", "application/json;charset=utf-8");
        yield next;
});

//用户认证检查，config.noCheckUrl中的url不需要检查
var checkToken = function*(next){
	//此次请求的url和方法
	var url = urlParse.parse(this.request.url);
	var method = this.request.method;
	url = method+' '+url.pathname;
	console.log(config.noCheckUrl);
	if(config.noCheckUrl.indexOf(url) >= 0){
		//noCheckUrl中的url不需要accessToken
		return (yield next);
	}
	//获取请求Cookie里的accessToken
	var token = this.cookies.get('accessToken');
	//打印日志
	this.log.info('token : '+token);
	//从redis中查取accessToken记录
	var uid = redis.get('accessToken:'+token);
	if(token == undefined || token == '' || uid == undefined || uid == ''){
		//redis中没有此次请求的accessToken，返回错误，结束处理
		return this.errorCode = 42011;
	}
	//redis中相应accessToken中存储的用户ID
	this.uid = uid;
	//进行下一步的处理
	return (yield next);
};
 
//注册处理结果的中间件
app.use(handling());
//注册检查用户认证的中间件
app.use(checkToken);
//注册服务的路由
app.use(router.routes());
app.use(router.allowedMethods());
//app.on('error',function(err,ctx) {
	//ctx.response.status = 501;
	//ctx.body='error occur';
//	console.log(err);
//});
//启动服务器
app.listen(config.runtime.port, config.runtime.host);
