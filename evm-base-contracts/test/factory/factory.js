const BigNumber = web3.BigNumber

const { ZEPPELIN_LOCATION } = require("../helper.js");
const { expectThrow } = require(ZEPPELIN_LOCATION + 'openzeppelin-solidity/test/helpers/expectThrow');

require("chai")
    .use(require("chai-as-promised"))
    .use(require('chai-bignumber')(BigNumber))
    .should()

const WBTC = artifacts.require("./token/WBTC.sol")
const Members = artifacts.require("./factory/Members.sol")
const Controller = artifacts.require("./controller/Controller.sol")
const Factory = artifacts.require("./factory/Factory.sol")

const REQUEST_NONCE_FIELD               = 0
const REQUEST_REQUESTER_FIELD           = 1
const REQUEST_AMOUNT_FIELD              = 2
const REQUEST_BTC_DEPOSIT_ADDRESS_FIELD = 3
const REQUEST_BTC_TXID_FIELD            = 4
const REQUEST_TIMESTAMP_FIELD           = 5
const REQUEST_STATUS_FIELD              = 6
const REQUEST_HASH_FIELD                = 7

const REQUEST_STATUS_PENDING            = "pending"
const REQUEST_STATUS_CANCELED           = "canceled"
const REQUEST_STATUS_APPROVED           = "approved"
const REQUEST_STATUS_REJECTED           = "rejected"

