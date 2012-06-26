var os = require("os");

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
          zirc_client.emit("quit", message);
        break;
        default:
          console.log("That command doesn't exist!");
        break;
      }
      return true;
    }
    zirc_client.emit("say", text);
  });
});

zirc_client.on("PING", function() {
  zirc_client.emit("PONG", os.hostname());
});

zirc_client.on("error", function(err) {
  console.log(err);
});

zirc_client.on("message", function(msg) {
  console.log(msg);
});
