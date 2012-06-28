# node_irc

An IRC driver for node.js

# Usage

Derp

# API

## Connection Events

### "ready"

### "connect"

### "error"

## Server Events

### "PING"

## Client Commands

The driver exposes the following commands, which may be called by the client:

### "pong" (hostname)

The proper way to respond to a PING event from the server. Hostname is an optional argument. If you don't respond to a ping event, it's likely that your client will be automatically disconnected from the server.

```js
client.on("PING", function() {
  client.pong();  
});
```

### "mode" (channel, set, modes, limit, user, mask)

Sets a user's mode in the channel

```js
client.mode("#example", true, "v", null, "zipp", null);
```

### "register" (nickname, hostname, servername)

Attempts to register your nick with the server.

### "setNick" (nickname)

Attempts to change your nickname. Will emit an error event if the nickname is taken.

### "join" (channel, key)

Attempts to join a channel -- if the channel is key protected, accepts a key argument.

### "leave" (channel, reason)

Attempts to leave a channel; reason argument is optional.

### "kick" (channel, user, reason)

Attempts to kick a user from a channel; reason argument is optional.

```js
client.kick("#example", "zipp", "Stop derailing chat with links to pictures of cats");
```
### "invite" (user, channel)

Invites a user to the channel.

### "topic" (channel, topic)

Attempts to set the channel's topic. Emitting the event without a topic resets the topic to the channel's name.

### "msg" (user, message)

Sends a message to a user.

### "notice" (user, message)

Notices a user. Noticing a user is the same as messaging except that any away or auto-responses are ignored.

### "away" (message)

Sets an away message

### "back"

Clears the away message by emitting the away event without a message.

### "whois" (nickname, server)

Grabs various information about the user from the server.

### "say" (channel, message)

Sends a message to a channel.

### "quit" (message)

Initiates a disconnection from the server. Message is optional.
