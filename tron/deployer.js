#!/usr/bin/env node

process.on('unhandledRejection', console.error.bind(console))

const { inputFile, feeLimit, energyLimit, userFeePercentage, rpcUrl, dontSendTx, tokenName } = require('yargs')
  .usage('Usage: $0 --input-file [file] --fee-limit [number] --energy-limit [number] --user-fee-percentage [number] --rpc-url [url] --dont-send-tx [bool] --token-name [string]')
  .demandOption(['inputFile', 'feeLimit', 'energyLimit', 'userFeePercentage', 'rpcUrl', 'tokenName'])
  .boolean('dontSendTx')
  .argv;

const deployer = require("./deployerImplementation.js");
deployer.deploy(inputFile, feeLimit, energyLimit, userFeePercentage, rpcUrl, dontSendTx, tokenName);
 