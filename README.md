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

## Client Events

The driver listens for the following events, which may be emitted by the client:

### "PONG"

### "mode" (channel, set, modes, limit, user, mask)

### "register" (nickname, hostname, servername)

### "setNick" (nickname)

### "join" (channel, key)

### "leave" (channel, reason)

### "kick" (channel, user, reason)

### "invite" (user, channel)

### "topic" (channel, topic)

### "msg" (user, message)

### "notice" (user, message)

### "away" (message)

### "back"

### "whois" (nickname, server)

### "say" (channel, message)

### "quit" (message)
