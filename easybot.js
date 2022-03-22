const { driver, api, settings } = require('@rocket.chat/sdk');
const { async } = require('q');
const HOST = 'http://localhost:3000';
const USER = 'CMD_BOT';
const PASS = '1234';
const BOTNAME = 'easybot';
settings.username = USER;
settings.password = PASS;
settings.host = HOST;
let myuserid;

const runbot = async () => {
  const conn = await driver.connect();
  myuserid = await driver.login({ username: USER, password: PASS });

  await driver.subscribeToMessages();
  console.log('subscribed');

  driver.reactToMessages( processMessages );
  console.log('connected and waiting for messages');
  await addUserToGroup('room3','1')
}


const processMessages = async (err, message, messageOptions) => {
  if (!err) {
    if (message.u._id === myuserid) return;
    const roomname = await driver.getRoomName(message.rid);
    if (message.msg.toLowerCase().startsWith(BOTNAME)) {
      parseMessage(message.msg)
      const response = message.u.username +
      ', how can ' + BOTNAME + ' help you with ' +
      message.msg.substr(BOTNAME.length + 1);
      const sentmsg = await driver.sendDirectToUser(response , message.u.username)   
    }
  }
}
async function parseMessage(message){
  const messageParts=message.split(';');
  console.log(messageParts);
  switch(messageParts[1]) {
    case "create_room":
      let users=[];
      if(messageParts[4]!=''){
        users=messageParts[4].split(',')
      }
      if(messageParts[2].toLowerCase()==='public'){
        await createPublicRoom(messageParts[3] , users); // easybot;create_room;public;room1;dsg,1
      }
      else if(messageParts[2].toLowerCase()==='private'){
        await createPrivateRoom(messageParts[3] , users);  //easybot;create_room;private;room2;dsg,1
      }
      break;

    case "set_user_active_status":
      await setUserActiveStatus(messageParts[2], messageParts[3]);  //easybot;set_user_active_status;1;true
      break;

    case "add_role_to_user":
        await addRoleToUser(messageParts[2], messageParts[3]);  //easybot;add_role_to_user;1;guest
        break;

    case "remove_role_from_user":
        await removeRoleFromUser(messageParts[2], messageParts[3]);  // not working
        break;
    
    case "add_user_to_group":
      await addUserToGroup(messageParts[2], messageParts[3]);  //easybot;add_user_to_group;room3;1
      break;

    default:
      // code block
  }
}

async function addUserToGroup(groupName, username)
{
  const payLoad = {
    "roomName": groupName,
    "userId":await getUserId(username)
  }
  const res = await api.post("groups.invite", payLoad);
}
async function sendMessageToUsers(username , roleName)
{

  
}
async function removeRoleFromUser(username , roleName)
{
  const payLoad = {
    "roleName": "guest",
    "username": "omri"
  }
  const res = await api.post("roles.removeUserFromRole", payLoad);
}
async function addRoleToUser(username , roleName)
{
  const payLoad = {
    "username": username,
    "roleName": roleName
  }
  const res = await api.post("roles.addUserToRole", payLoad);

  console.log(res)
}
async function setUserActiveStatus(username , activeStatus)
{
  const userId=await getUserId(username);
  console.log(userId)
  const payLoad = {
    "userId": userId,
    "activeStatus":Boolean(activeStatus)
  }
  const res = await api.post("users.setActiveStatus", payLoad);

  console.log(res)
}

async function getUserId(username)
{
  const payLoad = {
    "username": username,
  }
  const res = await api.get("users.info", payLoad);
  if(res.error){
    return res.error;
  }
  return res.user._id;
}
async function createPrivateRoom(roomName , members) {
  const payLoad = {
    "name": roomName,
    "members": members
  }
  const res = await api.post("groups.create", payLoad);

}
async function createPublicRoom(roomName , members) {
  const payLoad = {
    "name": roomName,
    "members": members
  }
  const res = await api.post("channels.create", payLoad);
}
runbot();
