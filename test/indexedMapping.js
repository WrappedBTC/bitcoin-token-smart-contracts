let IndexedMapping = artifacts.require("./utils/IndexedMapping.sol")

contract('IndexedMapping', function(accounts) {
    it("should test the index mapping data structure.", async function () {
        admin = accounts[0];

        let indexedMapping = await IndexedMapping.new();

        //let v0 = await indexedMapping.getValue(0)
        //console.log(v0)
        await indexedMapping.add(accounts[0])
        await indexedMapping.add(accounts[1])
        await indexedMapping.add(accounts[2])
        v0 = await indexedMapping.getValue(0)
        console.log(v0)
        v1 = await indexedMapping.getValue(1)
        console.log(v1)
        v2 = await indexedMapping.getValue(2)
        console.log(v2)
        await indexedMapping.remove(accounts[1])
        v0 = await indexedMapping.getValue(0)
        console.log(v0)
        v1 = await indexedMapping.getValue(1)
        console.log(v1)

        
/*
        let token = await Token.new(tokenImp.address);
        let controller = await Controller.new(token.address);
        let factory = await Factory.new(controller.address);
        let members = await Members.new();

        await controller.setFactory(factory.address)
        await controller.setMembers(members.address)

        await tokenImp.transferOwnership(controller.address)
        await token.transferOwnership(controller.address)
        // can transfer ownership for factory or memebers, but will be good only for pulling out funds

        await controller.callClaimOwnership(tokenImp.address)
        await controller.callClaimOwnership(token.address)

        let custodian = admin;
        let merchant = admin;

        await members.addCustodian(custodian, true);
*/
/*
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
         */

    });
});
