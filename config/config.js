'use strict';

var config;
config = {
	runtime: {
		//服务器端口设置，默认端口是8080
		port: process.env.PORT || 8080,
		//服务器域名设置，默认为localhost
		host: process.env.HOST || 'localhost'
	},
	logging: {
		//日志配置
		router: {
			name: "router",
			streams: [{
				stream: process.stderr,
				level: "debug"
			}]
		},
		service: {
			name: "service",
			streams: [{
				stream: process.stderr,
				level: "debug"
			}]
		}
	},
	//数据库配置信息，用户名以及密码等
	database: {
		connectionLimit: 10,
		host: "localhost",
		port: 3306,
		user: "root",
		password: "123456",
		database: "xue"
	},
	//redis配置信息
	redis: {
		host: "localhost",
		port: 6379,
		options: {}
	},
	//图片存放路径配置
	img: {
		//轮播图
		carousel: './img/carousel/',
		//二维码
		QR: './img/QR/',
		//案例图片
		img: './img/img/',
		//图片服务器的域名
		server: 'localhost:8080/'
	},
	//不需要用户认证检查的url
	noCheckUrl: [
		'POST /users',
		'POST /login',
		'GET /news',
		'GET /cases',
		'GET /categories',
		'GET /img',
		'GET /jobs'
	],
	domain: 'localhost',
	//API允许的可以调用的域名，跨域设置
	frontDomain: 'http://localhost:63342'
};

module.exports = config;
