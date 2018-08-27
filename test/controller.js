let WBTC = artifacts.require("./token/WBTC.sol")
let Members = artifacts.require("./factory/Members.sol")
let Controller = artifacts.require("./controller/Controller.sol") 
let Factory = artifacts.require("./factory/Factory.sol")

const REQUEST_FROM_FIELD                = 0
const REQUEST_AMOUNT_FIELD              = 1
const REQUEST_BTCDEPOSITADDRESS_FIELD   = 2
const REQUEST_BTCTXID_FIELD             = 3
const REQUEST_NONCE_FIELD               = 4
const REQUEST_TIMESTAMP_FIELD           = 5
const REQUEST_STATUS_FIELD              = 6
const REQUEST_HASH_FIELD                = 7

const REQUEST_STATUS_PENDING            = "pending"
const REQUEST_STATUS_CANCELED           = "canceled"
const REQUEST_STATUS_APPROVED           = "approved"
const REQUEST_STATUS_REJECTED           = "rejeted"

contract('Controller', function(accounts) {
    it("should test the controller.", async function () {
        admin = accounts[0];

        let token = await WBTC.new();
        let controller = await Controller.new(token.address);
        let factory = await Factory.new(controller.address);
        let members = await Members.new();

        await controller.setFactory(factory.address)
        await controller.setMembers(members.address)

        await token.transferOwnership(controller.address)
        // can transfer ownership for factory or members, but will be good only for pulling out funds

        await controller.callClaimOwnership(token.address)

        let custodian = accounts[1];
        let merchant1 = accounts[2];
        let merchant2 = accounts[3];

        await members.addCustodian(custodian);
        await members.addMerchant(merchant1);
        await members.addMerchant(merchant2);

        let custodianBtcDepositAdress = "1KFHE7w8BhaENAswwryaoccDb6qcT6DbYY"
        await factory.setCustodianBtcDepositAddress(merchant1, custodianBtcDepositAdress, {from:custodian});

        ///////////// add mint request ////////////
        let mintAmount = 123456;
        let mintBtcTxid= "f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16"
        let btcDepositAdress = await factory.custodianBtcDepositAddress(merchant1)
        await factory.addMintRequest(mintAmount, mintBtcTxid, btcDepositAdress, {from:merchant1});

        ///////////// confirm mint request ////////////
        let mintRequest0 = await factory.getMintRequest(0);
        let mintRequest0Hash = mintRequest0[REQUEST_HASH_FIELD];
        let mintRequest0State = mintRequest0[REQUEST_STATUS_FIELD];

        assert.equal(mintRequest0State, REQUEST_STATUS_PENDING, "bad status for request");

        await factory.confirmMintRequest(mintRequest0Hash, {from:custodian});

        balance = await token.balanceOf(merchant1);
        assert.equal(balance, mintAmount, "bad balance after minting");

        mintRequest0 = await factory.getMintRequest(0);
        mintRequest0State = mintRequest0[REQUEST_STATUS_FIELD];
        assert.equal(mintRequest0State, REQUEST_STATUS_APPROVED, "bad status for request");

        ///////////// burn ////////////
        let burnAmount = mintAmount / 3;
        await token.approve(factory.address, burnAmount, {from:merchant1});

        await factory.burn(burnAmount, {from:merchant1});
        balance = await token.balanceOf(merchant1);
        assert.equal(balance, mintAmount - burnAmount, "bad balance after burning");

        ///////////// confirm burn request ////////////
        let burnRequest0 = await factory.getBurnRequest(0);
        let burnRequest0Hash = burnRequest0[REQUEST_HASH_FIELD];
        let burnRequest0State = burnRequest0[REQUEST_STATUS_FIELD];

        assert.equal(burnRequest0State, REQUEST_STATUS_PENDING, "bad status for request");

        let burnBtcTxid= "a3183ac596303b9d638783ca57adab3c75c605a6356abc91338530b9831e9b16"
        await factory.confirmBurnRequest(burnRequest0Hash, burnBtcTxid, {from:custodian});

        burnRequest0 = await factory.getBurnRequest(0);
        burnRequest0State = burnRequest0[REQUEST_STATUS_FIELD];
        assert.equal(burnRequest0State, REQUEST_STATUS_APPROVED, "bad status for request");

        ///////////////////////
        //TODO: check also cancel, reject, multiple requests
    });
});
