import {driver, api, settings }  from '@rocket.chat/sdk'
import { config } from './config.js';
settings.username = config.user;
settings.password = config.password;
settings.host = config.host;
let myuserid;

const runbot = async () => {
  await driver.connect();
  myuserid = await driver.login({ username: config.user, password: config.password});
  await driver.subscribeToMessages();
  console.log('subscribed');
  driver.reactToMessages(processMessages);
  console.log('connected and waiting for messages');
}

const processMessages = async (err, message) => {
  if (!err) {
    if (message.u._id === myuserid) return;
    if (message.msg.toLowerCase().startsWith(config.botName)) {
      await driver.sendDirectToUser(await parseMessage(message.msg), message.u.username)
    }
  }
}
async function parseMessage(message) {
  const messageParts = message.split(';');
  if(message===config.botName){
    return config.welcomeMsg;
  }
  let users = [];
  switch (messageParts[1]) {
    case "create_room":  
      if(messageParts.length<5){
        return "Not enough parameters!";
      }
      users=[]
      if (messageParts[4] != '') {
        users = messageParts[4].split(',')
      }
      return handleCreateRoomCommand(messageParts[2],messageParts[3],users);


    case "set_user_active_status":  
      if(messageParts.length<4){
        return "Not enough parameters!";
      }
      return await setUserActiveStatus(messageParts[2], messageParts[3]); 


    case "add_role_to_user":   
      if(messageParts.length<4){
        return "Not enough parameters!";
      }
      return await addRoleToUser(messageParts[2], messageParts[3]);  


    case "remove_role_from_user": 
      if(messageParts.length<4){
        return "Not enough parameters!";
      }
      return await removeRoleFromUser(messageParts[2], messageParts[3]);  


    case "add_user_to_group": 
      if(messageParts.length<4){
        return "Not enough parameters!";
      }
      return await addUserToGroup(messageParts[2], messageParts[3]);  //CMD_BOT;add_user_to_group;room3;1


    case "remove_user_from_group":
      if(messageParts.length<4){
        return "Not enough parameters!";
      }
      return await removeUserFromGroup(messageParts[2], messageParts[3]);  //CMD_BOT;remove_user_from_group;room3;1

    case "send_message": 
      if(messageParts.length<4){
        return "Not enough parameters!";
      }
      users = [];
      if (messageParts[3] === '') {
        return "Please provide user/s!";
      }
      users = messageParts[3].split(',');
      const usersAsChannel = [];
      for (let user of users) {
        usersAsChannel.push('@' + user)
      }
      return await sendMessageToUsers(messageParts[2], usersAsChannel); 

    case "get_room_details":
      if(messageParts.length<3){
        return "Not enough parameters!";
      }
      return await getRoomDetails(messageParts[2]);  


    case "get_user_details":  
      if(messageParts.length<3){
        return "Not enough parameters!";
      }
      return await getUserDetails(messageParts[2]);  

    default:
      return "Unvalid command! - type cmd_bot for commands list.";
  }
}
async function removeUserFromGroup(roomName , userName){
  const payLoad = {
    "roomName": roomName,
    "username":userName
  }
  if(!(await api.post("groups.kick", payLoad))){
    return "Error occurred!"
  }
  return "Removed user from group!"
}
async function handleCreateRoomCommand(option,roomName,users){
  if (option.toLowerCase() === 'public') {
    if(!(await createPublicRoom(roomName, users))){
      return "Error occurred!";
    }
    return "Room created succesfuly!";
  }
  else if (option.toLowerCase() === 'private') {
    if(!(await createPrivateRoom(roomName, users))){
      return "Error occurred!";
    }
    return "Room created succesfuly!";
  }
  return "Option true/false only!";
}
async function getGroupsInfo() {
  const res = await api.get("groups.listAll", {});
  return res.groups;
}
async function addUserToGroup(groupName, userName)
{
  let userResult=await getUserInfo(userName);
  if(!userResult){
    return "User isn't exsit!";
  }
  const payLoad = {
    "roomName": groupName,
    "userId":userResult.user._id
  }
  if(!(await api.post("groups.invite", payLoad))){
    return "Error occurred!"
  }
  return "Added user to group succesfuly!"
}
async function getUserDetails(userName) {
  let userResult=await getUserInfo(userName);
  if(!userResult){
    return "User isn't exsit!";
  }
  userResult=userResult.user;
  return `That's what I found:\nRoles:${userResult.roles}\nStatus:${userResult.status}\nCreated at:${userResult.createdAt}\n`

}
async function getRoomDetails(roomName) {
  const allGroups=await getGroupsInfo(roomName);
  for(const group of allGroups){
    if(group.name===roomName){
      return `That's what I found:\nTotal messages:${group.msgs}\nCreated at:${group.ts}\n`
    }
  }
  return "Group isn't exsit!";

}
async function sendMessageToUsers(msg, users) {
  const payLoad = {
    "channel": users,
    "text": msg
  }
  if(!(await api.post("chat.postMessage", payLoad))){
    return "Error occurred!"
  }
  return "Message was sent!";
}

async function removeRoleFromUser(userName, roleName) {
  let user=await getUserInfo(userName);
  if(!user){
    return "User isn't exist!"
  }
  user=user.user;
  const currentRoles = user.roles;
  if (currentRoles === []) {
    return;
  }
  const index = currentRoles.indexOf(roleName);
  if (index > -1) {
    currentRoles.splice(index, 1); 
  }
  else{
    return "Role isn't exist on this user!";
  }
  const payLoad = {
    "data": { "roles": currentRoles },
    "userId": user._id
  }
  if(!(await api.post("users.update", payLoad))){
    return "Error occurred!";
  }
  return "Removed role succesfuly!";
}
async function addRoleToUser(username, roleName) {
  const payLoad = {
    "username": username,
    "roleName": roleName
  }
  
  if(!(await api.post("roles.addUserToRole", payLoad))){
    return "Error occurred!"
  }
  return "Added role to user succesfuly!"
}
async function setUserActiveStatus(username, activeStatus) {
  if(activeStatus!=='true' && activeStatus!=='false'){
    return "true/false only!";
  }
  const userInfo = await getUserInfo(username);
  if(!userInfo){
    return "User isn't exist!"
  }
  const payLoad = {
    "userId": userInfo.user._id,
    "activeStatus": Boolean(activeStatus)
  }
  const res = await api.post("users.setActiveStatus", payLoad);
  if(!res){
    return "Error occured!";
  }

  return "User de/active succesfuly!";
}

async function getUserInfo(username) {
  const payLoad = {
    "username": username,
  }
  return await api.get("users.info", payLoad);
}
async function createPrivateRoom(roomName, members) {
  const payLoad = {
    "name": roomName,
    "members": members
  }
  await api.post("groups.create", payLoad);
}
async function createPublicRoom(roomName, members) {
  const payLoad = {
    "name": roomName,
    "members": members
  }
  return await api.post("channels.create", payLoad);
}
runbot();
