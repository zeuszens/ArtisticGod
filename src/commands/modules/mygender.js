// models
var BotCommand = require('@models/BotCommand');


/**
 * Command: mygender
 * sets your gender user config
 *
 * usage !mygender male
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 * @param   {[Server]}  server  [Object related to the Server the command was typed in.]
 * @param   {[World]}  world   [Object related to the realm and general bot stuff]
 *
 * @return  {[undefined]}
 */

function mygender(msg, server, world) {
  if (msg.args.length == 0) {
    msg.il8nResponse('mygender.noargs');
    return;
  }

  if(msg.args[0] == 'default'){
    server.addUserSetting(msg.user_id, 'gender', 'default');
    msg.il8nResponse('general.auto', {key: "mygender"});
    return;
  }

  var gender = msg.getMessage().trim();
  if (/^(erkek|bay|oğlan|adam|bey|e|)$/i.test(gender)) {
    gender = "ERKEK";
  } else if (/^(kız|kadın|leydi|bayan|dişi|tavuk|k|hanım)$/i.test(gender)) {
    gender = "KADIN";
  } else {
    gender = "KADIN";
  }

  server.addUserSetting(msg.user_id,'gender',gender);

  var response = server.lang('mygender.okay', { gender: gender });
  var voiceName = server.getUserSetting(msg.user_id,'name');
  if( voiceName && voiceName != "default" ) {
    response += "\n" + server.lang('myvoice.noped');
  }

  server.addUserSetting(msg.user_id, 'name', 'default');
  msg.response(response);
};

var command = new BotCommand({
  command_name: 'botcinsiyeti',
  command_arg: 'g',
  execute: mygender,
  short_help: 'mygender.shorthelp',
  long_help: 'mygender.longhelp',
  group: "personalization",
  parameters: "<cinsiyet>"
});

exports.register = function (commands) {
  commands.add(command);
};

exports.unRegister = function (commands) {
  commands.remove(command);
};
