const { driver, api, settings } = require('@rocket.chat/sdk');
const { username } = require('@rocket.chat/sdk/dist/lib/settings');
const HOST = 'http://localhost:3000';
const USER = 'CMD_BOT';
const PASS = '1234';
const BOTNAME = 'cmd_bot';
settings.username = USER;
settings.password = PASS;
settings.host = HOST;
let myuserid;

const runbot = async () => {
  const conn = await driver.connect();
  myuserid = await driver.login({ username: USER, password: PASS });

  await driver.subscribeToMessages();
  console.log('subscribed');

  driver.reactToMessages(processMessages);
  console.log('connected and waiting for messages');
}


const processMessages = async (err, message) => {
  if (!err) {
    if (message.u._id === myuserid) return;
    if (message.msg.toLowerCase().startsWith(BOTNAME)) {
      const response = message.u.username +
        ', how can ' + BOTNAME + ' help you with ' +
        message.msg.substr(BOTNAME.length + 1);
      const sentmsg = await driver.sendDirectToUser(await parseMessage(message.msg), message.u.username)
    }
  }
}
async function parseMessage(message) {
  const messageParts = message.split(';');
  let users = [];
  switch (messageParts[1]) {
    case "create_room":
      if (messageParts[4] != '') {
        users = messageParts[4].split(',')
      }
      if (messageParts[2].toLowerCase() === 'public') {
        await createPublicRoom(messageParts[3], users); // CMD_BOT;create_room;public;room1;dsg,1
      }
      else if (messageParts[2].toLowerCase() === 'private') {
        await createPrivateRoom(messageParts[3], users);  //CMD_BOT;create_room;private;room2;dsg,1
      }
      break;

    case "set_user_active_status":
      await setUserActiveStatus(messageParts[2], messageParts[3]);  //CMD_BOT;set_user_active_status;1;true
      break;

    case "add_role_to_user":
      await addRoleToUser(messageParts[2], messageParts[3]);  //CMD_BOT;add_role_to_user;1;guest
      break;

    case "remove_role_from_user":
      await removeRoleFromUser(messageParts[2], messageParts[3]);  // CMD_BOT;remove_role_from_user;omri;user
      break;

    case "add_user_to_group":
      await addUserToGroup(messageParts[2], messageParts[3]);  //CMD_BOT;add_user_to_group;room3;1
      break;

    case "remove_user_from_group":
      await removeUserFromGroup(messageParts[2], messageParts[3]);  //CMD_BOT;remove_user_from_group;room3;1
      break;

    case "send_message":
      users = [];
      if (messageParts[3] === '') {
        return;
      }
      users = messageParts[3].split(',');
      const usersAsChannel = [];
      for (let user of users) {
        usersAsChannel.push('@' + user)
      }
      await sendMessageToUsers(messageParts[2], usersAsChannel);  //CMD_BOT;send_message;hello users;HV,1
      break;

    case "get_room_details":
      return (await getRoomDetails(messageParts[2]));  //CMD_BOT;get_room_details;room5
      break;

    case "get_user_details":
        return (await getUserDetails(messageParts[2]));  //CMD_BOT;get_user_details;1
        break;
    default:
    // code block
  }
}
async function getGroupsInfo() {
  const res = await api.get("groups.listAll", {});
  return res.groups;
}
async function getUserInfo(userName) {
  const payLoad = {
    "username": userName,
  }
  const res = await api.get("users.info", payLoad);
  return res;
}
async function getUserDetails(userName) {
  let userResult=await getUserInfo(userName);
  if(userResult.error){
    return "User isn't exsit!";
  }
  userResult=userResult.user;
  return `Roles:${userResult.roles}\nStatus:${userResult.status}\nCreated at:${userResult.createdAt}\n`

}
async function getRoomDetails(roomName) {
  const allGroups=await getGroupsInfo(roomName);
  for(const group of allGroups){
    if(group.name===roomName){
      return `Total messages:${group.msgs}\nCreated at:${group.ts}\n`
    }
  }
  return "Group isn't exsit!";

}
async function sendMessageToUsers(msg, users) {
  const payLoad = {
    "channel": users,
    "text": msg
  }
  const res = await api.post("chat.postMessage", payLoad);
}
async function getUserRoles(username) {
  const payLoad = {
    "username": username,
  }
  const res = await api.get("users.info", payLoad);
  if (res.error) {
    return res.error;
  }
  return res.user.roles;

}
async function removeRoleFromUser(username, roleName) {
  const currentRoles = await getUserRoles(username);
  if (currentRoles === []) {
    return;
  }
  const index = currentRoles.indexOf(roleName);
  if (index > -1) {
    currentRoles.splice(index, 1); 
  }
  const payLoad = {
    "data": { "roles": currentRoles },
    "userId": await getUserId(username)
  }
  const res = await api.post("users.update", payLoad);
}
async function addRoleToUser(username, roleName) {
  const payLoad = {
    "username": username,
    "roleName": roleName
  }
  const res = await api.post("roles.addUserToRole", payLoad);
}
async function setUserActiveStatus(username, activeStatus) {
  const userId = await getUserId(username);
  console.log(userId)
  const payLoad = {
    "userId": userId,
    "activeStatus": Boolean(activeStatus)
  }
  const res = await api.post("users.setActiveStatus", payLoad);

  console.log(res)
}

async function getUserId(username) {
  const payLoad = {
    "username": username,
  }
  const res = await api.get("users.info", payLoad);
  if (res.error) {
    return res.error;
  }
  return res.user._id;
}
async function createPrivateRoom(roomName, members) {
  const payLoad = {
    "name": roomName,
    "members": members
  }
  const res = await api.post("groups.create", payLoad);

}
async function createPublicRoom(roomName, members) {
  const payLoad = {
    "name": roomName,
    "members": members
  }
  const res = await api.post("channels.create", payLoad);
}
runbot();
