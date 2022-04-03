import { createClient } from 'redis';
let client;
export async function createRedisClient() {
    try{
      client = createClient({socket: { 
        host:'redis-server',
        port:6379
    }});
    }catch(error){
      console.log(error)
    }
    client.on('error', (err) => console.log('Redis Client Error', err));
    await client.connect();
}
export async function getUserFromRedis(userName) {
    return JSON.parse(await client.get(userName))
}
export async function writeUserToRedis(userName ,user) {
    await client.set(userName,JSON.stringify(user));
    await client.expire(userName , (60*15));
}