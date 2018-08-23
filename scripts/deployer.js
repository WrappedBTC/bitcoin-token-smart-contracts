#!/usr/bin/env node

const Web3 = require("web3");
const fs = require("fs");
const path = require('path');
const RLP = require('rlp');
const BigNumber = require('bignumber.js')

process.on('unhandledRejection', console.error.bind(console))

//current run command: node web3deployment/oasisReserveDeployer.js --gas-price-gwei 3 --rpc-url https://mainnet.infura.io 
const { gasPriceGwei, printPrivateKey, rpcUrl, signedTxOutput, dontSendTx, chainId: chainIdInput } = require('yargs')
    .usage('Usage: $0 --gas-price-gwei [gwei] --print-private-key [bool] --rpc-url [url] --signed-tx-output [path] --dont-send-tx [bool] --chain-id')
    .demandOption(['gasPriceGwei', 'rpcUrl'])
    .boolean('printPrivateKey')
    .boolean('dontSendTx')
    .argv;
const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
const solc = require('solc')

let rand = web3.utils.randomHex(7);
const privateKey = web3.utils.sha3("in joy we trust" + rand);
console.log("privateKey", privateKey);

if (printPrivateKey) {
  let path = "privatekey_"  + web3.utils.randomHex(7) + ".txt";
  fs.writeFileSync(path, privateKey, function(err) {
      if(err) {
          return console.log(err);
      }
  });
}
const account = web3.eth.accounts.privateKeyToAccount(privateKey);
const sender = account.address;
const gasPrice = BigNumber(gasPriceGwei).times(10 ** 9);
const signedTxs = [];
let nonce;
let chainId = chainIdInput;

console.log("from",sender);

async function sendTx(txObject) {
    const txTo = txObject._parent.options.address;

    let gasLimit;
    try {
        gasLimit = await txObject.estimateGas();
    }
    catch (e) {
        gasLimit = 500 * 1000;
    }

    if(txTo !== null) {
        gasLimit = 500 * 1000;
    }

    gasLimit *= 1.2;
    gasLimit -= gasLimit % 1;

    const txData = txObject.encodeABI();
    const txFrom = account.address;
    const txKey = account.privateKey;

    const tx = {
        from : txFrom,
        to : txTo,
        nonce : nonce,
        data : txData,
        gas : gasLimit,
        chainId,
        gasPrice
    };

    const signedTx = await web3.eth.accounts.signTransaction(tx, txKey);
    nonce++;
    // don't wait for confirmation
    signedTxs.push(signedTx.rawTransaction)
    if (!dontSendTx) {
        web3.eth.sendSignedTransaction(signedTx.rawTransaction, {from:sender});
    }
}

async function deployContract(solcOutput, contractName, ctorArgs) {

    const actualName = contractName;
    const bytecode = solcOutput.contracts[actualName].bytecode;
    const abi = solcOutput.contracts[actualName].interface;
    const myContract = new web3.eth.Contract(JSON.parse(abi));
    const deploy = myContract.deploy({data:"0x" + bytecode, arguments: ctorArgs});

    let address = "0x" + web3.utils.sha3(RLP.encode([sender,nonce])).slice(12).substring(14);
    address = web3.utils.toChecksumAddress(address);

    await sendTx(deploy);

    myContract.options.address = address;

    return [address, myContract];
}

const controllerContractPath = path.join(__dirname, "../contracts/controller/");
const factoryContractPath = path.join(__dirname, "../contracts/factory/");
const tokenContractPath = path.join(__dirname, "../contracts/token/");
const utilsContractPath = path.join(__dirname, "../contracts/utils/");

const input = {
    "Withdrawable.sol" : fs.readFileSync(utilsContractPath + 'Withdrawable.sol', 'utf8'),
    "WithdrawableOwner.sol" : fs.readFileSync(utilsContractPath + 'WithdrawableOwner.sol', 'utf8'),
    "IndexedMapping.sol" : fs.readFileSync(utilsContractPath + 'IndexedMapping.sol', 'utf8'),
    "Controller.sol" : fs.readFileSync(controllerContractPath + 'Controller.sol', 'utf8'),
    "ControllerInterface.sol" : fs.readFileSync(controllerContractPath + 'ControllerInterface.sol', 'utf8'),
    "Factory.sol" : fs.readFileSync(factoryContractPath + 'Factory.sol', 'utf8'),
    "Members.sol" : fs.readFileSync(factoryContractPath + 'Members.sol', 'utf8'),
    "MembersInterface.sol" : fs.readFileSync(factoryContractPath + 'MembersInterface.sol', 'utf8'),
    "Token.sol" : fs.readFileSync(tokenContractPath + 'Token.sol', 'utf8'),
    "TokenInterface.sol" : fs.readFileSync(tokenContractPath + 'TokenInterface.sol', 'utf8')
};

function findImports (_path) {
    if(_path.includes("openzeppelin-solidity")) 
        return { contents: fs.readFileSync("node_modules/" + _path, 'utf8') }
    else
        return { contents: fs.readFileSync(path.join(__dirname, "../contracts/", _path), 'utf8') }
}

const privateKeyCustodian = web3.utils.sha3("XXXXXXX");
console.log("privateKeyCustodian", privateKeyCustodian);
const accountCustodian = web3.eth.accounts.privateKeyToAccount(privateKeyCustodian);
const accountCustodianAddress = accountCustodian.address;
console.log("accountCustodianAddress", accountCustodianAddress);

