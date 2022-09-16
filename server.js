const express = require('express');
const app = express();
const server = require('http').Server(app);
server.listen(process.env.PORT || 3000);
const router = require('./routers.js');

app.use(express.static('public'));
app.set('view engine','ejs');
app.set('views','./views');
//body parse
var bodyparser = require('body-parser');
app.use(bodyparser.urlencoded({extended:false}));
app.use(bodyparser.json());
//socket io
const io = require('socket.io')(server);
const path = require('path');
//database
const mysql = require('mysql');
const db = mysql.createConnection({
    user:'b1102a1e89fcd7',
    password:'63771fdd',
    local:'us-cdbr-east-06.cleardb.net',
    database: 'heroku_2b728aceb07979f'
});
// multer
const multer = require('multer');
const storage1 = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null,'./public/uploads/avatar');
    },
    filename: function(req,file,cb){
        // cb(null, username + path.extname(file.originalname));
        cb(null,file.originalname);
    }
});
const upload = multer({storage:storage1});
const storage2 = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null,'./public/uploads/file/images');
    },
    filename: function(req,file,cb){
        cb(null, file.originalname);
    }
})
const fileSend = multer({storage:storage2}).single('file');
app.use('/',router);
app.get('/chat',(req,res) =>{
    if (currentUser != ''){
        res.render('chat');
    }
    
})
app.get('/register',(req,res) =>{
    res.render('register');
});
app.post('/register',upload.single('file'),(req,res)=>{
    const username = req.body.username.trim();
    const password = req.body.password.trim();
    const avatar = req.file.filename;
    const re_password = req.body.re_password.trim();
    const query = `select * from user where (username = '${username}')`;
    if (username.length >= 2){
        db.query(query,(err,result) =>{
            if(err){
                console.log(err);
                return;
            }
            else{
                if (result.length == 0){
                    if (password.length >= 3 && re_password.length >=3 && password == re_password){
                        console.log('thanh cong');
                        const insert = `insert into user(username,password,avatar) values ('${username}','${password}','${avatar}')`;
                        db.query(insert,(err,result)=>{
                            if (err){
                                console.log(err);
                            }
                            else{
                                console.log('da tao tai khoan');
                                res.redirect('/');
                            }
                        })
                        
                    }
                    else{
                        console.log('loi nhap password')
                    }
                }
                else{
                    console.log('user da su dung');
                }
            }
        })
    }
    else{
        console.log('loi nhap username')
    }
});
app.post('/login',(req,res) =>{
    const username = req.body.name;
    const password = req.body.pass;
    const query = `select * from user where (username = '${username}') and (password = '${password}');`
    if (username && password){
        db.query(query,(err,result) =>{
            if (err){
                console.log(err);
            }
            else{
                if (result.length >= 1){
                    if(userOnline.map(element => element.currentUser).indexOf(username) < 0){
                        currentUser = username;
                        db.query(`select avatar from user where (username = '${currentUser}')`,(err,result)=>{
                            const kq = JSON.parse(JSON.stringify(result));
                            avatar = kq[0].avatar;
                            console.log(avatar);

                        })
                        res.redirect('/chat');
                    }
                    else{
                        console.log('da co user dang nhap');
                    }
                }
                else{
                    console.log('user chua co hoac dang nhap sai');
                }
            }
        })
    }
    else{
        console.log('loi nhap thong tin');
    }
});
//var mangUser = [];
var userOnline = [];
var mangMessage = [];
var currentUser = '';
var avatar = '';
var users = [];
var listMessagePrivate = [];
// socketIO
io.on('connection',(socket) =>{
    userOnline.push({currentUser,avatar});
    console.log(userOnline);
    socket.Username = currentUser;
    users[currentUser] = socket.id;
    socket.emit('server send username',socket.Username);
    io.sockets.emit('danh sach user',userOnline);
    socket.on('disconnect',()=>{
        const number = userOnline.map(element => element.currentUser).indexOf(socket.Username);
        userOnline.splice(number,1);
        currentUser = '';
        socket.broadcast.emit('danh sach user', userOnline);
    })
    socket.emit('Login thanh cong', mangMessage);
    socket.on('user send message',data =>{
        mangMessage.push(data);
        io.sockets.emit('message to public',data);
    })
    socket.on('user send messagePrivate',(data)=>{
        listMessagePrivate.push(data)
        const socketIdSender = users[data.name];
        const socketIdReceiver = users[data.receiver];
        io.to(socketIdSender).emit('message to receiver',data);
        io.to(socketIdReceiver).emit('message to receiver',data);
    })
    socket.on('tap userChat',data=>{
        const messagesPrivate = listMessagePrivate.filter((e)=>{
            return (e.name == data.name && e.receiver == data.receiver) || (e.name == data.receiver && e.receiver == data.name)
        })
        socket.emit('server send messagePrivate', messagesPrivate);
    })
})

// io.on('connection',(socket)=>{
//     socket.Username = currentUser;
//     socket.on('disconnect',()=>{
//         userOnline.splice(userOnline.indexOf(socket.Username),1);
//         currentUser = '';
//         io.sockets.emit('danh sach user',userOnline);
//     })
//     socket.on('logout',()=>{
//         userOnline.splice(userOnline.indexOf(socket.Username),1);
//         currentUser = '';
//         io.sockets.emit('danh sach user',userOnline);
//     });
//     socket.on('create account',(data)=>{
        
//         if (mangUser.map(element => element.username).indexOf(data.username) >= 0){
//             socket.emit('dang ky that bai')
//         }
//         else{
//             mangUser.push({username: data.username, password: data.password});
//             db.query(`INSERT INTO user (username,password) VALUES('${data.username}','${data.password}');`,(err,result) =>{
//                 if(err){
//                     console.log(err)
//                 }
//             })
//             socket.emit('dang ky thanh cong');
//         }
//     })
//     socket.on('Login',data =>{
//         socket.Username = data.username;
//         username = socket.Username;
//         //su dung for de chay ham return
//         if (userOnline.indexOf(data.username) >= 0){
//             socket.emit('Ten da duoc dang nhap tu mot may khac');
//             return;
//         }
//         for(let val of mangUser){
//             if (val.username == data.username && val.password == data.password){
//                 userOnline.push(data.username);
//                 console.log('mangmessage',mangMessage);
//                 socket.emit('Login thanh cong',mangMessage);
//                 io.sockets.emit('danh sach user',userOnline);
//                 return;
//             }
//         }
//         console.log('dang nhap that bai')
//         socket.emit('Login that bai');
//     })
//     socket.on('user send message',(data) =>{
//         mangMessage.push(data);
//         io.sockets.emit('server send message',data);
//     })
// })