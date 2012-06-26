var net = require("net"),
    events = require("events"),
    util = require("util"),
    Queue = require("./lib/queue"),
    to_array = require("./lib/to_array"),
    default_port = "6667",
    default_host = "irc.freenode.net";

function zIRCClient(stream, options) {
  this.stream = stream;
  this.options = options = options || {};

  this.connected = false;
  this.ready = false;
  this.connections = 0;

  this.send_anyway = false;
  this.commands_sent = 0;

  var self = this;

  /*
    Client-generated event handling
    The driver needs to accept these messages from the client
  */
  this.on("PONG", function (hostname) {
    this.send_command("PONG %s", [ hostname ]);
  });

  this.on("PRIVMSG", function (message) {
    this.send_command("PRIVMSG %s :%s", [ this.options.chan, message]);
  });

  this.on("quit", function (message) {
    this.send_command("QUIT :%s", [ message ]);
    process.exit();
  });

  /*
    Connection events
  */
  this.stream.on("connect", function() {
    self.on_connect();
  });

  this.stream.on("data", function(buffer_from_socket) {
    self.on_data(buffer_from_socket);
  });

  events.EventEmitter.call(this);
}
util.inherits(zIRCClient, events.EventEmitter);
exports.zIRCClient = zIRCClient;

zIRCClient.prototype.on_connect = function () {
  this.connected = true;
  this.ready = false;
  this.connections += 1;

  // Need to write stuff to do if no options have been passed to the driver
  this.do_identify();
};

zIRCClient.prototype.do_identify = function () {
  var self = this;

  self.send_anyway = true;
  if (self.options.pass) {
    self.send_command("PASS %s", [ self.options.pass ]);
  }

  self.send_command("NICK %s", [ self.options.nick ]);
  self.send_command("USER %s 0 * :zIRCClient v0.3.0 by Zipp", [ self.options.nick ]);
  self.send_command("JOIN %s", [ self.options.chan ]);
  self.emit("connect");
  self.on_ready();
  self.send_anyway = false;
};

zIRCClient.prototype.on_ready = function () {
  this.ready = true;
  this.emit("ready");
};

zIRCClient.prototype.on_data = function (data) {
  var self = this,
      lines = [],
      delimiter = '\n',
      message;

  lines = data.toString().split(delimiter);

  lines.forEach(function (line) {
    if (line.charAt(line.length - 1) == '\r') {
      line = line.slice(0, -1);
    }
    self.handle_command(self.parse_message(line));
  });
}

zIRCClient.prototype.handle_command = function (message) {
  var self = this;
  if (!message) {
    return false;
  }

  /*
    Server->Driver command handling
    What to do when you get a command of case 'x' from the server
  */
  switch (message.command) {
    case "PING":
      self.emit("PING");
    break;
    default:
      self.emit("message", message);
    break;
  }

  return true;
}

zIRCClient.prototype.parse_message = function (msg) {
  var args = [];
  if (!msg) {
    return false;
  }
  if (msg.match(/^:/g)) {
    var prefix = msg.substring(1).split(' ', 1);
  }
  if (msg.indexOf(" :") != -1) {
    if (msg.match(/^:/g)) {
      args = msg.substring(msg.indexOf(" ") + 1, msg.indexOf(" :")).split(" ");
    }
    else {
      args = msg.substring(0, msg.indexOf(" :")).split(" ");
    }
   args.push(msg.substring(msg.indexOf(" :") + 2));
  }
  else {
    args = msg.substring(msg.indexOf(" ") + 1).split(" ");
  }
  command = args.shift();
  command = command.toUpperCase();

  return new Message(prefix, command, args);
};

zIRCClient.prototype.send_command = function (command, args) {
  var stream = this.stream;

  if (typeof command !== "string") {
    throw new Error("First argument to send_command must be the command name string, not " + typeof command);
  }

  if ((!this.ready && !this.send_anyway) || !stream.writable) {
    return false;
  }

  var vsprintf = function (string, args) {
    if (Array.isArray(args)) {
      args.forEach(function(arg) {
        string = util.format(string, arg);
      });
    }
    return string;
  }

  util.log(vsprintf(command, args));
  this.commands_sent += !stream.write(vsprintf(command, args) + "\r\n");
  return true;
};

exports.createClient = function(port_arg, host_arg, options) {
  var port = port_arg || default_port,
      host = host_arg || default_host,
      zirc_client, net_client;

  net_client = net.createConnection(port, host);
  zirc_client = new zIRCClient(net_client, options);

  zirc_client.port = port;
  zirc_client.host = host;

  return zirc_client;
};

function Message(prefix, command, args) {
  this.prefix = prefix;
  this.command = command;
  this.args = args;
}
