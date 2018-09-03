const { assertRevert } = require('../node_modules/openzeppelin-solidity/test/helpers/assertRevert');


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

    beforeEach('as owner', async function () {
        wbtc = await WBTC.new();
        controller = await Controller.new(wbtc.address);
        members = await Members.new();
        otherToken = await BasicTokenMock.new(admin, 100);

        await controller.setFactory(factory)
        await controller.setMembers(members.address)

        await wbtc.transferOwnership(controller.address)
        await controller.callClaimOwnership(wbtc.address)
    });

    describe('as owner', function () {
        const from = admin;

        it("should setWBTC.", async function () {
            assert.notEqual(wbtc.address, otherToken.address)

            const tokenBefore = await controller.token.call();
            assert.equal(tokenBefore, wbtc.address);

            await controller.setWBTC(otherToken.address)

            const tokenAfter = await controller.token.call();
            assert.equal(tokenAfter, otherToken.address);
        });

        it("should check setWBTC event.", async function () {
            const { logs } = await controller.setWBTC(otherToken.address);
            assert.equal(logs.length, 1);
            assert.equal(logs[0].event, 'WBTCSet');
            assert.equal(logs[0].args.token, otherToken.address);
        });

        it("should setMembers.", async function () {
            const otherMembers = await Members.new();
            assert.notEqual(otherMembers.address, members.address)

            const membersBefore = await controller.members.call();
            assert.equal(membersBefore, members.address);

            await controller.setMembers(otherMembers.address);

            const membersAfter = await controller.members.call();
            assert.equal(membersAfter, otherMembers.address);
        });

        it("should check setMembers event.", async function () {
            const otherMembers = await Members.new();
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
            await controller.pause();
            await controller.mint(admin, 100, {from: factory});
            await assertRevert(wbtc.transfer(other, 20));
        });

        it("should check pause emits an event.", async function () {
            const { logs } = await controller.pause();
            assert.equal(logs.length, 1);
            assert.equal(logs[0].event, 'Paused');
        });

        describe('unpause token', function () {
            beforeEach('as owner', async function () {
                //unpause token;
                //check event
            });
            it("should check transfer succeeds.", async function () {});
        });
    });

    describe('not as owner', function () {
        it("setWBTC reverts.", async function () {});
        it("setMembers reverts.", async function () {});
        it("setFactory reverts.", async function () {});
        it("pause reverts.", async function () {});
        it("unpause reverts.", async function () {});
    });

    describe('as factory', function () {
        it("mint.", async function () {});
        it("burn.", async function () {});
    });

    describe('not as factory', function () {
        it("mint reverts.", async function () {});
        it("burn reverts.", async function () {});
    });

    describe('as anyone', function () {
        it("check isCustodian.", async function () {});
        it("check isMerchant.", async function () {});
        it("check getWBTC.", async function () {});
    });
});
