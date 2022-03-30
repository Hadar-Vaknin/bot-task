export const config={
    welcomeMsg:"welcome to cmd bot!\nAvailable commands:\n"+
    "1)cmd_bot;create_room;public/private;roomName;users\n"+
    "2)cmd_bot;set_user_active_status;userName;true/false\n"+
    "3)cmd_bot;update_roles_of_user;add/remove;user;role\n"+
    "4)cmd_bot;update_group_member;add/remove;roomName;user\n"+
    "5)cmd_bot;send_message;text;users;option\n"+
    "7)cmd_bot;get_details;user/room;name\n",
    parametersMissingError: "Not enough parameters!",
    unvalidCommandError : "Unvalid command! - type cmd_bot for commands list.",
    permittedRole:'user'
}