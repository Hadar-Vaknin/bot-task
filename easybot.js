const { driver , api, settings } = require('@rocket.chat/sdk');
const HOST = 'http://localhost:3000';
const USER = 'CMD_BOT';
const PASS = '1234';
const BOTNAME = 'easybot';  
settings.username=USER;
settings.password=PASS;
settings.host=HOST;
var myuserid;

const runbot = async () => {

    const conn = await driver.connect();

    myuserid = await driver.login({username: USER, password: PASS});
    createPublicGroup();
}


const processMessages = async(err, message, messageOptions) => {
  if (!err) {
    if (message.u._id === myuserid) return;

    const roomname = await driver.getRoomName(message.rid);
    if (message.msg.toLowerCase().startsWith(BOTNAME)) {
      const response = message.u.username + 
            ', how can ' + BOTNAME + ' help you with ' +
            message.msg.substr(BOTNAME.length + 1);
      //const sentmsg = await driver.sendDirectToUser(response , message.u.username)   
        }        
    }
}
async function createPrivateGroup(){
    
    const msgObj={
      "name":"groupTest",
      "members":["HV"],
      "readOnly": false
    }
    const res=await api.post("groups.create",JSON.stringify(msgObj));
    
}
async function createPublicGroup(){
    
  const msgObj= {
    "name":"publicChannelTest",
    "members":[],
    "readOnly": false
  }
  const res=await api.post("channels.create",JSON.stringify(msgObj));
  
}
runbot();
