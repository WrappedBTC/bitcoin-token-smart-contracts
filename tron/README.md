This repository has the contracts that implement the wrapped btc token and wrapped eth token on Tron network.

# Installation

    npm install

# Testing

    npm test

# Deployment

    node deployer.js --inputFile [file] --feeLimit [number] --energyLimit [number] --userFeePercentage [number] --rpcUrl [url] --dontSendTx [bool] --tokenName [string]

### Example:
    node deployer.js --inputFile deployerInputTestrpc.json --feeLimit 1000000000 --energyLimit 10000000  --userFeePercentage 50 --rpcUrl 'https://api.shasta.trongrid.io' --dontSendTx false --tokenName 'WBTC'

    * feeLimit: The maximum SUN consumes by deploying this contract (1TRX = 1,000,000SUN)
    * userFeePercentage: The energy consumption percentage specified for the user calling this contract.	
    * energyLimit: The max energy which will be consumed by the owner in the process of execution or creation of the contract.