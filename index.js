var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io').listen(http);
users = [];
connections = [];
messages = [];
textColors = [];

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

http.listen(3000, function(){
  console.log('Listening on *:3000');
});

io.on('connection', function(socket){
  connections.unshift(socket);
  console.log('User connected. %s users connected.', connections.length);

  socket.on('disconnect', function(data){
    users.splice(users.indexOf(socket), 1);
    textColors.splice(textColors.indexOf(socket), 1);
    updateUsernames();
    connections.splice(connections.indexOf(socket), 1);
    console.log('User disconnected. %s users connected.', connections.length);
  });

  socket.on('send message', function(data){
    if (data.substring(0,5) === "/nick"){
      socket.username = data.substring(6,data.length);
      users.splice(users.indexOf(socket), 1);
      users.unshift(socket.username);
      updateUsernames();
    }
    if (data.substring(0,10) === "/nickcolor" && data.length === 17){
      textColors[textColors.indexOf(socket)] = data.substring(11,17);
    }
    io.sockets.emit('text color', {color: textColors}); //sends data of RRGGBB to change nickname color
    var d = new Date();
    var n = d.toLocaleTimeString();
    io.sockets.emit('new message', {msg: data, user: socket.username, time: n});
  });

  socket.on('record message', function(data){
    var d = new Date();
    var n = d.toLocaleTimeString();
    messages.push('['+n+'] '+data.myName+': '+data.message);
  });

  socket.on('new user', function(data, callback){
    callback(true);
    if (data === ''){
      socket.username = "user"+Math.floor((Math.random()*100)+1);
    }
    else {
      socket.username = data;
    }
    users.unshift(socket.username);
    textColors.unshift('');
    socket.emit('get messages', messages);
    updateUsernames();
  });

  function checkUniqueName(){
    var unique = true;
    for (i=0;i<users.length;i++){
      if (socket.username === users[i]){
        unique = false;
      }
    }
    return unique
  }

  function updateUsernames(){
    io.sockets.emit('get users', users);
  }
});
