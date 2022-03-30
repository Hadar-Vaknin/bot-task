import { api } from '@rocket.chat/sdk'
import { createClient } from 'redis';
let client;
export async function createRedisClient() {
    client = createClient();
    client.on('error', (err) => console.log('Redis Client Error', err));
    await client.connect();
    client.del("HV");
}
export async function getUserFromRedis(userName) {
    return JSON.parse(await client.get(userName))
}
export async function writeUserToRedis(userName ,user) {
    await client.set(userName,JSON.stringify(user));
    await client.expire(userName , (60*15));
}
export async function createPublicRoom(roomName, members) {
    const payLoad = {
        "name": roomName,
        members
      }
      try {
        await api.post("channels.create", payLoad);
        return "Public room created succesfuly!"
      } catch (err) {
        return err.error;
    }
}
export async function createPrivateRoom(roomName, members) {
    const payLoad = {
      "name": roomName,
      members
    }
    try {
      await api.post("groups.create", payLoad);
      return "Private  room created succesfuly!";
    } catch (err) {
      return err.error;
    }
}
export async function getUserInfo(username) {
    let returnedUser = await getUserFromRedis(username);
    if(returnedUser){
      return returnedUser;
    }
    returnedUser= await api.get("users.info", {username});
    await writeUserToRedis(username, returnedUser);
    return returnedUser;
}
export async function setUserActiveStatus(username, activeStatus) {
    const userInfo = await getUserInfo(username);
    const payLoad = {
      "userId": userInfo.user._id,
      "activeStatus": activeStatus
    }
    await api.post("users.setActiveStatus", payLoad);
    return activeStatus ? `User @${username} was activate succesfuly!` : `User @${username} deactivate succesfuly!`;
}
export async function addRoleToUser(username, roleName) {
    try {
      await api.post("roles.addUserToRole", {username,roleName});
      return `Added role to user @${username} succesfuly!`
    } catch (err) {
      return err.error;
    }
}
export async function removeRoleFromUser(userName, roleName) {
    try {
      const user = (await getUserInfo(userName)).user;
      const currentRoles = user.roles;
      
      if (currentRoles && currentRoles.length === 0) {
        return;
      }
      const index = currentRoles.indexOf(roleName);
      if(index<-1){
        return "Role isn't exist on this user!";
      }
      currentRoles.splice(index, 1);
      const payLoad = {
        "data": { "roles": currentRoles },
        "userId": user._id
      }
      await api.post("users.update", payLoad)
      return `Removed role from  user @${userName} succesfuly!`;
    } catch (err) {
      return err.error;
    }
}
export async function addUserToGroup(groupName, userName) {
    try {
      const userResult = await getUserInfo(userName);
      const payLoad = {
        "roomName": groupName,
        "userId": userResult.user._id
      }
      await api.post("groups.invite", payLoad)
      return `Added user @${userName} to group succesfuly!`
    } catch (err) {
      return err.error;
    }
}
export async function removeUserFromGroup(roomName, username) {
    try {
      await api.post("groups.kick", {roomName,username})
      return `Removed user @${username} from group succesfuly!`
    } catch (err) {
      return err.error;
    }
}
export async function isAllUsersExist(users) {
    for(const user of users){
        try{
            await getUserInfo(user);
        }catch(error){

            return {success:false , msg:`User ${user} not exist!` };
        }
    }
    return {success:true};
}
export async function isUserExist(user) {
    try{
        await getUserInfo(user);

        return true;
    }catch(error){
        return false;
    }
}
export async function sendMessageToUsers(text, users, option) {
    try {
      const payLoad = {
        "channel": users,
        option,
        text
      }
      const result=await api.post("chat.postMessage", payLoad);
      if(result.message.unExistingUsers && result.message.unExistingUsers.length!==0){
        return `Message was sent! except: ${result.message.unExistingUsers.join(',')}`
      }
      return "Message was sent!";
    } catch (err) {
      return err.error;
    }
}
export async function getUserDetails(userName) {
    try {
      const userResult = (await getUserInfo(userName)).user;
      return `That's what I found about @${userName}:\nRoles:${userResult.roles}\nStatus:${userResult.status}\nCreated at:${userResult.createdAt}`
    } catch (err) {
      return err.error;
    }
}
async function getGroupsInfo() {
    const res = await api.get("groups.listAll", {});
    return res.groups;
  }
  
export async function getRoomDetails(roomName) {
    const allGroups = await getGroupsInfo(roomName);
    for (const group of allGroups) {
      if (group.name === roomName) {
        return `That's what I found:\nTotal messages:${group.msgs}\nCreated at:${group.ts}\n`
      }
    }
    return "Group isn't exist!";
  
  }