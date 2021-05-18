This repository has the orginal contracts that implement the wrapped btc token.
The contracts in this repo are NOT deployed. You can find the deployed contracts
for the wrapped btc token on the Ethereum network in [ethereumV2/README.md](../ethereumV2/README.md).

# Installation

    npm install

# Compilation

    node_modules/.bin/truffle compile

# Testing

    node_modules/.bin/truffle test

# Testing Coverage

    node node_modules/.bin/solidity-coverage

# Deployment

    node scripts/deployer.js --input-file [file] --gas-price-gwei [gwei] --rpc-url [url]

