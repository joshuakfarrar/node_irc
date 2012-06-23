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
    zirc_client.emit("say", text);
  });
});

zirc_client.on("error", function(err) {
  console.log(err);
});

zirc_client.on("message", function(msg) {
  console.log(msg.prefix + " " + msg.command + " " + msg.message);
});
