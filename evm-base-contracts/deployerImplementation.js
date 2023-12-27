module.exports.deploy = async function (inputFile, gasPriceGwei, rpcUrl, dontSendTx, tokenName, skipAddMembers = false) {

    const Web3 = require("web3");
    const fs = require("fs");
    const path = require('path');
    const RLP = require('rlp');
    const BigNumber = require('bignumber.js')
    const solc = require('solc')

    const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
    const gasPrice = BigNumber(gasPriceGwei).times(10 ** 9);
    const signedTxs = [];
    let chainId;

    let nonce;
    let privateKey, account, sender;
    let privateKeyCustodian, accountCustodian, accountCustodianAddress;
    let privateKeyMerchant, accountMerchant, accountMerchantAddress;
    let accountMultiSigAddress;

    const controllerContractPath = path.join(__dirname, "./contracts/controller/");
    const factoryContractPath = path.join(__dirname, "./contracts/factory/");
    const tokenContractPath = path.join(__dirname, "./contracts/token/");
    const utilsContractPath = path.join(__dirname, "./contracts/utils/");
    const tokenFileName = tokenName + '.sol';

    const compilationInput = {
        "OwnableContract.sol" : fs.readFileSync(utilsContractPath + 'OwnableContract.sol', 'utf8'),
        "OwnableContractOwner.sol" : fs.readFileSync(utilsContractPath + 'OwnableContractOwner.sol', 'utf8'),
        "IndexedMapping.sol" : fs.readFileSync(utilsContractPath + 'IndexedMapping.sol', 'utf8'),
        "Controller.sol" : fs.readFileSync(controllerContractPath + 'Controller.sol', 'utf8'),
        "ControllerInterface.sol" : fs.readFileSync(controllerContractPath + 'ControllerInterface.sol', 'utf8'),
        "Factory.sol" : fs.readFileSync(factoryContractPath + 'Factory.sol', 'utf8'),
        "Members.sol" : fs.readFileSync(factoryContractPath + 'Members.sol', 'utf8'),
        "MembersInterface.sol" : fs.readFileSync(factoryContractPath + 'MembersInterface.sol', 'utf8'),
        [tokenFileName] : fs.readFileSync(tokenContractPath + tokenFileName, 'utf8')
    };

    function findImports (_path) {
        if(_path.includes("openzeppelin-solidity"))
            return { contents: fs.readFileSync("node_modules/" + _path, 'utf8') }
        else
            return { contents: fs.readFileSync(path.join(__dirname, "./contracts/", _path), 'utf8') }
    }

    function sleep(ms){
        return new Promise(resolve=>{
            setTimeout(resolve,ms)
        })
    }

    function getKeyAndAccounts() {

        let content = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
        privateKey = content["privateKey"]
        privateKeyCustodian = content["privateKeyCustodian"]
        privateKeyMerchant = content["privateKeyMerchant"]
        accountMultiSigAddress = content["accountMultiSigAddress"]

        account = web3.eth.accounts.privateKeyToAccount(privateKey);
        sender = account.address;
        console.log("from",sender);

        accountCustodian = web3.eth.accounts.privateKeyToAccount(privateKeyCustodian);
        accountCustodianAddress = accountCustodian.address;
        console.log("accountCustodianAddress", accountCustodianAddress);

        accountMerchant = web3.eth.accounts.privateKeyToAccount(privateKeyMerchant);
        accountMerchantAddress = accountMerchant.address;
        console.log("accountMerchantAddress", accountMerchantAddress);

        console.log("accountMultiSigAddress", accountMultiSigAddress);
    }

    async function sendTx(txObject, fromAccount) {
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
        const txFrom = fromAccount.address;
        const txKey = fromAccount.privateKey;

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
            web3.eth.sendSignedTransaction(signedTx.rawTransaction, {from:fromAccount.address});
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

        await sendTx(deploy, account);

        myContract.options.address = address;

        return [address, myContract];
    }

    async function waitForEth(address) {
        while(true) {
            const balance = await web3.eth.getBalance(address);
            console.log("waiting for balance to account " + address);
            if(balance.toString() !== "0") {
                console.log("received " + balance.toString() + " wei");
                return;
            }
            else await sleep(10000)
        }
    }

    async function fundTestRpcAccounts() {
        const accounts = await web3.eth.getAccounts();
        const amount = BigNumber(1).times(10 ** 18) // 1 eth
        await web3.eth.sendTransaction({to: sender, from: accounts[0], value: amount});
        await web3.eth.sendTransaction({to: accountCustodianAddress, from: accounts[0], value: amount});
        await web3.eth.sendTransaction({to: accountMerchantAddress, from: accounts[0], value: amount});
    }

    async function main() {

        getKeyAndAccounts();

        /////////////////////////////////////////////////////////////
        networkType = await web3.eth.net.getNetworkType();
        if (networkType == "private") {
            fundTestRpcAccounts();
        }

        /////////////////////////////////////////////////////////////

        nonce = await web3.eth.getTransactionCount(sender);
        console.log("nonce",nonce);

        chainId = await web3.eth.net.getId()
        console.log('chainId', chainId);

        console.log("starting compilation");
        const output = await solc.compile({ sources: compilationInput }, 1, findImports);
        console.log(output.errors);
        console.log("finished compilation");

        if (!dontSendTx) {
            await waitForEth(sender);
            await waitForEth(accountCustodianAddress);
            await waitForEth(accountMerchantAddress);
        }

        /////////////////////////////////////////////////////////////

        let tokenAddress, tokenContract;
        [tokenAddress, tokenContract] = await deployContract(output, tokenFileName + ":" + tokenName, []);
        console.log("tokenAddress: " + tokenAddress);

        let controllerAddress, controllerContract;
        [controllerAddress, controllerContract] = await deployContract(output, "Controller.sol:Controller", [tokenAddress]);
        console.log("controllerAddress: " + controllerAddress)

        let membersAddress, membersContract;
        // set sender as owner here, can use controller in final deployment.
        [membersAddress, membersContract] = await deployContract(output, "Members.sol:Members", [sender]);
        console.log("membersAddress: " + membersAddress)

        let factoryAddress, factoryContract;
        [factoryAddress, factoryContract] = await deployContract(output, "Factory.sol:Factory", [controllerAddress]);
        console.log("factoryAddress: " + factoryAddress)

        ////////////////////////////////////////////////////////////

        console.log("controllerContract.methods.setFactory: " + factoryAddress)
        await sendTx(controllerContract.methods.setFactory(factoryAddress), account);

        console.log("controllerContract.methods.setMembers: " + membersAddress)
        await sendTx(controllerContract.methods.setMembers(membersAddress), account);

        ////////////////////////////////////////////////////////////

        console.log("tokenContract.methods.transferOwnership: " + controllerAddress)
        await sendTx(tokenContract.methods.transferOwnership(controllerAddress), account);

        console.log("controllerContract.methods.callClaimOwnership: " + tokenAddress)
        await sendTx(controllerContract.methods.callClaimOwnership(tokenAddress), account);

        ////////////////////////////////////////////////////////////

        if (!skipAddMembers) {
          console.log(
            "membersContract.methods.setCustodian: " + accountCustodianAddress
          );
          await sendTx(
            membersContract.methods.setCustodian(accountCustodianAddress),
            account
          );

          console.log(
            "membersContract.methods.addMerchant: " + accountMerchantAddress
          );
          await sendTx(
            membersContract.methods.addMerchant(accountMerchantAddress),
            account
          );
        }

        ////////////////////////////////////////////////////////////

        console.log("controllerContract.methods.transferOwnership: " + accountMultiSigAddress)
        await sendTx(controllerContract.methods.transferOwnership(accountMultiSigAddress), account);

        console.log("membersContract.methods.transferOwnership: " + accountMultiSigAddress)
        await sendTx(membersContract.methods.transferOwnership(accountMultiSigAddress), account);

        ////////////////////////////////////////////////////////////

        console.log("waiting to make sure transactions were added on chain.")
        await sleep(20000)

        if (!skipAddMembers) {
          nonce = await web3.eth.getTransactionCount(accountCustodianAddress);
          console.log("accountCustodianAddress nonce: " + nonce);
          let custodianDepositAddress = "1JPhiNBhZzBgWwjG6zaDchmXZyTyUN5Qny";
          console.log(
            "factoryContract.methods.setCustodianDepositAddress: " +
              accountMerchantAddress +
              ", " +
              custodianDepositAddress
          );
          await sendTx(
            factoryContract.methods.setCustodianDepositAddress(
              accountMerchantAddress,
              custodianDepositAddress
            ),
            accountCustodian
          );

          nonce = await web3.eth.getTransactionCount(accountMerchantAddress);
          console.log("accountMerchantAddress nonce: " + nonce);
          let merchantDepositAddress = "1E57B5SCkGVhFxDugko3quHxamPgkS8NxJ";
          console.log(
            "factoryContract.methods.setMerchantDepositAddress: " +
              merchantDepositAddress
          );
          await sendTx(
            factoryContract.methods.setMerchantDepositAddress(
              merchantDepositAddress
            ),
            accountMerchant
          );
        }

        nonce = await web3.eth.getTransactionCount(sender);

        ////////////////////////////////////////////////////////////

        console.log("last nonce is", nonce);

        ////////////////////////////////////////////////////////////

        console.log("next step: multisig should claim ownership for controller and members.")
    }

    await main();
};

if (process.argv.length < 3) {
    console.log("usage: node deployerImplementation.js <tokenName>");
}
