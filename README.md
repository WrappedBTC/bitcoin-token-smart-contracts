This repository has the contracts that implement the wrapped btc token.

# Installation

    npm install

# Compilation

    npm run compile

# Testing

    npm test

# Testing Coverage

    npm run coverage

# Deployment

    node ethereum/deployer.js --input-file [file] --gas-price-gwei [gwei] --rpc-url [url]

# Tron Deployment

    node tron/deployer.js --inputFile [file] --feeLimit [number] --energyLimit [number] --rpcUrl [url] --dontSendTx [bool] --tokenName [string]