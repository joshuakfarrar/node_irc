# redis_failover

A Redis automatic failover mechanism

# Usage

Installation is a simple
```shell
zipp@redis0:~/redis_failover$ npm install
```

And usage, for now, is also easy

```shell
zipp@redis0:~/redis_failover$ ./bin/redis_failover.js -n 192.168.0.2:6379,192.168.0.3:6379,...
```

Pretty simple for now; doesn't actually do much but check the currently assigned roles of the specified Redis servers. Will likely utilize Zookeeper for elections in the event of a failed node at some points in the future.
