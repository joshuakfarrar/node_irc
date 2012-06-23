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
  this.command_queue = new Queue();
  this.offline_queue = new Queue();
  this.commands_sent = 0;

  var self = this;

  this.on("send", function (message) {
    //this.send_command("PRIVMSG %s :%s", [ this.options.chan, message]);
    this.send_command("PRIVMSG " + this.options.chan + " :" + message);
  });

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
  //if (this.options.nick) {
  this.do_identify();
  //}
  //else {
  //  this.emit("connect");
  //  this.on_ready();
  //}
};

zIRCClient.prototype.do_identify = function () {
  var self = this;

  self.send_anyway = true;
  if (self.options.pass) {
    //self.send_command("PASS %s", [ self.options.pass ]);
    self.send_command("PASS " + self.options.pass);
  }

  // I like the idea of vsprintf(command, args) better than sending concatenated strings..
  // Just need to write a good vsprintf function
  //self.send_command("NICK %s", [ self.options.nick ]);
  //self.send_command("USER %s 0 * :zIRCClient v0.1.0 by Zipp", [ self.options.nick ]);
  //self.send_command("JOIN %s", [ self.options.chan ]);
  self.send_command("NICK " + self.options.nick);
  self.send_command("USER " + self.options.nick + ' 0 * :zIRCClient v0.1.0 by Zipp');
  self.send_command("JOIN " + self.options.chan);
  self.emit("connect");
  self.on_ready();
  self.send_anyway = false;
};

zIRCClient.prototype.on_ready = function () {
  this.ready = true;
  this.emit("ready");
};

zIRCClient.prototype.on_data = function (data) {
  
  var dataString = data.toString(), 
      self = this;

  dataString.split("\r\n").forEach(function (message) {
    if (!message) {
      return true;
    }
    if (message.match(/^PING/g)) {
      self.send_command("PONG");
      return true;
    }
    self.emit("message", self.parse_message(message));
  });
}

zIRCClient.prototype.parse_message = function (msg) {
  // JavaScript, why don't you do regex grouping good?!
  prefix = msg.substring(1, msg.indexOf(" ") - 1);
  message = msg.substring(msg.indexOf(" :") + 2);
  command = msg.substring(msg.indexOf(" ") + 1, msg.indexOf(" :"));
  return new Message(prefix, command, message);
};

zIRCClient.prototype.send_command = function (command) {
  var stream = this.stream;

  if (typeof command !== "string") {
    throw new Error("First argument to send_command must be the command name string, not " + typeof command);
  }
  
  if ((!this.ready && !this.send_anyway) || !stream.writable) {
    return false;
  }

  console.log(command);
  // this.commands_sent += !stream.write(vsprintf(command, args) + "\r\n");
  this.commands_sent += !stream.write(command + "\r\n");
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

/*
zIRCClient.prototype.send = function(message) {
  message = message.trim();
  if (message.match(/^\//)) {
    switch (message.substring(1, message.indexOf(" "))) {
      case "quit":
        quitMessage = message.substring(message.indexOf(" ") + 1);
        console.log(quitMessage);
        this.send_command("QUIT :" + quitMessage);
      break;
      default:
        console.log("That command doesn't exist", message.substring(1));
      break;
    }
    return true;
  }
  this.send_command("PRIVMSG " + this.options.chan + " :" + message);
};
*/

function Message(prefix, command, message) {
  this.prefix = prefix;
  this.command = command;
  this.message = message;
}
