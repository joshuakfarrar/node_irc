#!/usr/bin/env node

// Module deps.
var optimist = require('optimist')
  , NodeManager = require('../lib/node-manager')
  , options = {nodes: []}
  ;

// Setup optimist.
var argv = optimist
    .usage('Usage: $0 [OPTIONS]')
    .alias('n', 'nodes')
    .demand('n')
    .describe('n', 'Comma-separated redis host:port pairs')
    .alias('z', 'zkservers')
    .describe('z', 'Comma-separated ZooKeeper host:port pairs')
    .describe('znodepath', 'Znode path override for storing Redis server list')
    .default('znodepath', '/redis_failover_nodes')
    .describe('max-failures', 'Maximum number of failures before manager marks node as unavailable')
    .alias('h', 'help')
    .describe('h', 'Display all options')
    .argv;

argv.n.split(',').forEach(function (val) {
  var parts = val.split(':');
  options.nodes.push({host: parts[0], port: parts[1]});
});

var manager = new NodeManager(options);