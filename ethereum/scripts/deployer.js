#!/usr/bin/env node

process.on(console.bind(console))

const { inputFile, gasPriceGwei, rpcUrl, SendTx } = require('yargs')
  .usage('Usage: $0 --input-file [file] --gas-price-gwei [gwei] --rpc-url [url] --send-tx [bool]')
  .demandOption(['inputFile', 'gasPriceGwei', 'rpcUrl'])
  .boolean('SendTx')
  .argv;

const deployer = require("./deployerImplementation.js");
deployer.deploy(inputFile, gasPriceGwei, rpcUrl, SendTx);
