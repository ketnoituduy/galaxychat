const socket = io('http://localhost:3000/');
const formChat = document.getElementById('formChat');
const btnLogout = document.getElementById('btnLogout');
const messages = document.getElementById('messages');
const messagesPrivate = document.getElementById('messagesPrivate');
const txtMessage = document.getElementById('txtMessage');
const btnSend = document.getElementById('btnSend');
const titleChat = document.getElementById('titleChat');
var userChat = document.getElementById('userChat');
var inputFile = document.getElementById('inputFile');
var imageLoad = '';
var chatPrivate = false;
var receiver = '';
var listMessagePrivate = [];
inputFile.addEventListener('change',function(e){
    socket.emit('user send data');
    const reader = new FileReader();
    reader.addEventListener('load',()=>{
        imageLoad = reader.result;
        const d = new Date();
        const nameHour = d.toLocaleString('en-US',{hour:'numeric',minute:'numeric',hour12:true})
        if (!chatPrivate){
            socket.emit('user send message',{name:socket.Username,nameHour:nameHour,text:'',img:imageLoad})
        }
        else{
            socket.emit('user send messagePrivate',{name:socket.Username,receiver,nameHour:nameHour,text:'',img:imageLoad})
        }
    })
    reader.readAsDataURL(inputFile.files[0]);
})

btnLogout.addEventListener('click',()=>{
    location = 'http://localhost:3000'
})

btnSend.addEventListener('click',()=>{
    if (chatPrivate){
        sendMessagePrivate()
    }
    else{
        sendMessage()
    }
    
})
function sendMessage(){
    const text = txtMessage.value.trim();
    const d = new Date();
    const nameHour = d.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }) 
    if(text){
        socket.emit('user send message',{name:socket.Username,nameHour:nameHour,text:text});
    }
    txtMessage.value = '';
}
function sendMessagePrivate(){
    const text = txtMessage.value.trim();
    const d = new Date();
    const nameHour = d.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }) 
    if(text){
        socket.emit('user send messagePrivate',{name:socket.Username,receiver:receiver,nameHour:nameHour,text:text});
    }
    txtMessage.value = '';
}
function chatPrivate(element,user){
    element.style.display = 'none';
}
function createImgMessage(value,currentName,name,messages){
    if(value){
        let imgMessage = document.createElement('div');
        imgMessage.setAttribute('id','imgSelected');
        imgMessage.style.background = `url(${value})`;
        imgMessage.style.width = '200px';
        imgMessage.style.height = '200px';
        imgMessage.style.backgroundPosition = 'center';
        imgMessage.style.backgroundRepeat = 'no-repeat';
        imgMessage.style.backgroundSize = 'cover';
        imgMessage.style.borderRadius = '5px';
        if (currentName == name){
            imgMessage.style.marginRight = '5px';
            imgMessage.style.marginLeft = 'auto';
        }
        messages.appendChild(imgMessage);
        imageLoad = '';
    }
}
function createMessageElement(element,messages){
    let name = element.name;
    let nameHour = element.nameHour;
    let text = element.text;
    let message = document.createElement('div');
    message.setAttribute('id','message');
    let head = document.createElement('label');
    head.setAttribute('id','head');
    let body = document.createElement('div');
    body.setAttribute('id','body');
    head.innerHTML = `${name}: ${nameHour} <br>`;
    body.innerHTML = text;
    message.appendChild(head);
    if(element.text){
        message.appendChild(body);
    }
    messages.appendChild(message);
    createImgMessage(element.img,socket.Username,element.name,messages);
    if(socket.Username == name){
        head.style.color = 'red';
        body.style.background = 'green';
        message.style.textAlign = 'right';
        body.style.textAlign = 'left';
        console.log(body.offsetWidth);
        head.style.marginRight = `${(body.offsetWidth>head.offsetWidth) ? body.offsetWidth - head.offsetWidth - 1:0}px`;
    }
    else{
        head.style.color = 'green';
        body.style.background = 'blue';
        message.style.textAlign = 'left';
       
    }
}
function uploadMessage(data){
    messages.innerHTML = '';
    data.forEach(element =>{
        createMessageElement(element,messages);
        
    })
    messages.scrollTo(0,messages.scrollHeight);
}
socket.on('server send username',data=>{
    socket.Username = data;
})
socket.on('Login thanh cong',(data)=>{
    uploadMessage(data);
})
socket.on('danh sach user',(data)=>{
    console.log(data);
    userChat.innerHTML = '';
    data.forEach(element => {
        let wrapper = document.createElement('div');
        wrapper.setAttribute('class','wrapper');
        wrapper.style.marginBottom = '5px';
        wrapper.style.cursor = 'pointer';
        let avatar = document.createElement('img');
        avatar.setAttribute('class','avatar');
        avatar.setAttribute('src',`uploads/avatar/${element.avatar}`)
        avatar.style.width = '40px'
        avatar.style.height = '40px'
        avatar.style.borderRadius = '20px';
        avatar.style.border = '1px solid black';
        let user = document.createElement('div');
        user.setAttribute('class','user');
        user.textContent = `${element.currentUser}`;
        user.style.textAlign = 'center';
       // user.style.border = '1px solid white';
        user.style.padding = '5px';
        user.style.fontSize = '1em';
        user.style.textTransform = 'uppercase';
        user.style.margin = '5px';
        //user.style.background = 'green';
        user.style.color = 'white';
        if (socket.Username != element.currentUser){
            wrapper.appendChild(avatar);
            wrapper.appendChild(user);
            userChat.appendChild(wrapper);
        }
        else{
            document.getElementById('textTitleChat').innerText = `HELLO ${socket.Username}`;
            titleChat.style.textTransform = 'uppercase';
        }
       
        wrapper.onclick = () =>{
            let collection = userChat.children
            for (let i = 0; i < collection.length; i++){
                collection[i].style.background = 'transparent';
            }
            chatPrivate = true;
            messages.style.display = 'none';
            messagesPrivate.style.display = 'block';
            wrapper.style.background = 'black';
            receiver = element.currentUser;
            socket.emit('tap userChat',{name:socket.Username,receiver:receiver})
        }
    });
})
socket.on('message to public',(data) =>{
    createMessageElement(data,messages);
    messages.scrollTo(0,messages.scrollHeight);
})
socket.on('message to receiver',(data)=>{
    console.log(data.name,data.receiver);
    if ((data.name == socket.Username && data.receiver == receiver) ||(data.receiver == socket.Username && data.name == receiver) ){
        createMessageElement(data,messagesPrivate);
        messagesPrivate.scrollTo(0,messagesPrivate.scrollHeight);
    }
})
socket.on('server send messagePrivate',data=>{
    messagesPrivate.innerHTML = '';
    data.forEach(element=>{
        createMessageElement(element,messagesPrivate);
    })
    messagesPrivate.scrollTo(0,messagesPrivate.scrollHeight);
})




