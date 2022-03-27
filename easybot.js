import { driver, api, settings } from '@rocket.chat/sdk'
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
      if (messageParts[config.threeParts] === '') {
        return "Please provide user/s!";
      }
      users = messageParts[config.threeParts].split(',');
      const usersAsChannel = users.map(user => '@' + user)
      return await repository.sendMessageToUsers(messageParts[config.twoParts], usersAsChannel);
    }
    case "get_details": {  
      if (messageParts.length < config.fourParts) {
        return config.parametersMissingError;
      }
      return await handleGetDetailsCommand(messageParts[config.twoParts] , messageParts[config.threeParts]);
    }
    default:
      return config.unvalidCommandError;
  }
}

async function handleGetDetailsCommand(option,name) {
  if (option.toLowerCase() === 'user') {
    return await repository.getUserDetails(name);
  }
  else if (option.toLowerCase() === 'room') {
    return await repository.getRoomDetails(name);
  }
  return "Option user/room only!";
}
async function handleUpdateGroupMembersCommand(option,groupName, userName) {
  if (option.toLowerCase() === 'add') {
    return await repository.addUserToGroup(groupName, userName);
  }
  else if (option.toLowerCase() === 'remove') {
    return await repository.removeUserFromGroup(groupName, userName);
  }
  return "Option add/remove only!";
}
async function handleUpdateRolesCommand(option, userName, roleName) {
  if (option.toLowerCase() === 'add') {
    return await repository.addRoleToUser(userName, roleName);
  }
  else if (option.toLowerCase() === 'remove') {
    return await repository.removeRoleFromUser(userName, roleName);
  }
  return "Option add/remove only!";
}
async function handleCreateRoomCommand(option, roomName, users) {

  if (option.toLowerCase() === 'public') {
    return await repository.createPublicRoom(roomName, users);
  }
  else if (option.toLowerCase() === 'private') {
    return await repository.createPrivateRoom(roomName, users);
  }
  return "Option public/private only!";
}
async function setUserActiveStatus(username, activeStatus) {
  if (activeStatus !== 'true' && activeStatus !== 'false') {
    return "true/false only!";
  }
  try {
    return await repository.setUserActiveStatus(username,activeStatus);
  } catch (err) {
    return err.error;
  }
}

runbot();
