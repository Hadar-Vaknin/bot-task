const { driver , api, settings } = require('@rocket.chat/sdk');
// customize the following with your server and BOT account information
const HOST = 'http://localhost:3000';
const USER = 'CMD_BOT';
const PASS = '1234';
const BOTNAME = 'easybot';  // name  bot response to
const SSL = true;  // server uses https ?
const ROOMS = ['GENERAL'];

var myuserid;
// this simple bot does not handle errors, different message types, server resets 
// and other production situations 

const runbot = async () => {
    settings.username=USER;
    settings.password=PASS;
    settings.host=HOST;
    const conn = await driver.connect();

    myuserid = await driver.login({username: USER, password: PASS});
    createPrivateGroup();
    // const subscribed = await driver.subscribeToMessages();
    // console.log('subscribed');

    // const msgloop = await driver.reactToMessages( processMessages );
    // console.log('connected and waiting for messages');
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
    
    const msgObj=    {
        "msg": "method",
        "id": "42",
        "method": "createPrivateGroup",
        "params": [ "roomWithHV", ["HV"], false ]
    }
    const res=await api.post("method.call/createChannel",{"message":JSON.stringify(msgObj)});
    
}
runbot();