const privateKeyMerchant = web3.utils.sha3("XXXXXXX");
console.log("privateKeyMerchant", privateKeyMerchant);
const accountMerchant = web3.eth.accounts.privateKeyToAccount(privateKeyMerchant);
const accountMerchantAddress = accountMerchant.address;
console.log("accountMerchantAddress", accountMerchantAddress);

const privateKeyMultiSig = web3.utils.sha3("XXXXXXX");
console.log("privateKeyMultiSig", privateKeyMultiSig);
const accountMultiSig = web3.eth.accounts.privateKeyToAccount(privateKeyMultiSig);
const accountMultiSigAddress = accountMultiSig.address;
console.log("accountMultiSigAddress", accountMultiSigAddress);

async function main() {
    nonce = await web3.eth.getTransactionCount(sender);
    console.log("nonce",nonce);

    chainId = chainId || await web3.eth.net.getId()
    console.log('chainId', chainId);

    console.log("starting compilation");
    const output = await solc.compile({ sources: input }, 1, findImports);
    console.log(output.errors);
    console.log("finished compilation");

    if (!dontSendTx) {
        await waitForEth();
    }

    /////////////////////////////////////////////////////////////

    let tokenAddress, tokenContract;
    [tokenAddress, tokenContract] = await deployContract(output, "Token.sol:Token", []);
    console.log("tokenAddress: " + tokenAddress);

    let controllerAddress, controllerContract;
    [controllerAddress, controllerContract] = await deployContract(output, "Controller.sol:Controller", [tokenAddress]);
    console.log("controllerAddress: " + controllerAddress)

    let membersAddress, membersContract;
    [membersAddress, membersContract] = await deployContract(output, "Members.sol:Members", []);
    console.log("membersAddress: " + membersAddress)

    let factoryAddress, factoryContract;
    [factoryAddress, factoryContract] = await deployContract(output, "Factory.sol:Factory", [controllerAddress]);
    console.log("factoryAddress: " + factoryAddress)

    ////////////////////////////////////////////////////////////

    console.log("controllerContract.methods.setFactory: " + factoryAddress)
    await sendTx(controllerContract.methods.setFactory(factoryAddress));

    console.log("controllerContract.methods.setMembers: " + membersAddress)
    await sendTx(controllerContract.methods.setMembers(membersAddress));

    ////////////////////////////////////////////////////////////

    console.log("tokenContract.methods.transferOwnership: " + controllerAddress)
    await sendTx(tokenContract.methods.transferOwnership(controllerAddress));

    console.log("controllerContract.methods.callClaimOwnership: " + tokenAddress)
    await sendTx(controllerContract.methods.callClaimOwnership(tokenAddress));

    console.log("factoryContract.methods.transferOwnership: " + controllerAddress)
    await sendTx(factoryContract.methods.transferOwnership(controllerAddress));

    console.log("controllerContract.methods.callClaimOwnership: " + factoryAddress)
    await sendTx(controllerContract.methods.callClaimOwnership(factoryAddress));

    ////////////////////////////////////////////////////////////

    console.log("membersContract.methods.addCustodian: " + accountCustodianAddress)
    await sendTx(membersContract.methods.addCustodian(accountCustodianAddress, true));

    console.log("membersContract.methods.addMerchant: " + accountMerchantAddress)
    await sendTx(membersContract.methods.addMerchant(accountMerchantAddress, true));

    ////////////////////////////////////////////////////////////

    let custodianBtcDepositAddress = "1JPhiNBhZzBgWwjG6zaDchmXZyTyUN5Qny";
    console.log("factoryContract.methods.setCustodianBtcDepositAddress: " + accountMerchantAddress + ", " + custodianBtcDepositAddress);
    await sendTx(factoryContract.methods.setCustodianBtcDepositAddress(accountMerchantAddress, custodianBtcDepositAddress));

    let merchantBtcDepositAddress = "1E57B5SCkGVhFxDugko3quHxamPgkS8NxJ";
    console.log("factoryContract.methods.setCustodianBtcDepositAddress: " + accountMerchantAddress + ", " + merchantBtcDepositAddress);
    await sendTx(factoryContract.methods.setMerchantBtcDepositAddress(accountMerchantAddress, merchantBtcDepositAddress));

    ////////////////////////////////////////////////////////////
    console.log("controllerContract.methods.transferOwnership: " + accountMultiSigAddress)
    await sendTx(controllerContract.methods.transferOwnership(accountMultiSigAddress));

    console.log("membersContract.methods.transferOwnership: " + accountMultiSigAddress)
    await sendTx(membersContract.methods.transferOwnership(accountMultiSigAddress));

    // need to claim ownership from "multisig" afterwards...

    ////////////////////////////////////////////////////////////

    console.log("last nonce is", nonce);
}

function sleep(ms){
    return new Promise(resolve=>{
        setTimeout(resolve,ms)
    })
}

async function waitForEth() {
    while(true) {
        const balance = await web3.eth.getBalance(sender);
        console.log("waiting for balance to account " + sender);
        if(balance.toString() !== "0") {
            console.log("received " + balance.toString() + " wei");
            return;
        }
        else await sleep(10000)
    }
}

main();
