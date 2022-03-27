import { driver, settings } from '@rocket.chat/sdk'
import { config } from './config.js';
import * as repository from './repository.js';
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
    if (message.u._id === myuserid || (message.t && message.t==='au') ) return;
    console.log(message);
    if (message.msg.toLowerCase().startsWith(config.botName)) {
      await driver.sendToRoomId(await parseMessage(message.msg), message.rid)
    }
  }
}
async function parseMessage(message) {
  let messageParts = message.split(';');
  if (message === config.botName) {
    return config.welcomeMsg;
  }
  const command=messageParts[1];
  messageParts=messageParts.slice(2);
  switch (command) {
    case "create_room": {
      if(!validateArgumentsAmount(3,messageParts)){
        return config.parametersMissingError;
      }
      return handleCreateRoomCommand(messageParts);
    }
    case "set_user_active_status": {
      if(!validateArgumentsAmount(2,messageParts)){
        return config.parametersMissingError;
      }
      return await setUserActiveStatus(messageParts);
    }
    case "update_roles_of_user": {  
      if(!validateArgumentsAmount(3,messageParts)){
        return config.parametersMissingError;
      }
      return await handleUpdateRolesCommand(messageParts);
    }
    case "update_group_member": {  
      if(!validateArgumentsAmount(3,messageParts)){
        return config.parametersMissingError;
      }
      return await handleUpdateGroupMembersCommand(messageParts);
    }
    case "send_message": {
      if(!validateArgumentsAmount(2,messageParts)){
        return config.parametersMissingError;
      }
      const messagePartsCopy=messageParts.join(';');
      const text=messagePartsCopy.slice(0,(messagePartsCopy.lastIndexOf(';')));
      const users=messageParts[messageParts.length-1]
      return await handleSendMsgCommand(text,users)
    }
    case "get_details": {
      if(!validateArgumentsAmount(2,messageParts)){
        return config.parametersMissingError;
      }  
      return await handleGetDetailsCommand(messageParts);
    }
    default:
      return config.unvalidCommandError;
  }
}
async function handleSendMsgCommand(text , usersInput) {
  if (usersInput === '') {
    return "Please provide user/s!";
  }
  console.log(text , usersInput)
  const users = usersInput.split(',');
  const usersAsChannel = users.map(user => '@' + user)
  return await repository.sendMessageToUsers(text, usersAsChannel);
}
function validateArgumentsAmount(validAmount, messageParts){
  return messageParts.length >= validAmount;
}
async function handleGetDetailsCommand([option,name]) {
  if (option.toLowerCase() === 'user') {
    return await repository.getUserDetails(name);
  }
  else if (option.toLowerCase() === 'room') {
    return await repository.getRoomDetails(name);
  }
  return "Option user/room only!";
}
async function handleUpdateGroupMembersCommand([option,groupName, userName]) {
  if (option.toLowerCase() === 'add') {
    return await repository.addUserToGroup(groupName, userName);
  }
  else if (option.toLowerCase() === 'remove') {
    return await repository.removeUserFromGroup(groupName, userName);
  }
  return "Option add/remove only!";
}
async function handleUpdateRolesCommand([option, userName, roleName]) {
  if (option.toLowerCase() === 'add') {
    return await repository.addRoleToUser(userName, roleName);
  }
  else if (option.toLowerCase() === 'remove') {
    return await repository.removeRoleFromUser(userName, roleName);
  }
  return "Option add/remove only!";
}
async function handleCreateRoomCommand([option, roomName, users]) {
  if (users !== '') {
    users = users.split(',')
  }
  if (option.toLowerCase() === 'public') {
    return await repository.createPublicRoom(roomName, users);
  }
  else if (option.toLowerCase() === 'private') {
    return await repository.createPrivateRoom(roomName, users);
  }
  return "Option public/private only!";
}
async function setUserActiveStatus([username, activeStatus]) {
  if (activeStatus !== 'true' && activeStatus !== 'false') {
    return "true/false only!";
  }
  try {
    activeStatus = (activeStatus === "true");
    return await repository.setUserActiveStatus(username,activeStatus);
  } catch (err) {
    return err.error;
  }
}
runbot();
