module.exports.deploy = async function(inputFile, feeLimit, energyLimit, userFeePercentage, rpcUrl, dontSendTx, tokenName) {

  const TronWeb = require('tronweb');
  const fs = require("fs");
  const path = require('path');
  const solc = require('tron-solc')
  let tronWeb;

  let privateKey, sender;
  let privateKeyCustodian, accountCustodianAddress;
  let privateKeyMerchant, accountMerchantAddress;
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

  function getKeyAndAccounts() {
    let content = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
    privateKey = content["privateKey"]
    privateKeyCustodian = content["privateKeyCustodian"]
    privateKeyMerchant = content["privateKeyMerchant"]
    accountMultiSigAddress = content["accountMultiSigAddress"]

    tronWeb = new TronWeb({ fullHost: rpcUrl, privateKey: privateKey });

    sender = tronWeb.address.fromPrivateKey(privateKey);

    console.log("\nfrom",sender);

    accountCustodianAddress = tronWeb.address.fromPrivateKey(privateKeyCustodian);
    console.log("accountCustodianAddress", accountCustodianAddress);

    accountMerchantAddress = tronWeb.address.fromPrivateKey(privateKeyMerchant);
    console.log("accountMerchantAddress", accountMerchantAddress);

    console.log("accountMultiSigAddress", accountMultiSigAddress);
  }

  async function deployContract(solcOutput, contractName, ctorArgs) {
    const actualName = contractName;
    const bytecode = solcOutput.contracts[actualName].bytecode;
    const abi = solcOutput.contracts[actualName].interface;
    const name = contractName.split(':').pop();

    let contract_instance = await tronWeb.contract().new({
      abi: abi,
      bytecode:bytecode,
      feeLimit: feeLimit,
      callValue:0,
      userFeePercentage: userFeePercentage,
      originEnergyLimit: energyLimit,
      name: name,
      parameters: ctorArgs
    });

    let address = tronWeb.address.fromHex(contract_instance.address);

    return [address, contract_instance];
  }


  async function main() {

    getKeyAndAccounts();

    console.log("\nStarting compilation");

    let input = {
      language: "Solidity",
      sources: compilationInput,
    };
    const output = await solc.compile(input, 1, findImports);

    console.log("Finished compilation");

    /////////////////////////////////////////////////////////////
    console.log("\nStarting deployment");

    let tokenAddress, tokenContract;
    [tokenAddress, tokenContract] = await deployContract(output, tokenFileName + ":" + tokenName, []);
    console.log(`token : '${tokenAddress}',`)

    let controllerAddress, controllerContract;
    [controllerAddress, controllerContract] = await deployContract(output, "Controller.sol:Controller", [tokenAddress]);
    console.log(`controller : '${controllerAddress}',`)

    let membersAddress, membersContract;
    // set sender as owner here, can use controller in final deployment.
    [membersAddress, membersContract] = await deployContract(output, "Members.sol:Members", [sender]);
    console.log(`members : '${membersAddress}',`)

    let factoryAddress, factoryContract;
    [factoryAddress, factoryContract] = await deployContract(output, "Factory.sol:Factory", [controllerAddress]);
    console.log(`factory : '${factoryAddress}',`)

    console.log("Finished deployment\n");
    /////////////////////////////////////////////////////////////
    if (!dontSendTx){
      console.log("controllerContract.methods.setFactory: " + factoryAddress)
      let result = await controllerContract.methods.setFactory(factoryAddress).send();
      console.log('Transaction hash: ', result);

      console.log("controllerContract.methods.setMembers: " + membersAddress)
      result = await controllerContract.methods.setMembers(membersAddress).send();
      console.log('Transaction hash: ', result);
      ////////////////////////////////////////////////////////////

      console.log("tokenContract.methods.transferOwnership: " + controllerAddress)
      result = await tokenContract.methods.transferOwnership(controllerAddress).send();
      console.log('Transaction hash: ', result);


      console.log("controllerContract.methods.callClaimOwnership: " + tokenAddress)
      result = await controllerContract.methods.callClaimOwnership(tokenAddress).send();
      console.log('Transaction hash: ', result);
      ////////////////////////////////////////////////////////////

      console.log("membersContract.methods.setCustodian: " + accountCustodianAddress)
      result = await membersContract.methods.setCustodian(accountCustodianAddress).send();
      console.log('Transaction hash: ', result);

      console.log("membersContract.methods.addMerchant: " + accountMerchantAddress)
      result = await membersContract.methods.addMerchant(accountMerchantAddress).send();
      console.log('Transaction hash: ', result);

      ////////////////////////////////////////////////////////////

      console.log("controllerContract.methods.transferOwnership: " + accountMultiSigAddress)
      result = await controllerContract.methods.transferOwnership(accountMultiSigAddress).send();
      console.log('Transaction hash: ', result);

      console.log("membersContract.methods.transferOwnership: " + accountMultiSigAddress)
      result = await membersContract.methods.transferOwnership(accountMultiSigAddress).send();
      console.log('Transaction hash: ', result);

      ////////////////////////////////////////////////////////////

    }
  }

  await main();
};

if (process.argv.length < 6) {
  console.log("usage: node deployerImplementation.js <tokenName>");
}
