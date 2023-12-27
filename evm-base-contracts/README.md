This repository has the contracts that implement the wrapped token for BTC, DOGE, ETH and XRP on EVM networks.

# Installation

    npm install

# Compilation

    npm run compile

# Testing

    npm test

# Testing Coverage

    npm run coverage

# Deployment

    node deployer.js --input-file [file] --gas-price-gwei [gwei] --rpc-url [url] ----token-name [string] --dont-send-tx [bool] --skip-add-members [bool]
