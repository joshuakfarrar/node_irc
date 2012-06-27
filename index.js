var net = require("net"),
    events = require("events"),
    util = require("util"),
    Queue = require("./lib/queue"),
    to_array = require("./lib/to_array"),
    CHANNEL_PREFIXES = [ '#', '&', '!', '+' ],
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
    The driver accepts these events from the client
    - join
    - leave
    - kick
    - invite
    - topic
    - mode
    - say
    - msg
    - notice
    - away
    - back
    - whois
    - register
    - setNick
    - quit
  */
  this.on("PONG", function (hostname) {
    this.send_command("PONG %s", [ hostname ]);
  });

  this.on("mode", function (channel, set,  modes, limit, user, mask) {
    var command = '';
    if (set) {
      command = "MODE " + channel + " +" + modes;
    }
    else {
      command = "MODE " + channel + " -" + modes;
    }
    if (typeof limit == 'number') {
      command = command + " " + limit;
    }
    else if (typeof user === 'string') {
      command = command + " " + user;
    }
    else if (typeof mask === 'string') {
      command = command + " " + mask;
    }
    self.send_command(command);
  });

  this.on("register", function (nickname, hostname, servername) {
    if (typeof self.options.password === 'string') {
      self.send_command("PASS %s", [ self.options.password ]);
    }
    self.emit("setNick", nickname);
    if (typeof self.options.username !== 'string') {
      self.options.username = nickname;
    }
    self.send_command("USER %s %s %s :%s", [ self.options.username, hostname, servername, self.options.realname ]);
  });

  this.on("setNick", function (nickname) {
    self._triedNickname = nickname;
    self.send_command("NICK %s", [ nickname ]);
  });

  this.on("join", function (channel, key) {
    if (CHANNEL_PREFIXES.indexOf(channel.charAt(0)) == -1) {
      channel = "#" + channel;
    }
    if (typeof key !== 'string') {
      self.send_command("JOIN %s", [ channel ]);
    }
    else {
      self.send_command("JOIN %s %s", [ channel, key ]);
    } 
  });

  this.on("leave", function (channel, reason) {
    if (CHANNEL_PREFIXES.indexOf(channel.charAt(0)) == -1) {
      channel = "#" + channel;
    }
    if (typeof reason !== 'string') {
      self.send_command("PART %s", [ channel ]);
    }
    else {
      self.send_command("PART %s :%s", [ channel, reason ]);
    }
  });

  this.on("kick", function (channel, user, reason) {
    if (CHANNEL_PREFIXES.indexOf(channel.charAt(0)) == -1) {
      channel = "#" + channel;
    }
    if (typeof reason !== 'string') {
      self.send_command("KICK %s %s", [ channel, user ]);
    }
    else {
      self.send_command("KICK %s %s :%s", [ channel, user, reason ]);
    }
  });

  this.on("invite", function (user, channel) {
    if (CHANNEL_PREFIXES.indexOf(channel.charAt(0)) == -1) {
      channel = "#" + channel;
    }
    self.send_command("INVITE %s %s", [ user, channel ]);
  });

  this.on("topic", function (channel, topic) {
    if (CHANNEL_PREFIXES.indexOf(channel.charAt(0)) == -1) {
      channel = "#" + channel;
    }
    if (typeof topic !== 'string') {
      this.send_command("TOPIC %s", [ channel ]);
    }
    else {
      this.send_command("TOPIC %s :%s", [ channel, topic ]);
    }
  });

  this.on("msg", function (user, message) {
    this.send_command("PRIVMSG %s :%s", [ user, message ]);
  });

  this.on("notice", function (user, message) {
    this.send_command("NOTICE %s :%s", [ user, message ]);
  });

  this.on("away", function (message) {
    message = (typeof message == 'undefined') ? '' : message;
    this.send_command("AWAY :%s", [ message ]);
  });

  this.on("back", function () {
    this.emit("away");
  });

  this.on("whois", function(nickname, server) {
    if (!server) {
      this.send_command("WHOIS %s", [ nickname ]);
    }
    else {
      this.send_command("WHOIS %s %s", [ nickname, server ]);
    }
  });

  this.on("say", function (channel, message) {
    if (CHANNEL_PREFIXES.indexOf(channel.charAt(0)) == -1) {
      channel = "#" + channel;
    }
    this.send_command("PRIVMSG %s :%s", [ channel, message ]);
  });

  this.on("quit", function (message) {
    this.send_command("QUIT :%s", [ message ]);
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
  self.send_command("USER %s 0 * :zIRCClient v0.4.0 by Zipp", [ self.options.nick ]);
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
    case "PRIVMSG":
      self.emit("PRIVMSG", message);
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
