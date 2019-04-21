// models
var BotCommand = require('@models/BotCommand');

/**
 * Command: join
 * need to fix this command,
 * will make the bot join you if its not following
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 * @param   {[Server]}  server  [Object related to the Server the command was typed in.]
 * @param   {[World]}  world   [Object related to the realm and general bot stuff]
 *
 * @return  {[undefined]}
 */

function join(msg, server, world) {
  msg.response("Takip komutunu arıyorsun i think");
};

var command = new BotCommand({
  command_name: 'gir',
  execute: join,
  short_help: 'join.shorthelp',
  long_help: 'join.longhelp',
  hidden: true,
  //group: "control"
});


exports.register = function (commands) {
  commands.add(command);
};

exports.unRegister = function (commands) {
  commands.remove(command);
};
