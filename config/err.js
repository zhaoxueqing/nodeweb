'use strict'; 

var err;
//错误码和错误信息
var errInfo = {
		40000: "错误的请求或方法",
		50000: "服务器错误",
		40001: "错误参数",
		42000: "错误参数",
		42001: "新闻记录不存在",
		42002: "类目不存在",
		42003: "招聘信息已存在",
		42004: "分类已存在",
		42005: "案例已存在",
		42006: "用户名已存在",
		42007: "用户不存在",
		42010: "用户名或密码错误",
		42011: "非法会话"
};
module.exports = err = function(errorCode){
		//错误码对应的错误信息，默认是“”
		let msg = errorCode in errInfo ? errInfo[errorCode] : "";
		return msg;
};
