const http=require('http');
const express=require('express');
const app=express();
const server=http.createServer(app);
const io=require('socket.io')(server);

io.on('connection',(socket)=>{
});