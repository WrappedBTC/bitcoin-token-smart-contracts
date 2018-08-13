let WBTCToken = artifacts.require("./WBTCToken.sol")
let WBTCProxy = artifacts.require("./WBTCProxy.sol")
let Roles = artifacts.require("./Roles.sol")
let Main = artifacts.require("./Main.sol")

contract('Main', function(accounts) {
    it("should test Main.", async function () {
        admin = accounts[0];

        let wbtcToken = await WBTCToken.new();
        let wbtcProxy = await WBTCProxy.new(wbtcToken.address);
        let roles = await Roles.new();
        let minter = admin; //TODO: change when minter logic exists.
        let burner = admin; //TODO: change when burner logic exists.

        let main = await Main.new(wbtcToken.address, wbtcProxy.address, roles.address, minter, burner);

        await wbtcToken.transferOwnership(main.address)
        await wbtcProxy.transferOwnership(main.address)
        await main.callClaimOwnership(wbtcToken.address)
        await main.callClaimOwnership(wbtcProxy.address)

        let to = admin;
        let amount = 123456;
        let btcTxid = 0;
        let tx = await main.mint(to, amount);

        balance = await wbtcToken.balanceOf(admin);
        assert.equal(balance, amount, "bad balance after minting");

        let value = amount / 3;
        let btcDestAddress = 0;
        await wbtcToken.transfer(main.address, value, {from:admin});
        tx = await main.burn(value)
        balance = await wbtcToken.balanceOf(admin);
        assert.equal(balance, amount - value, "bad balance after burning");

    });
});
