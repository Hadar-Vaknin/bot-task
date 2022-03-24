export const config={
    welcomeMsg:"welcome to cmd bot!\nAvailable commands:\n"+
    "1)cmd_bot;create_room;public/private;roomName;users\n"+
    "2)cmd_bot;set_user_active_status;userName;true/false\n"+
    "3)cmd_bot;add_role_to_user;userName;role\n"+
    "4)cmd_bot;remove_role_from_user;userName;role\n"+
    "5)cmd_bot;add_user_to_group;roomName;userName\n"+
    "6)cmd_bot;remove_user_from_group;roomName;userName\n"+
    "7)cmd_bot;send_message;text;users\n"+
    "8)cmd_bot;get_room_details;roomName\n"+
    "9)cmd_bot;get_user_details;userName\n",
    host :'http://localhost:3000',
    user : 'CMD_BOT',
    password: '1234',
    botName : 'cmd_bot',
    
}