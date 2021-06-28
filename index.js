var express = require('express')
var bodyParser = require('body-parser')
var app = express();
var http = require('http')
var httpServer = http.Server(app);
var io = require('socket.io')(httpServer);
var myDB = require('./MangoDB')

app.use(express.static(__dirname))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
var loggedInUsers = {};


function notifyUsers(exceptionUser, eventName, message) {
    var connectedUsers = Object.keys(loggedInUsers);
    connectedUsers.forEach(function (item) {
        if (item != exceptionUser) {
            io.to(loggedInUsers[item]).emit(eventName, message);
        }
    });
}


app.get('/sayhello', (req, res) => {
    console.log('request received:' + req.url)
    res.send('Hi good morning')
});

app.get('/users', async (req, res) => {
    console.log('request received:' + req.url);
    var users = await myDB.users();
    for (var i = 0; i < users.length; i++) {
        if (loggedInUsers[users[i].UserName] != undefined) {
            users[i].status = 1;
        }
        else {
            users[i].status = 0;
        }
    }
    res.json(users);
});

app.post('/addUser', async (req, res) => {
    console.log('request received:' + req.url);
    var result = await myDB.addUser(req.body);
    var connectedUsers = Object.keys(loggedInUsers);
    connectedUsers.forEach(function (item) {
        if (item != 'admin') {
            io.to(loggedInUsers[item]).emit('usersListUpdated', '');
        }
    });
    res.json(result);
});

app.post('/deleteUser', async (req, res) => {
    console.log('request received:' + req.url);

    var result = await myDB.deleteUser(req.body);

    var socketId = loggedInUsers[req.body.UserName];
    delete loggedInUsers[req.body.UserName];

    var connectedUsers = Object.keys(loggedInUsers);
    connectedUsers.forEach(function (item) {
        if (item != 'admin') {
            io.to(loggedInUsers[item]).emit('usersListUpdated', '');
        }
    });

    io.to(socketId).emit('forceLogout', 'user deleted by admin, need to logout');
    res.json(result);
});

app.post('/verifyCredentials', async (req, res) => {
    console.log('request received:' + req.url);
    var result = await myDB.verifyUser(req.body);
    if (result.status == true) {
        loggedInUsers[req.body.UserName] = req.body.socketId;
    }
    notifyUsers(req.body.UserName, 'onUserLoggedIn', req.body.UserName);
    res.json(result);
});

app.post('/setSocketId', async (req, res) => {
    console.log('request received:' + req.url + ', userName:' + req.body.UserName + ', socketId:' + req.body.socketId);
    loggedInUsers[req.body.UserName] = req.body.socketId;

    var connectedUsers = Object.keys(loggedInUsers);
    connectedUsers.forEach(function (item) {
        if (item != req.body.UserName) {
            io.to(loggedInUsers[item]).emit('onUserLoggedIn', req.body.UserName);
        }
        else {
            io.to(loggedInUsers[item]).emit('activeUsers', connectedUsers);
        }
    });
    res.sendStatus(200);
});

app.post('/userLogout', async (req, res) => {
    console.log('request received:' + req.url + ', userName:' + req.body.UserName + ', socketId:' + req.body.socketId);
    delete loggedInUsers[req.body.UserName];

    var connectedUsers = Object.keys(loggedInUsers);
    connectedUsers.forEach(function (item) {
        if (item != req.body.UserName) {
            io.to(loggedInUsers[item]).emit('onUserLoggedOut', req.body.UserName);
        }
    });
    res.sendStatus(200);
});

app.post('/message', async (req, res) => {
    console.log('request received:' + req.url);
    var msg = {
        from: req.body.sourceUserId,
        sourceUserName: req.body.sourceUserName,
        to: req.body.targetUserId,
        targetUserName: req.body.targetUserName,
        message: req.body.message,
        date: new Date()
    };
    var result = await myDB.addMessage(msg);
    if (loggedInUsers[req.body.targetUserName] != undefined) {
        console.log('sending notification message to user ' + req.body.targetUserName);
        io.to(loggedInUsers[req.body.targetUserName]).emit('notifyMessage', msg);
    }
    //io.emit('notifyMessage', 'welcome');
    res.sendStatus(200);
});

app.get('/messages', (req, res) => {
    res.send("Hi");
});

app.post('/userMessages', async (req, res) => {
    console.log('request received:' + req.url);
    var result = await myDB.userMessages(req.body.sourceUserId, req.body.targetUserId);
    res.json(result);
});


io.on('connection', (socket) => {
    console.log('a user is connected' + socket.id)
});

io.on('disconnect', (socket) => {

});

var server = httpServer.listen(3000, () => {
    console.log('Server is running on ' + server.address().port);
});