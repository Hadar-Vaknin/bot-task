import { driver, api, settings } from '@rocket.chat/sdk'
import { config } from './config.js';
settings.username = config.user;
settings.password = config.password;
settings.host = config.host;
let myuserid;

const runbot = async () => {
  await driver.connect();
  myuserid = await driver.login();
  await driver.subscribeToMessages();
  console.log('subscribed');
  driver.reactToMessages(processMessages);
  console.log('connected and waiting for messages');
}

const processMessages = async (err, message) => {
  if (!err) {
    if (message.u._id === myuserid) return;
    console.log(message);
    if (message.msg.toLowerCase().startsWith(config.botName)) {
      await driver.sendToRoomId(await parseMessage(message.msg), message.rid)
    }
  }
}
async function parseMessage(message) {
  const messageParts = message.split(';');
  if (message === config.botName) {
    return config.welcomeMsg;
  }
  let users = [];
  switch (messageParts[1]) {
    case "create_room": {
      if (messageParts.length < config.fiveParts) {
        return config.parametersMissingError;
      }
      users = []
      if (messageParts[config.fourParts] != '') {
        users = messageParts[config.fourParts].split(',')
      }
      return handleCreateRoomCommand(messageParts[config.twoParts], messageParts[config.threeParts], users);
    }
    case "set_user_active_status": {
      if (messageParts.length < config.fourParts) {
        return config.parametersMissingError;
      }
      return await setUserActiveStatus(messageParts[config.twoParts], messageParts[config.threeParts]);
    }
    case "update_roles_of_user": {  
      if (messageParts.length < config.fiveParts) {
        return config.parametersMissingError;
      }
      return await handleUpdateRolesCommand(messageParts[config.twoParts], messageParts[config.threeParts],messageParts[config.fourParts]);
    }
    case "update_group_member": {  
      if (messageParts.length < config.fiveParts) {
        return config.parametersMissingError;
      }
      return await handleUpdateGroupMembersCommand(messageParts[config.twoParts], messageParts[config.threeParts],messageParts[config.fourParts]);
    }
    case "send_message": {
      if (messageParts.length < config.fourParts) {
        return config.parametersMissingError;
      }
      users = [];
      if (messageParts[config.threeParts] === '') {
        return "Please provide user/s!";
      }
      users = messageParts[config.threeParts].split(',');
      const usersAsChannel = [];
      for (let user of users) {
        usersAsChannel.push('@' + user)
      }
      return await sendMessageToUsers(messageParts[config.twoParts], usersAsChannel);
    }
    case "get_details": {  //cmd_bot;get_details;user/room;name
      if (messageParts.length < config.fourParts) {
        return config.parametersMissingError;
      }
      return await handleGetDetailsCommand(messageParts[config.twoParts] , messageParts[config.threeParts]);
    }
    default:
      return config.unvalidCommandError;
  }
}
async function removeUserFromGroup(roomName, userName) {
  try {
    const payLoad = {
      "roomName": roomName,
      "username": userName
    }
    await api.post("groups.kick", payLoad)
    return "Removed user from group succesfuly!"
  } catch (err) {
    return err.error;
  }
}
async function handleGetDetailsCommand(option,name) {
  if (option.toLowerCase() === 'user') {
    return await getUserDetails(name);
  }
  else if (option.toLowerCase() === 'room') {
    return await getRoomDetails(name);
  }
  return "Option user/room only!";
}
async function handleUpdateGroupMembersCommand(option,groupName, userName) {
  if (option.toLowerCase() === 'add') {
    return await addUserToGroup(groupName, userName);
  }
  else if (option.toLowerCase() === 'remove') {
    return await removeUserFromGroup(groupName, userName);
  }
  return "Option add/remove only!";
}
async function handleUpdateRolesCommand(option, userName, roleName) {
  if (option.toLowerCase() === 'add') {
    return await addRoleToUser(userName, roleName);
  }
  else if (option.toLowerCase() === 'remove') {
    return await removeRoleFromUser(userName, roleName);
  }
  return "Option add/remove only!";
}
async function handleCreateRoomCommand(option, roomName, users) {

  if (option.toLowerCase() === 'public') {
    return await createPublicRoom(roomName, users);
  }
  else if (option.toLowerCase() === 'private') {
    return await createPrivateRoom(roomName, users);
  }
  return "Option public/private only!";
}
async function getGroupsInfo() {
  const res = await api.get("groups.listAll", {});
  return res.groups;
}
async function addUserToGroup(groupName, userName) {
  try {
    let userResult = await getUserInfo(userName);
    const payLoad = {
      "roomName": groupName,
      "userId": userResult.user._id
    }
    await api.post("groups.invite", payLoad)
    return "Added user to group succesfuly!"
  } catch (err) {
    return err.error;
  }
}
async function getUserDetails(userName) {
  try {
    let userResult = (await getUserInfo(userName)).user;
    return `That's what I found:\nRoles:${userResult.roles}\nStatus:${userResult.status}\nCreated at:${userResult.createdAt}\n`
  } catch (err) {
    return err.error;
  }
}
async function getRoomDetails(roomName) {
  const allGroups = await getGroupsInfo(roomName);
  for (const group of allGroups) {
    if (group.name === roomName) {
      return `That's what I found:\nTotal messages:${group.msgs}\nCreated at:${group.ts}\n`
    }
  }
  return "Group isn't exist!";

}
async function sendMessageToUsers(msg, users) {
  try {
    const payLoad = {
      "channel": users,
      "text": msg
    }
    await api.post("chat.postMessage", payLoad)
    return "Message was sent!";
  } catch (err) {
    return err.error;
  }
}
async function removeRoleFromUser(userName, roleName) {
  try {
    let user = (await getUserInfo(userName)).user;
    const currentRoles = user.roles;
    if (currentRoles === []) {
      return;
    }
    const index = currentRoles.indexOf(roleName);
    if (index > -1) {
      currentRoles.splice(index, 1);
    }
    else {
      return "Role isn't exist on this user!";
    }
    const payLoad = {
      "data": { "roles": currentRoles },
      "userId": user._id
    }
    await api.post("users.update", payLoad)
    return "Removed role succesfuly!";
  } catch (err) {
    return err.error;
  }
}
async function addRoleToUser(username, roleName) {
  const payLoad = {
    "username": username,
    "roleName": roleName
  }
  try {
    await api.post("roles.addUserToRole", payLoad);
    return "Added role to user succesfuly!"
  } catch (err) {
    return err.error;
  }
}
async function setUserActiveStatus(username, activeStatus) {
  if (activeStatus !== 'true' && activeStatus !== 'false') {
    return "true/false only!";
  }
  try {
    const userInfo = await getUserInfo(username);
    const payLoad = {
      "userId": userInfo.user._id,
      "activeStatus": Boolean(activeStatus)
    }
    await api.post("users.setActiveStatus", payLoad);
    return "User de/active succesfuly!";
  } catch (err) {
    return err.error;
  }
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
  try {
    await api.post("groups.create", payLoad);
    return "Room created succesfuly!";
  } catch (err) {
    return err.error;
  }
}
async function createPublicRoom(roomName, members) {
  const payLoad = {
    "name": roomName,
    "members": members
  }
  try {
    await api.post("channels.create", payLoad);
    return "Room created succesfuly!"
  } catch (err) {
    return err.error;
  }
}
runbot();
