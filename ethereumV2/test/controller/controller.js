const { ZEPPELIN_LOCATION } = require("../helper.js");
const { expectThrow } = require(ZEPPELIN_LOCATION + 'openzeppelin-solidity/test/helpers/expectThrow');

const WBTC = artifacts.require("./token/WBTC.sol")
const Members = artifacts.require("./factory/Members.sol")
const Controller = artifacts.require("./controller/Controller.sol")
const BasicTokenMock = artifacts.require('BasicTokenMock');

contract('Controller', function(accounts) {

    const admin = accounts[0];
    const other = accounts[1];
    const factory = accounts[2]; // factory simulated as a regular address here
    const otherFactory = accounts[3];

    let wbtc;
    let controller;
    let members;

    beforeEach('create controller and transfer wbtc ownership to it', async function () {
        wbtc = await WBTC.new();
        controller = await Controller.new(wbtc.address);
        members = await Members.new(admin);
        otherToken = await BasicTokenMock.new(admin, 100);

        await controller.setFactory(factory)
        await controller.setMembers(members.address)

        await wbtc.transferOwnership(controller.address)
        await controller.callClaimOwnership(wbtc.address)
    });

    describe('as owner', function () {
        const from = admin;

        it("should create controller with 0 token address.", async function () {
            await expectThrow(Controller.new(0), "invalid _token address");
        });

        it("should setMembers.", async function () {
            const otherMembers = await Members.new(admin);
            assert.notEqual(otherMembers.address, members.address)

            const membersBefore = await controller.members.call();
            assert.equal(membersBefore, members.address);

            await controller.setMembers(otherMembers.address);

            const membersAfter = await controller.members.call();
            assert.equal(membersAfter, otherMembers.address);
        });

        it("should setMembers with 0 address.", async function () {
            await expectThrow(controller.setMembers(0), "invalid _members address");
        });

        it("should check setMembers event.", async function () {
            const otherMembers = await Members.new(admin);
            const { logs } = await controller.setMembers(otherMembers.address);
            assert.equal(logs.length, 1);
            assert.equal(logs[0].event, 'MembersSet');
            assert.equal(logs[0].args.members, otherMembers.address);
        });

        it("should setFactory.", async function () {
            assert.notEqual(otherFactory, factory)

            const factoryBefore = await controller.factory.call();
            assert.equal(factoryBefore, factory);

            await controller.setFactory(otherFactory);

            const factoryAfter = await controller.factory.call();
            assert.equal(factoryAfter, otherFactory);
        });

        it("should setFactory with 0 address.", async function () {
            await expectThrow(controller.setFactory(0), "invalid _factory address");
        });

        it("should check setFactory event.", async function () {
            const { logs } = await controller.setFactory(otherFactory);
            assert.equal(logs.length, 1);
            assert.equal(logs[0].event, 'FactorySet');
            assert.equal(logs[0].args.factory, otherFactory);
        });

        it("should check transfer succeeds when not paused.", async function () {
            const balanceBefore = await wbtc.balanceOf(admin)
            assert.equal(balanceBefore, 0);

            await controller.mint(admin, 100, {from: factory});
            const balanceAfterMint = await wbtc.balanceOf(admin);
            assert.equal(balanceAfterMint, 100);

            await wbtc.transfer(other, 20);
            const balanceAfterTransfer = await wbtc.balanceOf(admin)
            assert.equal(balanceAfterTransfer, 80);
        });

        it("should check transfer fails after pause.", async function () {
            await controller.mint(admin, 100, {from: factory});
            await controller.pause();
            await expectThrow(wbtc.transfer(other, 20));
        });

        it("should check mint fails after pause.", async function () {
            await controller.pause();
            await expectThrow(controller.mint(admin, 100, {from: factory}));
        });

        it("should check burn fails after pause.", async function () {
            await controller.mint(factory, 100, {from: factory});

            // when burning through factory we only need to approve.
            // here we transfer since checking internally.
            await wbtc.transfer(controller.address, 20, {from: factory})
            await controller.pause();
            await expectThrow(controller.burn(20, {from: factory}));
        });

        it("should check pause emits an event.", async function () {
            const { logs } = await controller.pause();
            assert.equal(logs.length, 1);
            assert.equal(logs[0].event, 'Paused');
        });

        it("should check transfer succeeds after unpause.", async function () {
            await controller.mint(admin, 100, {from: factory});
            const balanceBefore = await wbtc.balanceOf(admin)
            assert.equal(balanceBefore, 100);

            await controller.pause();
            const isPausedBefore = await wbtc.paused.call();
            assert.equal(isPausedBefore, true);

            await expectThrow(wbtc.transfer(other, 20));

            await controller.unpause();
            const isPausedAfter = await wbtc.paused.call();
            assert.equal(isPausedAfter, false);

            await wbtc.transfer(other, 20);
            const balanceAfterTransfer = await wbtc.balanceOf(admin)
            assert.equal(balanceAfterTransfer, 80);
        });

        it("should check unpause emits an event.", async function () {
            await controller.pause();
            const { logs } = await controller.unpause();
            assert.equal(logs.length, 1);
            assert.equal(logs[0].event, 'Unpaused');
        });

        it('does not lose owner after renouncement', async function () {
            await expectThrow(controller.renounceOwnership());
            const owner = await controller.owner();
            assert.equal(owner, admin);
        });
    });

    describe('not as owner', function () {
        const from = other;

        it("setMembers reverts.", async function () {
            await expectThrow(controller.setMembers(otherToken.address, {from}));
        });

        it("setFactory reverts.", async function () {
            await expectThrow(controller.setFactory(otherFactory, {from}));
        });

        it("pause reverts.", async function () {
            await expectThrow(controller.pause({from}));
        });

        it("unpause reverts.", async function () {
            await expectThrow(controller.unpause({from}));
        });
    });

    describe('as factory', function () {
        it("mint", async function () {
            const balanceBefore = await wbtc.balanceOf(admin)
            assert.equal(balanceBefore, 0);

            await controller.mint(admin, 100, {from: factory});
            const balanceAfter = await wbtc.balanceOf(admin);
            assert.equal(balanceAfter, 100);
        });

        it("should mint with 0 address", async function () {
            await expectThrow(controller.mint(0, 100, {from: factory}), "invalid to address");
        });

        it("mint of token that controller does not own should fail", async function () {
            await controller.callTransferOwnership(wbtc.address, admin)
            await wbtc.claimOwnership()
            await expectThrow(controller.mint(admin, 100, {from: factory}));
        });

        it("burn", async function () {
            await controller.mint(factory, 100, {from: factory});

            const balanceBefore = await wbtc.balanceOf(factory)
            assert.equal(balanceBefore, 100);

            // when burning through factory we only need to approve.
            // here we transfer since checking internally.
            await wbtc.transfer(controller.address, 20, {from: factory})
            await controller.burn(20, {from: factory});
            const balanceAfter = await wbtc.balanceOf(factory);
            assert.equal(balanceAfter, 80);
        });

        it("burn of token that controller does not own should fail", async function () {
            await controller.mint(factory, 100, {from: factory});
            await wbtc.transfer(controller.address, 20, {from: factory})

            await controller.callTransferOwnership(wbtc.address, admin)
            await wbtc.claimOwnership()

            await expectThrow(controller.burn(20, {from: factory}));
        });
    });

    describe('not as factory', function () {
        it("mint reverts.", async function () {
            await expectThrow(controller.mint(admin, 100, {other}));
        });
        it("burn reverts.", async function () {
            await controller.mint(other, 100, {from: factory});

            const balanceBefore = await wbtc.balanceOf(other)
            assert.equal(balanceBefore, 100);

            // when burning through factory we only need to approve.
            // here we transfer since checking internally.
            await wbtc.transfer(controller.address, 20, {from: other})
            await expectThrow(controller.burn(20, {from: other}));
        });
    });

    describe('as anyone', function () {
        it("check isCustodian.", async function () {
            const isCustodianBefore = await controller.isCustodian(other);
            assert.equal(isCustodianBefore, false);

            await members.setCustodian(other);
            const isCustodianAfter = await controller.isCustodian(other);
            assert.equal(isCustodianAfter, true);
        });

        it("check isMerchant.", async function () {
            const isMerchantBefore = await controller.isMerchant(other);
            assert.equal(isMerchantBefore, false);

            await members.addMerchant(other);
            const isMerchantAfter = await controller.isMerchant(other);
            assert.equal(isMerchantAfter, true);
        });

        it("check getToken.", async function () {
            const gotToken =  await controller.getToken();
            assert.equal(gotToken, wbtc.address);
        });
    });
});
