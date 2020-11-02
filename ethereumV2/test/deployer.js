const BigNumber = web3.BigNumber

const deployer = require("../deployerImplementation.js");

require("chai")
    .use(require("chai-as-promised"))
    .use(require('chai-bignumber')(BigNumber))
    .should()

contract('Deployer', function(accounts) {

    it("test WBTC deployer script on private net.", async function () {
        await deployer.deploy("deployerInputTestrpc.json", 20, web3.currentProvider.host, false, "WBTC");
    });

    it("test WXRP deployer script on private net.", async function () {
        await deployer.deploy("deployerInputTestrpc.json", 20, web3.currentProvider.host, false, "WXRP");
    });
});
