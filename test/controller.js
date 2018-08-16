let TokenImp = artifacts.require("./token/TokenImp.sol")
let Token = artifacts.require("./token/Token.sol")
let Members = artifacts.require("./factory/Members.sol")
let Controller = artifacts.require("./controller/Controller.sol") 
let Factory = artifacts.require("./factory/Factory.sol")

contract('Controller', function(accounts) {
    it("should test the controller.", async function () {
        admin = accounts[0];

        let tokenImp = await TokenImp.new();
        let token = await Token.new(tokenImp.address);
        let controller = await Controller.new(token.address);
        let factory = await Factory.new(controller.address);
        let members = await Members.new();

        await controller.setFactory(factory.address)
        await controller.setMembers(members.address)

        await tokenImp.transferOwnership(controller.address)
        await token.transferOwnership(controller.address)
        // can transfer ownership for factory or members, but will be good only for pulling out funds

        await controller.callClaimOwnership(tokenImp.address)
        await controller.callClaimOwnership(token.address)

        let custodian = accounts[1];
        let merchant1 = accounts[2];
        let merchant2 = accounts[3];

        await members.addCustodian(custodian, true);
        await members.addMerchant(merchant1, true);
        await members.addMerchant(merchant2, true);

        let custodianBtcDepositAdress = "1KFHE7w8BhaENAswwryaoccDb6qcT6DbYY"
        await factory.setCustodianBtcDepositAddress(merchant1, custodianBtcDepositAdress, {from:custodian});

        ///////////// mint ////////////
        let mintAmount = 123456;
        let btcTxid= "f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16"
        let btcDepositAdress = await factory.custodianBtcDepositAddress(merchant1)
        await factory.addMintRequest(mintAmount, btcTxid, btcDepositAdress, {from:merchant1});

        let request0 = await factory.getMintRequest(0);
        let request0Hash = request0[6];
        await factory.confirmMintRequest(0, request0Hash, {from:custodian});

        balance = await token.balanceOf(merchant1);
        assert.equal(balance, mintAmount, "bad balance after minting");

        ///////////// burn ////////////
        /*
        let burnAmount = mintAmount / 3;
        await token.transfer(factory.address, burnAmount, {from:merchant1});
        
        await token.burn(burnAmount, {from:merchant1})
        balance = await token.balanceOf(merchant1);
        assert.equal(balance, mintAmount - burnAmount, "bad balance after burning");
        */
    });
});
