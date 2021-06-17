const BigNumber = web3.BigNumber

const { ZEPPELIN_LOCATION , ZERO_ADDRESS} = require("../helper.js");
const { expectThrow } = require(ZEPPELIN_LOCATION + 'openzeppelin-solidity/test/helpers/expectThrow');
const { ethSendTransaction, ethGetBalance } = require(ZEPPELIN_LOCATION + 'openzeppelin-solidity/test/helpers/web3');

require("chai")
    .use(require("chai-as-promised"))
    .use(require('chai-bignumber')(BigNumber))
    .should()

const OwnableContract = artifacts.require("./utils/OwnableContract.sol");
const OwnableContractOwner = artifacts.require("./utils/OwnableContractOwner.sol");
const BasicTokenMock = artifacts.require('BasicTokenMock');

contract('OwnableContractOwner', function(accounts) {

    const admin = accounts[0];
    const newOwner = accounts[1];
    const nonOwner = accounts[2];

    beforeEach('setup contracts for each test', async () => {
        ownableContractOwner = await OwnableContractOwner.new();
        ownableContract = await OwnableContract.new();

        await ownableContract.transferOwnership(ownableContractOwner.address)
        await ownableContractOwner.callClaimOwnership(ownableContract.address)

        token = await BasicTokenMock.new(admin, 100);
    });

    describe('as owner of the ownable contract', function () {
        const from = admin;

        it('verify calling transferOwnership directly on the owned contract fails', async function () {
            await expectThrow(ownableContract.transferOwnership(newOwner));
        });

        it('should check callTransferOwnership transfers ownership', async function () { 
            const pendingOwnerBefore = await ownableContract.pendingOwner.call();
            pendingOwnerBefore.should.equal(ZERO_ADDRESS)

            await ownableContractOwner.callTransferOwnership(ownableContract.address, newOwner, { from })
            const pendingOwnerAfter = await ownableContract.pendingOwner.call();
            pendingOwnerAfter.should.equal(newOwner)
        });

        it('should check callTransferOwnership to 0 address fails', async function () { 
            await expectThrow(ownableContractOwner.callTransferOwnership(ownableContract.address, 0, { from }), "invalid newOwner address");
        });

        it('should check callTransferOwnership emits an event', async function () {
            const { logs } = await ownableContractOwner.callTransferOwnership(ownableContract.address, newOwner, { from });
            assert.equal(logs.length, 1);
            assert.equal(logs[0].event, 'CalledTransferOwnership');
            assert.equal(logs[0].args.ownedContract, ownableContract.address);
            assert.equal(logs[0].args.newOwner, newOwner);
        });

        it('should check callClaimOwnership claims ownership', async function () {
            otherOwnableContractOwner = await OwnableContractOwner.new();

            await ownableContractOwner.callTransferOwnership(ownableContract.address, otherOwnableContractOwner.address, { from })
            const pendingOwnerBefore = await ownableContract.pendingOwner.call();
            pendingOwnerBefore.should.equal(otherOwnableContractOwner.address)

            await otherOwnableContractOwner.callClaimOwnership(ownableContract.address, { from });
            const pendingOwnerAfter = await ownableContract.pendingOwner.call();
            pendingOwnerAfter.should.equal(ZERO_ADDRESS);
            const ownerAfter = await ownableContract.owner.call();
            ownerAfter.should.equal(otherOwnableContractOwner.address);
        });

        it('should check callClaimOwnership emits an event', async function () {
            otherOwnableContractOwner = await OwnableContractOwner.new();
            await ownableContractOwner.callTransferOwnership(ownableContract.address, otherOwnableContractOwner.address, { from })
            const { logs } = await otherOwnableContractOwner.callClaimOwnership(ownableContract.address, { from });

            assert.equal(logs.length, 2);
            assert.equal(logs[0].event, 'OwnershipTransferred');
            assert.equal(logs[0].args.previousOwner, ownableContractOwner.address);
            assert.equal(logs[0].args.newOwner, otherOwnableContractOwner.address);
            assert.equal(logs[1].event, 'CalledClaimOwnership');
            assert.equal(logs[1].args.contractToOwn, ownableContract.address);
        });

        it('should check callReclaimToken reclaims token', async function () {
            const amount = 50;
            await token.transfer(ownableContract.address, amount);
            const balance = await token.balanceOf(ownableContractOwner.address);
            assert.equal(balance, 0);

            await ownableContractOwner.callReclaimToken(ownableContract.address, token.address);
            const newBalance = await token.balanceOf(ownableContractOwner.address);
            assert.equal(newBalance, amount);
        });

        it('should check callReclaimToken with 0 token address fails', async function () {
            await expectThrow(ownableContractOwner.callReclaimToken(ownableContract.address, 0), "invalid _token address");
        });

        it('should check callReclaimToken emits an event', async function () {
            const amount = 50;
            await token.transfer(ownableContract.address, amount);
            const { logs } = await ownableContractOwner.callReclaimToken(ownableContract.address, token.address);
            assert.equal(logs.length, 1);
            assert.equal(logs[0].event, 'CalledReclaimToken');
            assert.equal(logs[0].args.ownedContract, ownableContract.address);
            assert.equal(logs[0].args._token, token.address);
        });
    });

    describe('not as owner of the ownable contract', function () {
        const from = nonOwner;
        it('should check callTransferOwnership transfers reverts', async function () {
            await expectThrow(ownableContractOwner.callTransferOwnership(ownableContract.address, newOwner, { from }));
        });

        it('should check callClaimOwnership claims reverts', async function () {
            await expectThrow(ownableContractOwner.callTransferOwnership(ownableContract.address, otherOwnableContractOwner.address, { from }));
        });

        it('should check callReclaimToken reverts', async function () {
            const amount = 50;
            await token.transfer(ownableContract.address, amount);
            await expectThrow(ownableContractOwner.callReclaimToken(ownableContract.address, token.address, {from} ));
        });
    });
});

