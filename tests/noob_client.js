var os = require("os"),
    util = require("util");

var zirc_client = require("../index").createClient(null, null, {
  nick: "zippslave",
  chan: "#lolzipp"
});

zirc_client.on("connect", function () {
  console.log('Connected to ' + zirc_client.host + ":" + zirc_client.port);
});

zirc_client.on("ready", function() {
  console.log('READY!');
  process.stdin.resume();
  process.stdin.setEncoding("utf8");

  process.stdin.on("data", function(text) {
    if (text.match(/^\//g)) {
      var command = "";
      // Slash commands for client
      text = text.trim();
      if (text.indexOf(" ") > 1) {
        command = text.toString().substring(1, text.indexOf(" "));
      }
      else {
        command = text.toString().substring(1);
      }
      switch (command) {
        case "quit":
          var message = text.substring(text.indexOf(" ") + 1);
          zirc_client.quit(message);
          process.exit(1);
        break;
        case "whois":
          var args = text.substring(text.indexOf(" ") + 1);
          args = args.split(" ");
          zirc_client.whois(args[0], args[1]);
        break;
        case "away":
          var message = text.substring(text.indexOf(" ") + 1);
          zirc_client.away(message);
        break;
        case "msg":
          var args = text.substring(text.indexOf(" ") + 1);
          args = args.split(" ");
          zirc_client.msg(args.shift(), util.format(args.join(" ")));
        break;
        case "notice":
          var args = text.substring(text.indexOf(" ") + 1);
          args = args.split(" ");
          zirc_client.notice(args.shift(), util.format(args.toString()));
        break;
        case "back":
          zirc_client.back();
        break;
        case "join":
          var args = text.substring(text.indexOf(" ") + 1);
          args = args.split(" ");
          zirc_client.join(args[0]);
        break;
        case "setNick":
          var args = text.substring(text.indexOf(" ") + 1);
          args = args.split(" ");
          zirc_client.setNick(args[0]);
        break; 
        case "leave":
          var args = text.substring(text.indexOf(" ") + 1);
          args = args.split(" ");
          zirc_client.leave(args.shift(), util.format(args.join(" ")));
        break;
        case "topic":
          var args = text.substring(text.indexOf(" ") + 1);
          args = args.split(" ");
          zirc_client.topic(args.shift(), util.format(args.join(" ")));
        break;
        default:
          console.log("That command doesn't exist!");
        break;
      }
      return true;
    }
    zirc_client.say("#lolzipp", text);
  });
});

zirc_client.on("PING", function() {
  zirc_client.pong(os.hostname());
});

zirc_client.on("error", function(err) {
  console.log(err);
});

zirc_client.on("PRIVMSG", function(msg) {
  var username = msg.prefix[0].substring(0, msg.prefix[0].indexOf("!"));
  console.log(util.format("[00:00] <%s> %s", username, msg.args[msg.args.length - 1]));
});

zirc_client.on("message", function(msg) {
  if (msg.command == 001) {
    console.log(msg);
  }
  console.log(msg.args[msg.args.length - 1]);
});
