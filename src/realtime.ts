import type {Server as HttpServer} from 'node:http';
import {WebSocketServer,WebSocket} from 'ws';
import webpush from 'web-push';
import {AdminState,PushSubscription} from './models/index.js';

let socketServer:WebSocketServer|null=null;
export async function getVapidKeys(){
 if(process.env.VAPID_PUBLIC_KEY&&process.env.VAPID_PRIVATE_KEY)return {publicKey:process.env.VAPID_PUBLIC_KEY,privateKey:process.env.VAPID_PRIVATE_KEY};
 const existing=await AdminState.findOne({key:'_push_vapid'}).lean();
 if(existing?.data?.publicKey&&existing?.data?.privateKey)return existing.data as {publicKey:string;privateKey:string};
 const generated=webpush.generateVAPIDKeys(),saved=await AdminState.findOneAndUpdate({key:'_push_vapid'},{$setOnInsert:{data:generated}},{new:true,upsert:true}).lean();
 return saved!.data as {publicKey:string;privateKey:string};
}

export function attachRealtime(server:HttpServer,authenticate:(request:{url?:string;cookie?:string})=>boolean){
 socketServer=new WebSocketServer({noServer:true});
 server.on('upgrade',(request,socket,head)=>{
  if(!request.url?.startsWith('/api/admin/realtime')||!authenticate({url:request.url,cookie:request.headers.cookie})){socket.destroy();return}
  socketServer!.handleUpgrade(request,socket,head,client=>socketServer!.emit('connection',client,request));
 });
 socketServer.on('connection',client=>client.send(JSON.stringify({type:'connected'})));
}

export async function publishAppointment(appointment:unknown){
 const message=JSON.stringify({type:'appointment.created',data:appointment});
 socketServer?.clients.forEach(client=>{if(client.readyState===WebSocket.OPEN)client.send(message)});
 const {publicKey,privateKey}=await getVapidKeys();
 webpush.setVapidDetails(process.env.VAPID_SUBJECT||'mailto:admin@example.com',publicKey,privateKey);
 const payload=JSON.stringify({title:'New appointment',body:'A new salon appointment has been received.',url:'/admin'});
 const subscriptions=await PushSubscription.find().lean();
 await Promise.all(subscriptions.map(async subscription=>{
  try{await webpush.sendNotification({endpoint:subscription.endpoint,keys:subscription.keys as {p256dh:string;auth:string}},payload)}
  catch(error:any){if(error?.statusCode===404||error?.statusCode===410)await PushSubscription.deleteOne({_id:subscription._id});else console.error('Push notification failed:',error)}
 }));
}
