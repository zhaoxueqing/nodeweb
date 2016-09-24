'use strict';

//系统配置文件
var config = require('./config/config.js');
//mysql,redis相应的扩展
var mysql = require('mysql');
var coMysql = require('co-mysql');
var redis = require('redis');
var coRedis = require('co-redis');

//mysql连接池
var pool = coMysql(mysql.createPool(config.database));

exports.db = coMysql(pool);
//建立redis连接
exports.redis = coRedis(redis.createClient(config.redis.port || 6379, config.redis.host || 'localhost', config.redis.options));
