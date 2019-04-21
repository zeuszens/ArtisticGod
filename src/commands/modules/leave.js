// models
var BotCommand = require('@models/BotCommand');

function leave(msg, server, world) {
  return msg.il8nResponse('Sen !takipsiz dene');
};


var command = new BotCommand({
  command_name: 'çık',
  execute: leave,
  short_help: 'leave.shorthelp',
  long_help: 'leave.longhelp',
  hidden: true,
  group: "control"
});


exports.register = function (commands) {
  commands.add(command);
};

exports.unRegister = function (commands) {
  commands.remove(command);
};