contract('Factory', function(accounts) {

    const admin = accounts[0];
    const other = accounts[1];
    const custodian0 = accounts[2];
    const merchant0 = accounts[4];
    const merchant1 = accounts[5];
    const merchant2 = accounts[6];

    const custodianDepositAddressForMerchant0 = "1KFHE7w8BhaENAswwryaoccDb6qcT6DbYY" 
    const custodianDepositAddressForMerchant1 = "1CK6KHY6MHgYvmRQ4PAafKYDrg1ejbH1cE"
    const custodianDepositAddressForMerchant2 = "1LCgURAohwmQas667XmMT8VeEdPSu9ThpC"
    const merchant0DepositAddress = "33186S4aTEmv67cAygmzL9CWzoMNV7RNCn"
    const merchant1DepositAddress = "3CRCW2DLqBa336QPhJK3SvLVRCueckcJ1f "
    const otherAddress = "15kiNKfDWsq7UsPg87UwxA8rVvWAjzRkYS"

    const txid0 = "955c0816db69040dddf858c599c5e5ea915f193b65fde641021a297cce754a25"
    const txid1 = "5ad004d3cae3204048ceb2b119b060a5e8cf07b94e39d92a79386677106312ed"
    const txid2 = "a2f2bd19f2d294eec53e0421069c82b949253260c2cadf54eb1f823856923799"

    beforeEach('create contracts', async function () {
        wbtc = await WBTC.new();
        controller = await Controller.new(wbtc.address);
        members = await Members.new(admin);
        factory = await Factory.new(controller.address);

        await controller.setFactory(factory.address)
        await controller.setMembers(members.address)

        await wbtc.transferOwnership(controller.address)
        await controller.callClaimOwnership(wbtc.address)

        await members.setCustodian(custodian0);
        await members.addMerchant(merchant0);
        await members.addMerchant(merchant1);
        await members.addMerchant(merchant2); // this merchant does not set btc deposit address

        await factory.setMerchantDepositAddress(merchant0DepositAddress, {from: merchant0});
        await factory.setMerchantDepositAddress(merchant1DepositAddress, {from: merchant1});
        
        await factory.setCustodianDepositAddress(merchant0, custodianDepositAddressForMerchant0, {from: custodian0});
        await factory.setCustodianDepositAddress(merchant1, custodianDepositAddressForMerchant1, {from: custodian0});
        await factory.setCustodianDepositAddress(merchant2, custodianDepositAddressForMerchant2, {from: custodian0});

    });

    describe('as merchant', function () {
        const from = merchant0;
        const amount = 100;

        it("check setMerchantDepositAddress", async function () {
            await factory.setMerchantDepositAddress(merchant0DepositAddress, {from});
            const merchantDepositAddress = await factory.merchantDepositAddress(merchant0);
            assert.equal(merchantDepositAddress, merchant0DepositAddress);
        });

        it("setMerchantDepositAddress with empty string reverts", async function () {
            await expectThrow(factory.setMerchantDepositAddress("", {from}));
        });

        it("setMerchantDepositAddress emits event", async function () {
            const { logs } = await factory.setMerchantDepositAddress(merchant0DepositAddress, {from});
            assert.equal(logs.length, 1);
            assert.equal(logs[0].event, 'MerchantDepositAddressSet');
            assert.equal(logs[0].args.merchant, merchant0);
            assert.equal(logs[0].args.depositAddress, merchant0DepositAddress);
        });

        it("addMintRequest", async function () {
            const balanceBefore = await wbtc.balanceOf(merchant0)
            assert.equal(balanceBefore, 0);

            const { logs } = await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from});
            const timestamp = logs[0].args.timestamp;
            const hash = logs[0].args.requestHash;

            const request = await factory.getMintRequest(0);
            assert.equal(request[REQUEST_NONCE_FIELD], 0)
            assert.equal(request[REQUEST_REQUESTER_FIELD], merchant0)
            assert.equal(request[REQUEST_AMOUNT_FIELD], amount)
            assert.equal(request[REQUEST_BTC_DEPOSIT_ADDRESS_FIELD], custodianDepositAddressForMerchant0)
            assert.equal(request[REQUEST_BTC_TXID_FIELD], txid0)
            assert.equal((request[REQUEST_TIMESTAMP_FIELD]).valueOf(), timestamp.valueOf())
            assert.equal(request[REQUEST_STATUS_FIELD], REQUEST_STATUS_PENDING)
            assert.equal(request[REQUEST_HASH_FIELD], hash)

            // verify balance is still 0 (actual mint is not done yet)
            const balanceAfter = await wbtc.balanceOf(merchant0)
            assert.equal(balanceAfter, 0);
        });

        it("addMintRequest with empty btcDepositAdress fails", async function () {
            await expectThrow(factory.addMintRequest(amount, txid0, "", {from}));
        });

        it("addMintRequest with non existing btcDepositAdress fails", async function () {
            await expectThrow(factory.addMintRequest(amount, txid0, otherAddress, {from}));
        });

        it("addMintRequest with other merchant's custodian btcDepositAdress fails", async function () {
            await expectThrow(factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant1, {from}));
        });

        it("addMintRequest sets request status to pending", async function () {
            const { logs } = await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from});

            const request = await factory.getMintRequest(0);
            assert.equal(request[REQUEST_STATUS_FIELD], REQUEST_STATUS_PENDING)
        });

        it("addMintRequest emits an event", async function () {
            const { logs } = await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from});
            assert.equal(logs.length, 1);
            assert.equal(logs[0].event, 'MintRequestAdd');

            assert.equal(logs[0].args.nonce, 0);
            assert.equal(logs[0].args.requester, merchant0);
            assert.equal(logs[0].args.amount, amount);
            assert.equal(logs[0].args.depositAddress, custodianDepositAddressForMerchant0);
            assert.equal(logs[0].args.txid, txid0);
            assert.notEqual(logs[0].args.timestamp, 0);
            assert.notEqual(logs[0].args.requestHash, 0);
        });

        it("add several mint requests and see nonce is incremented", async function () {
            await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from});
            await factory.addMintRequest(amount, txid1, custodianDepositAddressForMerchant0, {from});
            const { logs } = await factory.addMintRequest(amount, txid2, custodianDepositAddressForMerchant0, {from});

            assert.equal(logs[0].args.nonce, 2);
            const request = await factory.getMintRequest(2);
            assert.equal(request[REQUEST_NONCE_FIELD], 2)
            assert.equal(request[REQUEST_BTC_TXID_FIELD], txid2)
        });

        it("cancelMintRequest", async function () {
            const { logs } = await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from});
            const hash = logs[0].args.requestHash;

            await factory.cancelMintRequest(hash, {from});
            const request = await factory.getMintRequest(0);
            assert.equal(request[REQUEST_STATUS_FIELD], REQUEST_STATUS_CANCELED)
        });

        it("cancelMintRequest for 0 request hash fails", async function () {
            await expectThrow(factory.cancelMintRequest(0, {from}), "request hash is 0");
        });

        it("cancelMintRequest for already canceled request fails", async function () {
            const { logs } = await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from});
            const hash = logs[0].args.requestHash;
            await factory.cancelMintRequest(hash, {from});
            await expectThrow (factory.cancelMintRequest(hash, {from}));
        });

        it("cancelMintRequest for already confirmed request fails", async function () {
            const { logs } = await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from});
            const hash = logs[0].args.requestHash;
            await factory.confirmMintRequest(hash, {from: custodian0});
            await expectThrow(factory.cancelMintRequest(hash, {from}));
        });

        it("cancelMintRequest for already rejected request fails", async function () {
            const { logs } = await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from});
            const hash = logs[0].args.requestHash;
            await factory.rejectMintRequest(hash, {from: custodian0});
            await expectThrow(factory.cancelMintRequest(hash, {from}));

        });

        it("cancelMintRequest for another merchant's request fails", async function () {
            const { logs } = await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant1, {from: merchant1});
            const hash = logs[0].args.requestHash;
            await expectThrow(factory.cancelMintRequest(hash, {from}));
        });

        it("cancelMintRequest with unknown request hash fails", async function () {
            const { logs } = await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from});

            const hash = logs[0].args.requestHash;
            const alteredHash = "0x0123456789012345678901234567890123456789012345678901234567890123456789012345"

            await expectThrow(factory.cancelMintRequest(alteredHash, {from}));
            await factory.cancelMintRequest(hash, {from})
        });

        it("cancelMintRequest changes request status to canceled", async function () {
            const {logs} = await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from});
            const hash = logs[0].args.requestHash;
            await factory.cancelMintRequest(hash, {from})

            const request = await factory.getMintRequest(0);
            assert.equal(request[REQUEST_STATUS_FIELD], REQUEST_STATUS_CANCELED)
        });

        it("cancelMintRequeste does not change request hash", async function () {
            const { logs } = await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from});
            const hash = logs[0].args.requestHash;
            await factory.cancelMintRequest(hash, {from})

            const request = await factory.getMintRequest(0);
            assert.equal(request[REQUEST_HASH_FIELD], hash)
        });

        it("cancelMintRequest emits an event", async function () {
            const { logs } = await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from});
            const hash = logs[0].args.requestHash;
            const tx = await factory.cancelMintRequest(hash, {from});

            const cancelLogs = tx["logs"]
            assert.equal(cancelLogs.length, 1);
            assert.equal(cancelLogs[0].event, 'MintRequestCancel');

            assert.equal(cancelLogs[0].args.nonce, 0);
            assert.equal(cancelLogs[0].args.requester, merchant0);
            assert.equal(cancelLogs[0].args.requestHash, hash);
        });

        it("burn", async function () {
            const { logs } = await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from});
            await factory.confirmMintRequest(logs[0].args.requestHash, {from: custodian0})

            const balanceBefore = await wbtc.balanceOf(merchant0);
            assert.equal(balanceBefore, amount);

            await wbtc.approve(factory.address, amount, {from});
            await factory.burn(amount, {from});

            const balanceAfter = await wbtc.balanceOf(merchant0)
            assert.equal(balanceAfter, 0);
        });

        it("burn without setting merchant btcDepositAdress beforehand fails", async function () {
            const { logs } = await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant2, {from: merchant2});
            await factory.confirmMintRequest(logs[0].args.requestHash, {from: custodian0});

            const balanceBefore = await wbtc.balanceOf(merchant2)
            assert.equal(balanceBefore, amount);

            await wbtc.approve(factory.address, amount, {from: merchant2});
            await expectThrow(factory.burn(amount, {from: merchant2}), "merchant asset deposit address was not set");

            await factory.setMerchantDepositAddress(merchant0DepositAddress, {from: merchant2});
            await factory.burn(amount, {from: merchant2})

            const balanceAfter = await wbtc.balanceOf(merchant2)
            assert.equal(balanceAfter, 0);
        });

        it("burn without allowance fails", async function () {
            const { logs } = await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from: merchant0});
            await factory.confirmMintRequest(logs[0].args.requestHash, {from: custodian0});

            await expectThrow(factory.burn(amount, {from: merchant0}));
        });

        it("burn without being the configured factory in controller fails", async function () {
            const { logs } = await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from: merchant0});
            await factory.confirmMintRequest(logs[0].args.requestHash, {from: custodian0})
            await wbtc.approve(factory.address, amount, {from: merchant0});
            await controller.setFactory(other);
            await expectThrow(
                    factory.burn(amount, {from: merchant0}),
                    "sender not authorized for minting or burning"
            );
        });

        it("burn sets request status to pending", async function () {
            const { logs } = await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from});
            await factory.confirmMintRequest(logs[0].args.requestHash, {from: custodian0})
            await wbtc.approve(factory.address, amount, {from});
            await factory.burn(amount, {from});

            const request = await factory.getBurnRequest(0);
            assert.equal(request[REQUEST_STATUS_FIELD], REQUEST_STATUS_PENDING);
        });

        it("burn emits an event", async function () {
            const addTx = await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from});
            await factory.confirmMintRequest(addTx.logs[0].args.requestHash, {from: custodian0})
            await wbtc.approve(factory.address, amount, {from});
            const { logs } = await factory.burn(amount, {from});

            assert.equal(logs.length, 1);
            assert.equal(logs[0].event, 'Burned');

            assert.equal(logs[0].args.nonce, 0);
            assert.equal(logs[0].args.requester, merchant0);
            assert.equal(logs[0].args.amount, amount);
            assert.equal(logs[0].args.depositAddress, merchant0DepositAddress);
            assert.equal(logs[0].args.txid, null); // txid of burn is sent only upon confirmation.
            assert.notEqual(logs[0].args.timestamp, 0);
            assert.notEqual(logs[0].args.requestHash, 0);
        });
    });

    describe('as non merchant', function () {
        const from = other;
        const amount = 100;

        it("setMerchantDepositAddress reverts", async function () {
            await expectThrow(
                factory.setMerchantDepositAddress(merchant0DepositAddress, {from}),
                "sender not a merchant"
            );
        });
        
        it("addMintRequest reverts", async function () {
            await expectThrow(
                factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from}),
                "sender not a merchant"
            );
        });

        it("cancelMintRequest reverts", async function () {
            await expectThrow(
                factory.cancelMintRequest("0xab", {from}),
                "sender not a merchant"
            );
        });

        it("burn reverts", async function () {
            await expectThrow(
                factory.burn(amount, {from}),
                "sender not a merchant"
            );
        });
    });

    describe('as custodian', function () {
        const from = custodian0;
        const amount = 100;

        it("setCustodianDepositAddress", async function () {
            await factory.setCustodianDepositAddress(merchant0, custodianDepositAddressForMerchant0, {from});
            const custodianDepositAddress = await factory.custodianDepositAddress(merchant0);
            assert.equal(custodianDepositAddress, custodianDepositAddressForMerchant0);
        });

        it("setCustodianDepositAddress with 0 merchant address fails", async function () {
            await expectThrow(factory.setCustodianDepositAddress(0, custodianDepositAddressForMerchant0, {from}), "invalid merchant address");
        });

        it("setCustodianDepositAddress with faulty merchant address fails", async function () {
            await expectThrow(factory.setCustodianDepositAddress(other, custodianDepositAddressForMerchant0, {from}), "merchant address is not a real merchant.");
        });

        it("setCustodianDepositAddress with empty string reverts", async function () {
            await expectThrow(
                factory.setCustodianDepositAddress(merchant0, "", {from}),
                "invalid asset deposit address"
            )
        });

        it("setCustodianDepositAddress emits event", async function () {
            const { logs } = await factory.setCustodianDepositAddress(merchant0, custodianDepositAddressForMerchant0, {from});
            assert.equal(logs.length, 1);
            assert.equal(logs[0].event, 'CustodianDepositAddressSet');
            assert.equal(logs[0].args.merchant, merchant0);
            assert.equal(logs[0].args.depositAddress, custodianDepositAddressForMerchant0);
            assert.equal(logs[0].args.sender, custodian0);
        });

        it("confirmMintRequest", async function () {
            const tx = await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from: merchant0});

            const balanceBefore = await wbtc.balanceOf(merchant0)
            assert.equal(balanceBefore, 0);

            await factory.confirmMintRequest(tx.logs[0].args.requestHash, {from});

            const balanceAfter = await wbtc.balanceOf(merchant0)
            assert.equal(balanceAfter, amount);
        });
        
        it("confirmMintRequest with non exsting request hash", async function () {
            const tx = await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from: merchant0});
            await expectThrow(
                    factory.confirmMintRequest("hash", {from}),
                    "given request hash does not match a pending request"
            );
        });

        it("confirmMintRequest of cancled request fails", async function () {
            const tx = await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from: merchant0});
            await factory.cancelMintRequest(tx.logs[0].args.requestHash, {from: merchant0});
            await expectThrow(
                    factory.confirmMintRequest(tx.logs[0].args.requestHash, {from}),
                    "request is not pending"
            );
        });

        it("confirmMintRequest of rejected request fails", async function () {
            const tx = await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from: merchant0});
            await factory.rejectMintRequest(tx.logs[0].args.requestHash, {from: custodian0});
            await expectThrow(
                    factory.confirmMintRequest(tx.logs[0].args.requestHash, {from}),
                    "request is not pending"
            );
        });

        it("confirmMintRequest without being the configured factory in controller fails", async function () {
            await controller.setFactory(other);
            const tx = await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from: merchant0});
            await expectThrow(
                    factory.confirmMintRequest(tx.logs[0].args.requestHash, {from}),
                    "sender not authorized for minting or burning"
            );
        });

        it("confirmMintRequest of request in the middle of the list (not last)", async function () {
            const tx0 = await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from: merchant0});
            const tx1 = await factory.addMintRequest(amount, txid1, custodianDepositAddressForMerchant0, {from: merchant0});
            const tx2 =await factory.addMintRequest(amount, txid2, custodianDepositAddressForMerchant0, {from: merchant0});

            assert.notEqual(tx0.logs[0].args.requestHash,tx1.logs[0].args.requestHash); 
            assert.notEqual(tx1.logs[0].args.requestHash,tx2.logs[0].args.requestHash);
            assert.notEqual(tx0.logs[0].args.requestHash,tx2.logs[0].args.requestHash);
            
            const balanceBefore = await wbtc.balanceOf(merchant0)
            assert.equal(balanceBefore, 0);

            await factory.confirmMintRequest(tx1.logs[0].args.requestHash, {from});

            const balanceAfter = await wbtc.balanceOf(merchant0)
            assert.equal(balanceAfter, amount);
        });

        it("confirmMintRequest does not change request hash", async function () {
            const tx = await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from: merchant0});
            const requestBefore = await factory.getMintRequest(0);
            const hashBefore = requestBefore[REQUEST_HASH_FIELD];

            await factory.confirmMintRequest(tx.logs[0].args.requestHash, {from});
            const requestAfter = await factory.getMintRequest(0);
            const hashAfter= requestAfter[REQUEST_HASH_FIELD];

            assert.equal(hashBefore, hashAfter);
        });

        it("confirmMintRequest emits an event", async function () {
            const tx = await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from: merchant0});
            const { logs } = await factory.confirmMintRequest(tx.logs[0].args.requestHash, {from});

            const requestAfter = await factory.getMintRequest(0);
            const hashAfter= requestAfter[REQUEST_HASH_FIELD];

            assert.equal(logs.length, 1);
            assert.equal(logs[0].event, 'MintConfirmed');
            assert.equal(logs[0].args.nonce, 0);
            assert.equal(logs[0].args.requester, merchant0);
            assert.equal(logs[0].args.amount, amount);
            assert.equal(logs[0].args.depositAddress, custodianDepositAddressForMerchant0);
            assert.equal(logs[0].args.txid, txid0);
            assert.notEqual(logs[0].args.timestamp, 0);
            assert.equal(logs[0].args.requestHash, hashAfter);
        });

        it("rejectMintRequest", async function () {
            const tx = await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from: merchant0});
            await factory.rejectMintRequest(tx.logs[0].args.requestHash, {from});

            const request = await factory.getMintRequest(0);
            assert.equal(request[REQUEST_STATUS_FIELD], REQUEST_STATUS_REJECTED);
        });

        it("rejectMintRequest with non exsting request hash", async function () {
            await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from: merchant0});
            await expectThrow(
                    factory.rejectMintRequest("hash", {from}),
                    "given request hash does not match a pending request"
            );
        });

        it("rejectMintRequest of approved request fails", async function () {
            const tx = await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from: merchant0});
            await factory.confirmMintRequest(tx.logs[0].args.requestHash, {from});
            await expectThrow(
                    factory.rejectMintRequest(tx.logs[0].args.requestHash, {from}),
                    "request is not pending"
            );
        });

        it("rejectMintRequest of canceled request fails", async function () {
            const tx = await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from: merchant0});
            await factory.cancelMintRequest(tx.logs[0].args.requestHash, {from: merchant0});
            await expectThrow(
                    factory.rejectMintRequest(tx.logs[0].args.requestHash, {from}),
                    "request is not pending"
            );
        });

        it("rejectMintRequest of rejected request fails", async function () {
            const tx = await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from: merchant0});
            await factory.rejectMintRequest(tx.logs[0].args.requestHash, {from});
            await expectThrow(
                    factory.rejectMintRequest(tx.logs[0].args.requestHash, {from}),
                    "request is not pending"
            );
        });

        it("rejectMintRequest does not change request hash", async function () {
            const tx = await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from: merchant0});
            const requestBefore = await factory.getMintRequest(0);
            const hashBefore = requestBefore[REQUEST_HASH_FIELD];

            await factory.rejectMintRequest(tx.logs[0].args.requestHash, {from});
            const requestAfter = await factory.getMintRequest(0);
            const hashAfter= requestAfter[REQUEST_HASH_FIELD];

            assert.equal(hashBefore, hashAfter);
        });

        it("rejectMintRequest emits an event", async function () {
            const tx = await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from: merchant0});
            const { logs } = await factory.rejectMintRequest(tx.logs[0].args.requestHash, {from});

            const requestAfter = await factory.getMintRequest(0);
            const hashAfter= requestAfter[REQUEST_HASH_FIELD];

            assert.equal(logs.length, 1);
            assert.equal(logs[0].event, 'MintRejected');
            assert.equal(logs[0].args.nonce, 0);
            assert.equal(logs[0].args.requester, merchant0);
            assert.equal(logs[0].args.amount, amount);
            assert.equal(logs[0].args.depositAddress, custodianDepositAddressForMerchant0);
            assert.equal(logs[0].args.txid, txid0);
            assert.notEqual(logs[0].args.timestamp, 0);
            assert.equal(logs[0].args.requestHash, hashAfter);
        });

        it("confirmBurnRequest", async function () {
            const { logs } = await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from: merchant0});
            await factory.confirmMintRequest(logs[0].args.requestHash, {from})
            await wbtc.approve(factory.address, amount, {from: merchant0});
            const tx = await factory.burn(amount, {from: merchant0});
            await factory.confirmBurnRequest(tx.logs[0].args.requestHash, txid0, {from});

            const request = await factory.getBurnRequest(0);
            assert.equal(request[REQUEST_STATUS_FIELD], REQUEST_STATUS_APPROVED);
        });

        it("confirmBurnRequest with 0 hash fails", async function () {
            await expectThrow(factory.confirmBurnRequest(0, txid0, {from}), "request hash is 0");
        });

        it("confirmBurnRequest with non exsting request hash", async function () {
            const { logs } = await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from: merchant0});
            await factory.confirmMintRequest(logs[0].args.requestHash, {from})
            await wbtc.approve(factory.address, amount, {from: merchant0});
            await factory.burn(amount, {from: merchant0});
            await expectThrow(
                    factory.confirmBurnRequest("hash", txid0, {from}),
                    "given request hash does not match a pending request"
            );
        });

        it("confirmBurnRequest of request in the middle of the list (not last)", async function () {
            const tx = await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from: merchant0});
            await factory.confirmMintRequest(tx.logs[0].args.requestHash, {from})

            await wbtc.approve(factory.address, amount, {from: merchant0});
            const tx0 = await factory.burn(amount / 4 , {from: merchant0});
            const tx1 = await factory.burn(amount / 4 , {from: merchant0});
            const tx2 = await factory.burn(amount / 4 , {from: merchant0});
            const tx3 = await factory.burn(amount / 4 , {from: merchant0});
            
            await factory.confirmBurnRequest(tx2.logs[0].args.requestHash, txid0, {from});

            const request0 = await factory.getBurnRequest(0);
            const request1 = await factory.getBurnRequest(1);
            const request2 = await factory.getBurnRequest(2);
            const request3 = await factory.getBurnRequest(3);
            assert.equal(request0[REQUEST_STATUS_FIELD], REQUEST_STATUS_PENDING);
            assert.equal(request1[REQUEST_STATUS_FIELD], REQUEST_STATUS_PENDING);
            assert.equal(request2[REQUEST_STATUS_FIELD], REQUEST_STATUS_APPROVED);
            assert.equal(request3[REQUEST_STATUS_FIELD], REQUEST_STATUS_PENDING);
        });

        it("confirmBurnRequest does change the request hash", async function () {
            const { logs } = await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from: merchant0});
            await factory.confirmMintRequest(logs[0].args.requestHash, {from})
            await wbtc.approve(factory.address, amount, {from: merchant0});

            await factory.burn(amount, {from: merchant0});
            const requestBefore = await factory.getBurnRequest(0);
            await factory.confirmBurnRequest(requestBefore[REQUEST_HASH_FIELD], txid0, {from})
            const requestAfter = await factory.getBurnRequest(0);
            assert.notEqual(requestBefore[REQUEST_HASH_FIELD], requestAfter[REQUEST_HASH_FIELD]);
        });

        it("confirmBurnRequest emits an event", async function () {
            const tx = await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from: merchant0});
            await factory.confirmMintRequest(tx.logs[0].args.requestHash, {from})
            await wbtc.approve(factory.address, amount, {from: merchant0});

            await factory.burn(amount, {from: merchant0});
            const request = await factory.getBurnRequest(0);
            const { logs } = await factory.confirmBurnRequest(request[REQUEST_HASH_FIELD], txid0, {from})

            assert.equal(logs.length, 1);
            assert.equal(logs[0].event, 'BurnConfirmed');
            assert.equal(logs[0].args.nonce, 0);
            assert.equal(logs[0].args.requester, merchant0);
            assert.equal(logs[0].args.amount, amount);
            assert.equal(logs[0].args.depositAddress, merchant0DepositAddress);
            assert.equal(logs[0].args.txid, txid0);
            assert.notEqual(logs[0].args.timestamp, 0);
            assert.equal(logs[0].args.inputRequestHash, request[REQUEST_HASH_FIELD]);
        });
    });

    describe('as non custodian', function () {
        const from = other;
        const amount = 100;
        
        it("setCustodianDepositAddress reverts", async function () {
            await expectThrow(
                factory.setCustodianDepositAddress(merchant0, custodianDepositAddressForMerchant0, {from: other}),
                "sender not a custodian"
            );
        });

        it("confirmMintRequest reverts", async function () {
            await expectThrow(
                factory.confirmMintRequest("hash", {from: other}),
                "sender not a custodian"
            );
        });

        it("rejectMintRequest reverts", async function () {
            await expectThrow(
                factory.rejectMintRequest("hash", {from: other}),
                "sender not a custodian"
            );
        });

        it("confirmBurnRequest reverts", async function () {
            await expectThrow(
                factory.confirmBurnRequest("hash", txid0, {from}),
                "sender not a custodian"
            );
        });
    });

    describe('as anyone', function () {
        const from = merchant0;
        const amount = 60;

        it("check creae contract with 0 controller address fails", async function () {
            await expectThrow(Factory.new(0), "invalid _controller address");
        });

        it("getMintRequestsLength", async function () {
            const lengthBefore = await factory.getMintRequestsLength();
            assert.equal(lengthBefore, 0);
            
            await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from});
            await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from});
            await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from});
            await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from});
            await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from});

            const lengthAfter = await factory.getMintRequestsLength();
            assert.equal(lengthAfter, 5);
        });

        it("getBurnRequestsLength", async function () {
            const tx = await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from});
            await factory.confirmMintRequest(tx.logs[0].args.requestHash, {from: custodian0})

            const lengthBefore = await factory.getBurnRequestsLength();
            assert.equal(lengthBefore, 0);

            await wbtc.approve(factory.address, amount, {from});
            await factory.burn(amount/3, {from});
            await factory.burn(amount/3, {from});
            await factory.burn(amount/3, {from});

            const lengthAfter = await factory.getBurnRequestsLength();
            assert.equal(lengthAfter, 3);
        });

        it("getMintRequests with invalid nonce", async function () {
            const lengthBefore = await factory.getMintRequestsLength();
            assert.equal(lengthBefore, 0);
            
            await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from});
            await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from});
            await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from});
            await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from});
            await factory.addMintRequest(amount, txid0, custodianDepositAddressForMerchant0, {from});

            const lengthAfter = await factory.getMintRequestsLength();
            assert.equal(lengthAfter, 5);
        });
    });
});

