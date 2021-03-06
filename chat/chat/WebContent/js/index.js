$(function() {
	
	var chatroomId="chatroom1";
	var toUserId="";
	var msgType="0";
	var pageNo=1;
	var ws;
	if (!window.WebSocket) {
		alert("WebSocket not supported by this browser!");
		return;
	}else{
		startWebsoket();
	}
	
	function startWebsoket() {
		
		ws = new WebSocket("ws://47.52.109.197:8080/chat/chat?chatroomId="+chatroomId);
		
		//监听消息  
		ws.onmessage = function(event) {
			var data=JSON.parse(event.data);
			console.log("接收到消息：",data);
			var msgType=data.msgType;
			var userList=data.args;
			
			if(msgType=="0"){//群消息
				showMessage(data);
			}else if(msgType=="1"){//私聊
				showMessage(data);
			}else{//系统消息
				showTips(data);
				if(userList){
					update(userList);
				}
			}
			
			$(".main-wrap").scrollTop($(".main").height());
		};
		// 打开WebSocket   
		ws.onclose = function(event) {
			//alert("连接已关闭");
			console.log("连接已关闭");
			ws=null;
		};
		// 打开WebSocket  
		ws.onopen = function(event) {
			//加载聊天记录
			pageNo=1;
			loadPubHistory(pageNo);
			console.log("连接成功");
		};
		ws.onerror = function(event) {
			//WebSocket Status:: Error was reported  
			alert("连接发生错误");
		};
	}
	/**
	 * 单击事件
	 */
	$(".send").click(function(){
		var user=JSON.parse(localStorage.getItem("user"));
		console.log("user:",localStorage.getItem("user"));
		if(!$(".message-box textarea").val()){
			alert("消息不能为空");
			return;
		}
		textMessage.fromUserId=user.userId;
		textMessage.toUserId=toUserId;
		textMessage.msgType=msgType;
		textMessage.nickname=user.nickname;
		textMessage.createTime=new Date().getTime();
		textMessage.content=$(".message-box textarea").val();
		
		$(".message-box textarea").val("");
		
		if(msgType=='1'){
			html='<div class="message-wrap clearfix"><div class="message pull-right"><div><span class="time">'+formatDate(new Date(textMessage.createTime))+'</span><span class="username">'+user.nickname+'</span></div><div class="message-content pull-right">'+textMessage.content+'</div></div></div>';
			$(".main").append(html);
		}
		console.log("发送的消息：",textMessage);
		sendMsg(textMessage);
	});
	var textMessage={
			toUserId:"",
			fromUserId:"",
			nickname:"",
			createTime:new Date().getTime(),
			content:"",
			msgType:""
	}
	function sendMsg(textMessage) {
		if(ws){
			ws.send(JSON.stringify(textMessage));
		}else{
			alert("连接已关闭，请刷新页面重新连接");
		}
		
	}
	/**
	 * 显示系统提示
	 */
	
	function showTips(data){
		var html='<div class="tips"><div class="tips-time">'+formatDate(new Date(data.createTime))+'</div><div class="tips-content">'+data.content+'</div></div>';
		$(".main").append(html);
	}
	
	/**
	 * 显示对话消息
	 */
	function showMessage(data){
		var user=JSON.parse(localStorage.getItem("user"));
		var html="";
		if(data.fromUserId==user.userId){
			html='<div class="message-wrap clearfix"><div class="message pull-right"><div><span class="time">'+formatDate(new Date(data.createTime))+'</span><span class="username">'+user.nickname+'</span></div><div class="message-content pull-right">'+data.content+'</div></div></div>';
		}else{
			html='<div class="message-wrap clearfix"><div class="message pull-left"><div><span class="username">'+data.nickname+'</span><span class="time">'+formatDate(new Date(data.createTime))+'</span></div><div class="message-content pull-left">'+data.content+'</div></div></div>';
		}
		if(html!=""){
			$(".main").append(html);
		}
	}
	/**
	 * 更新用户列表
	 */
	function update(list){
		console.log("开始更新在线列表");
		var html="";
		for(var i=0;i<list.length;i++){
			html+='<li class="online-user"><a href="javascript:"><span class="fa fa-user" data-username="'+list[i].nickname+'" data-userid="'+list[i].userId+'">'+list[i].nickname+'</span></a></li>';
		}
		//删除所有dd节点
		$(".list-online").find("dd").remove();
		$(".list-online").html(html);
		console.log("在线列表更新完成");
		//点击私聊
		$(".online-user").click(function() {
			var toUserName=$(this).find(".fa-user").attr("data-username");
			toUserId=$(this).find(".fa-user").attr("data-userid");
			$(".main-content h2").html("与【"+toUserName+"】聊天");
			console.log(toUserId);
			msgType="1";
			$(this).addClass("active");
			$(this).siblings().removeClass("active");
			
			$(".main").html("");
			
		});
	}
	//选择聊天室
	$(".chatroom-id").click(function() {
		$(this).addClass("active");
		$(this).siblings().removeClass("active");
		$(".online-user").removeClass("active");
		msgType="0";
		var sTitle=$(this).find("span").html();
		chatroomId=$(this).find("span").attr("data-chatroom");
		$(".main-content h2").html(sTitle);
		console.log("chatroomId：",chatroomId);
		$(".main").html("");
		
		//重新连接客户端
		if(ws){
			ws.close();
		}
		startWebsoket();
		
	});
	
	/**
	 * 格式化时间
	 */
	function formatDate(now) {
		var year = now.getFullYear(),
		month = now.getMonth() + 1,
		date = now.getDate(),
		hour = now.getHours(),
		minute = now.getMinutes();
		if(minute<10){
			minute="0"+minute;
		}
		second = now.getSeconds();
		if(second<10){
			second="0"+second;
		}
		 
		return year + "-" + month + "-" + date + " " + hour + ":" + minute + ":" + second;
		}
	
	function loadPubHistory(pageNo){
		
		$.ajax({
			url:"message/getPubHistory",
			dataType:'json',
			data:{
				page:pageNo,
				size:5,
				chatroom:chatroomId
			},
			success:function(data){
				console.log("聊天记录:",data);
				if(data.type=="success"){
					var html="";
					for(var i=data.args.length-1;i>=0;i--){
						html+='<div class="message-wrap clearfix"><div class="message pull-left"><div><span class="username">'+data.args[i].nickname+'</span><span class="time">'+formatDate(new Date(data.args[i].createTime))+'</span></div><div class="message-content pull-left">'+data.args[i].content+'</div></div></div>';
					}
					if(pageNo==1){
						$(".main").html(html);
					}else{
						$(".main").prepend(html);
						
					}
					
				}else{
					console.log(data.content);
				}
			}});
	
	}
	
	$(".tab-user").click(function() {
		$(".list-online").show();
		$(".list-chatroom").hide();
		$(this).addClass("active");
		$(this).siblings().removeClass("active");
		
		
	});
	$(".tab-chatroom").click(function() {
		$(".list-online").hide();
		$(".list-chatroom").show();
		$(this).addClass("active");
		$(this).siblings().removeClass("active");
	});
	//滚动条加载下一页聊天记录
	$(".main-wrap").scroll(function() {
		var nScrollTop = $(this).scrollTop();
		if(nScrollTop<=5){
			pageNo++;
			console.log("page",pageNo);
			if(msgType=='0'){
				loadPubHistory(pageNo);
			}else {
			//TODO	
				console.log("加载私聊聊天记录");
			}
		}
	});
});