'use strict';

//错误码和错误信息的配置文件
var err = require('./config/err.js');
var exports;
module.exports = exports = function(){
		return function*(next){
				(yield next);
				//结果处理逻辑
    			var resp, i, own$ = {}.hasOwnProperty;
				//如果返回的信息中errorCode不是null，说明处理中出错了
				if(this.errorCode != null){
						return this.body = {
								result: false,
								errorCode: this.errorCode,
								//获取相应的错误信息
								errorMsg: err(this.errorCode)
						};
				}
				//处理逻辑中返回有replyData，在replyData中加入字段result是true
				else if(this.replyData != null){
						resp = {
								result: true,
						};
						for (i in this.replyData){ 
								if (own$.call(this.replyData, i)) {
									(fn$.call(this, i, this.replyData[i]));
								}
						}
						return this.body = resp;
				}
				//没有replyData，默认返回result为true的信息
				else {
						return this.body = {
								result:true
						}
				}
				function fn$(k, v){
						resp[k] = v;
				}
		}
};
