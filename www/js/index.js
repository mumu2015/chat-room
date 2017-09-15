$(function () {
    var WsSocket = function(url) {
        this.wsUrl = url;
    };
    WsSocket.prototype = {
        init: function () {
            var that = this;
            console.log(this.wsUrl);
            this.socket = io.connect(this.wsUrl);
            //监听message事件
            this.socket.on('message', function(obj){
                $("#chat-room").append("<p><span style='color:red'>"+obj.user+":</span>"+obj.data+"</p>");
            });
            //监听login事件
            this.socket.on('login', function(obj){
                if(obj.self==true){
                    this.loginName = obj.data;
                    $("#chat-room").append("<p><span style='color:red'>Welcome </span>"+obj.data+"</p>");

                }
                if(obj.self==false){
                    $("#chat-room").append("<p><span style='color:red'>"+obj.data+"</span> have joined room!</p>");
                }
                updateSocketList(this.loginName, obj);
            });
            // 监听离开事件
            this.socket.on('leaveRoom', function (obj) {
                if(obj.self==true){
                    $("#chat-room").append("<p><span style='color:red'>You have leave chat room,if you want to chat,please reconnect! </span></p>");
                }
                if(obj.self==false){
                    $("#chat-room").append("<p><span style='color:red'>"+obj.data+"</span> have left room!</p>");
                    updateSocketList(obj.data, obj);
                }
            });
            //监听status事件
            this.socket.on('coding', function(obj){
                if(obj.status==1){
                    $("#coding").append("<p id='"+obj.user+"'><span style='color:red'>"+obj.user+"</span> is coding</p>");
                }
                if(obj.status==0){
                    $("#"+obj.user+"").remove();
                }
            });
            //监听在线用户信息，刷新用户筛选框事件
            var updateSocketList = function(loginName, obj){
                console.log('update');
                console.log(loginName);
                console.log(obj.nameList);
                if(obj.nameList){
                    var appendHtml = "";
                    $.each(obj.nameList, function (index, value) {
                        if (loginName !== value){
                            appendHtml += "<option>" + value + "</option>";
                        }
                    });
                    $("#name_list").append(appendHtml);
                }
            };
            // 监听pChat私聊事件
            this.socket.on('pChat', function (obj) {
                console.log(obj);
                $("#chat-room").append("<p><span style='color:red'>" + obj.from + "</span> send private message to "
                    + obj.to + ": " + obj.msg + "</p>");
            });

            $('#message').on('focus',function(){
                if($('#message').val()!=""){
                    that.socket.emit('coding',1);
                }
                return false;
            });
            $('#message').on('keyup',function(){
                if($('#message').val()!=""){
                    that.socket.emit('coding',1);
                } else {
                    that.socket.emit('coding',0);
                }
            });
            $('#message').on('blur',function(){
                that.socket.emit('coding',0);
            });
            // 提交群聊消息
            $('#send_btn').on('click',function(){
                if($('#message').val()==""){
                    return;
                }
                that.socket.emit('message', $('#message').val());
                $('#message').val("")
                return false;
            });
            // 提交私聊
            $('#send_private_btn').on('click',function(){
                var pChatName = $('#name_list').val();
                if($('#private_message').val() == "" || pChatName == ""){
                    return;
                }
                console.log(that.socket.loginName);
                console.log(pChatName);
                console.log($('#private_message').val());
                that.socket.emit('privateChat', that.socket.loginName, pChatName, $('#private_message').val());
                $('#private_message').val("");
                return false;
            });
            // 退出聊天室
            $('#leave-room').on('click', function () {
                that.socket.emit('leaveChatRoom', that.socket.loginName);
            });

            var time = new Date();
            var name = prompt("输入用户名","name" + time.getHours() + time.getSeconds());
            if (name!=null && name!=""){
                console.log('login');
                this.socket.loginName = name;
                this.socket.emit('login', name);
                console.log('login end');
            }
        }
    };


    var socket = new WsSocket('http://localhost:8000');
    socket.init();
});
