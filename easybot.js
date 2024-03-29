import { driver, settings } from '@rocket.chat/sdk';
import dotenv from 'dotenv';
import { config } from './config.js';
import * as repository from './repository.js';
import * as redisHandler from './redisHandler.js'
dotenv.config();
settings.username = process.env.USERNAME_ROCKETCHAT ;
settings.password = process.env.PASSWORD;
settings.host = process.env.HOST;
let myuserid;
console.log(settings.username , settings.password , settings.host)
const runbot = async () => {
  await redisHandler.createRedisClient();
  await driver.connect({useSsl: "false" });
  myuserid = await driver.login();
  await driver.subscribeToMessages();
  console.log('subscribed');
  driver.reactToMessages(processMessages);
  console.log('connected and waiting for messages');
}
const processMessages = async (err, message) => {
  if (!err) {
    if (message.u._id === myuserid || (message.t && (message.t==='au' || message.t==='ru')) || (!(await isUserPermitted( message.u.username)))) return;
    if (message.msg.toLowerCase().startsWith(process.env.BOT_NAME)) {
      await driver.sendToRoomId(await parseMessage(message.msg , message.u.username ), message.rid)
    }
  }
}
async function parseMessage(message , userName) {
  let messageParts = message.split(';');
  if (message === process.env.BOT_NAME) {
    return userName + ",\n" + config.welcomeMsg;
  }
  const command=messageParts[1];
  messageParts=messageParts.slice(2); // remove the cmd_bot and the command
  switch (command) {
    case "create_room": {
      if(!validateArgumentsAmount(3,messageParts)){
        return config.parametersMissingError;
      }
      return `${userName},\n*${(await handleCreateRoomCommand(messageParts))}*\nFor: ${command}`;
    }
    case "set_user_active_status": {
      if(!validateArgumentsAmount(2,messageParts)){
        return config.parametersMissingError;
      }
      return `${userName},\n*${(await setUserActiveStatus(messageParts))}*\nFor: ${command}`;
    }
    case "update_roles_of_user": {  
      if(!validateArgumentsAmount(3,messageParts)){
        return config.parametersMissingError;
      }
      return `${userName},\n*${(await handleUpdateRolesCommand(messageParts))}*\nFor: ${command}`;
    }
    case "update_group_member": {  
      if(!validateArgumentsAmount(3,messageParts)){
        return config.parametersMissingError;
      }
      return `${userName},\n*${(await handleUpdateGroupMembersCommand(messageParts))}*\nFor: ${command}`;
    }
    case "send_message": { 
      if(!validateArgumentsAmount(2,messageParts)){
        return config.parametersMissingError;
      }
      const messagePartsCopy=messageParts.join(';');
      return `${userName},\n*${(await handleSendMsgCommand(parseSendMsgInput(messagePartsCopy)))}*\nFor: ${command}`;
    }
    case "get_details": {
      if(!validateArgumentsAmount(2,messageParts)){
        return config.parametersMissingError;
      }  
      return `${userName},\n*${(await handleGetDetailsCommand(messageParts))}*\nFor: ${command}`;
    }
    default:
      return `${userName},\n*${config.unvalidCommandError}*`
  }
}
function parseSendMsgInput(messagePartsCopy) {
  const lastIndexOfseperator = messagePartsCopy.lastIndexOf(';');
  const option=messagePartsCopy.substring(lastIndexOfseperator+1,messagePartsCopy.length);
  const textAndUsers=messagePartsCopy.slice(0,lastIndexOfseperator);
  const text=textAndUsers.substring(0,(textAndUsers.lastIndexOf(';')));
  const users=textAndUsers.substring(textAndUsers.lastIndexOf(';')+1, textAndUsers.length);

  return [text,users,option]
}
async function isUserPermitted(userName){
  const userRoles=(await repository.getUserInfo(userName)).user.roles;
  return userRoles.includes(config.permittedRole);
} 

async function handleSendMsgCommand([text , usersInput, option]) {
  if (usersInput === '') {
    return "Please provide user/s!";
  }
  usersInput = usersInput.split(',');
  const usersAsChannel = usersInput.map(user => `@${user}`)
  return await repository.sendMessageToUsers(text, usersAsChannel,option);
}

function validateArgumentsAmount(validAmount, messageParts){
  return messageParts.length >= validAmount;
}

async function handleGetDetailsCommand([option,name]) {
  if (option.toLowerCase() === config.getDetailsOptions.user) {
    return await repository.getUserDetails(name);
  }
  else if (option.toLowerCase() === config.getDetailsOptions.room) {
    return await repository.getRoomDetails(name);
  }
  return `You can only get details about user or room!\n${option}s not valid.`;
}

async function handleUpdateGroupMembersCommand([option,groupName, userName]) {
  if (option.toLowerCase() === config.updateOptions.add) {
    return await repository.addUserToGroup(groupName, userName);
  }
  else if (option.toLowerCase() === config.updateOptions.remove) {
    return await repository.removeUserFromGroup(groupName, userName);
  }
  return `You can add or remove group memebers only!\n${option}is not valid.`;
}

async function handleUpdateRolesCommand([option, userName, roleName]) {
  if (option.toLowerCase() === config.updateOptions.add) {
    return await repository.addRoleToUser(userName, roleName);
  }
  else if (option.toLowerCase() === config.updateOptions.remove) {
    return await repository.removeRoleFromUser(userName, roleName);
  }
  return `You can add or remove user only!\n${option}is not valid.`; 
}

async function handleCreateRoomCommand([option, roomName, users]) {
  if (users !== '') {
    users = users.split(',')
  }
  if (option.toLowerCase() === config.roomTypes.public) {
    return await repository.createPublicRoom(roomName, users);
  }
  else if (option.toLowerCase() === config.roomTypes.private) {
    return await repository.createPrivateRoom(roomName, users);
  }
  return `Room can only be public or private!\n${option}is not valid.`; 
}

async function setUserActiveStatus([username, activeStatus]) {
  if (activeStatus !== 'true' && activeStatus !== 'false') {
    return `Argument can be true or false only!\n${option}is not valid.`;
  }
  try {
    activeStatus = (activeStatus === "true");
    return await repository.setUserActiveStatus(username,activeStatus);
  } catch (err) {
    return err.error;
  }
}

runbot();

