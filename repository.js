import { api } from '@rocket.chat/sdk'

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
    const payLoad = {
      username,
    }
    return await api.get("users.info", payLoad);
}
export async function setUserActiveStatus(username, activeStatus) {
    const userInfo = await getUserInfo(username);
    const payLoad = {
      "userId": userInfo.user._id,
      "activeStatus": Boolean(activeStatus)
    }
    await api.post("users.setActiveStatus", payLoad);
    return Boolean(activeStatus) ? `User @${username} was activate succesfuly!` : `User @${username} deactivate succesfuly!`;
}
export async function addRoleToUser(username, roleName) {
    const payLoad = {
      username,
      roleName
    }
    try {
      await api.post("roles.addUserToRole", payLoad);
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
export async function removeUserFromGroup(roomName, userName) {
    try {
      const payLoad = {
        roomName,
        "username" :userName
      }
      await api.post("groups.kick", payLoad)
      return `Removed user @${userName} from group succesfuly!`
    } catch (err) {
      return err.error;
    }
}
export async function sendMessageToUsers(text, users) {
    try {
      const payLoad = {
        "channel": users,
        text
      }
      await api.post("chat.postMessage", payLoad)
      return "Message was sent!";
    } catch (err) {
      return err.error;
    }
}
export async function getUserDetails(userName) {
    try {
      const userResult = (await getUserInfo(userName)).user;
      return `That's what I found about @${userName}:\nRoles:${userResult.roles}\nStatus:${userResult.status}\nCreated at:${userResult.createdAt}\n`
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