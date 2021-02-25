const deployer = require("../deployerImplementation.js");

require("chai")
    .use(require("chai-as-promised"))
    .should()


describe('Deployer', async () => {

    it("test WBTC deployer script on Shasta network", async () => {
        await deployer.deploy("deployerInputTestrpc.json", 1000000000,  10000000, 30, 'https://api.shasta.trongrid.io', true, "WBTC");

    });
    it("test WETH deployer script on Shasta network", async () => {
        await deployer.deploy("deployerInputTestrpc.json", 1000000000,  10000000, 30, 'https://api.shasta.trongrid.io', true, "WETH");

    });

});
