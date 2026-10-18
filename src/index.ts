import {config} from 'dotenv';
import mongoose from 'mongoose';
import {app} from './app.js';

config({path:new URL('../.env',import.meta.url)});
config({path:new URL('../../.env',import.meta.url)});

const port=Number(process.env.PORT??4000),uri=process.env.MONGODB_URI;
mongoose.set('bufferCommands',false);
app.listen(port,()=>console.log(`API listening on http://localhost:${port}`));

async function connectDatabase(){
 if(!uri){console.warn('MONGODB_URI is not set. Database features are unavailable.');return}
 if(mongoose.connection.readyState===1||mongoose.connection.readyState===2)return;
 try{await mongoose.connect(uri,{dbName:'salon_tiran',serverSelectionTimeoutMS:8_000});console.log('MongoDB connected')}
 catch(error){console.error('Database connection failed; retrying:',error instanceof Error?error.message:'Unknown connection error');setTimeout(connectDatabase,5_000)}
}
mongoose.connection.on('disconnected',()=>setTimeout(connectDatabase,2_000));
void connectDatabase();
