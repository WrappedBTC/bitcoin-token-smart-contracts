let TokenImp = artifacts.require("./token/TokenImp.sol")
let Token = artifacts.require("./token/Token.sol")
let Members = artifacts.require("./factory/Members.sol")
let Controller = artifacts.require("./controller/Controller.sol")

contract('Controller', function(accounts) {
    it("should test the controller.", async function () {
        admin = accounts[0];

        let tokenImp = await TokenImp.new();
        let token = await Token.new(tokenImp.address);
        let members = await Members.new();
        let minter = admin; //TODO: change when minter logic exists.
        let burner = admin; //TODO: change when burner logic exists.

        let controller = await Controller.new(token.address, members.address, minter, burner);
        await tokenImp.transferOwnership(controller.address)
        await token.transferOwnership(controller.address)
        await controller.callClaimOwnership(tokenImp.address)
        await controller.callClaimOwnership(token.address)

        let to = admin;
        let amount = 123456;
        let btcTxid = 0;
        let tx = await controller.mint(to, amount);

        balance = await tokenImp.balanceOf(admin);
        assert.equal(balance, amount, "bad balance after minting");

        let value = amount / 3;
        let btcDestAddress = 0;
        await tokenImp.transfer(controller.address, value, {from:admin});
        tx = await controller.burn(value)
        balance = await tokenImp.balanceOf(admin);
        assert.equal(balance, amount - value, "bad balance after burning");

    });
});
