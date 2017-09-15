/**
 * node服务器，主要用于建立socket连接，并处理聊天事件
 * 注释部分时使用原生http server时基本使用
 * express框架 + socket.io
 */

// 引入配置文件
global.DIR = __dirname;
global.CONFIG = require(global.DIR + '/config/config.json');

var http = require('http');
var express = require('express');
var io = require('socket.io');

var server = http.createServer();
var app = express();

/********************** 原生http server begin *********************************/
// 原生http server
// server.on('request', function (req, res) {
//     console.log(req.httpVersion); //获取到http协议版本
//     console.log(req.url); //获取到URL就是.com后面的/地址
//     console.log(req.method); //获取到请求的方法
//     console.log(req.headers); //获取到请求的头信息
//     console.log('已上为request相关信息');
//
//     //设置头信息。可以不写。我这个就是表示解析成纯文本
//     res.writeHead(200,{'content-type':'text/plain'});
//     //要是HTML可写成:
//     res.writeHead(200, {'content-type': 'text/html;charset=utf-8'})
//     //输出什么,后面加编码不加默认就是utf-8
//     res.write("技术在提高", "utf-8");
//     //结束的时候语句
//     res.end();//最后必须写end
// });
// server.listen(global.CONFIG.port);
// console.log('Server running at port ' + global.CONFIG.port + '.');
/********************** 原生http server end *********************************/

// express架构
server.on('request', app);
var ws = io.listen(server);
// app.get('/', function(req, res) {
//     res.send('welcome to chatRoom!');
// });

// html页面
app.use('/', express.static(__dirname + '/www'));
// 用户列表: {令牌：用户名}
var userInfos = {};
// status列表：{令牌：状态}
var codingStatus = {};
// 用户socket列表
var socketList = {};
// 用户名列表
var nameList = [];
ws.on('connection', function(socket) {
    // server 监听message
    socket.on('message', function(msg) {
        // 服务器向【所有客户端】发送message事件
        ws.sockets.emit('message', {user: userInfos[socket.id], data: msg});
    });
    // server 监听login事件
    socket.on('login', function (name) {
        console.log('login');
        // 服务器记录用户名列表
        nameList.push(name);
        console.log(nameList);
        // 服务器向【请求客户端】发送Login事件
        socket.emit('login', {self: true, data: name, nameList: nameList});
        // 服务器向【其他客户端】发送Login事件
        socket.broadcast.emit('login', {self: false, data: name, nameList: nameList});
        // 服务器记录【请求客户端】的令牌和用户名
        userInfos[socket.id] = name;
        console.log(userInfos);
        // 服务器记录请求客户端】的socket信息
        socketList[name] = socket;
    });
    // server 监听coding事件
    socket.on('coding', function (status) {
        if(status != codingStatus[socket.id]){
            // 服务器向【其他客户端】发送coding事件
            socket.broadcast.emit('coding', {user: userInfos[socket.id], status: status});
        }
        // 服务器记录【请求客户端】的令牌和状态
        codingStatus[socket.id] = status;
    });
    // server 监听私聊事件
    socket.on('privateChat', function (from, to, msg) {
        console.log('privateChat');
        console.log(socketList);
        var target = socketList[to];
        if(target){
            console.log('emit private message to ' + to + ', from ' + from + ', and send message is ' + msg);
            target.emit('pChat', {from: from, to: to, msg: msg});
        }
    });
    
    // server 监听退出聊天室事件
    socket.on('leaveChatRoom', function (name) {
        console.log('leave room');
        // 服务器更新用户名列表
        var indexName = nameList.indexOf(name);
        if (indexName !== -1) {
            nameList.splice(indexName, 1);
        }
        console.log(nameList);
        // 服务器向【请求客户端】发送Login事件
        socket.emit('leaveRoom', {self: true, data: name, nameList: nameList});
        // 服务器向【其他客户端】发送Login事件
        socket.broadcast.emit('leaveRoom', {self: false, data: name, nameList: nameList});
        console.log(userInfos);
        // 服务器更新请求客户端】的socket信息
        delete socketList.name;
    });
});
server.listen(global.CONFIG.port, function() {
    console.log('listen success on ' + global.CONFIG.port);
});

