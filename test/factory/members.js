const BigNumber = web3.BigNumber

const { ZEPPELIN_LOCATION } = require("../helper.js");
const { expectThrow } = require(ZEPPELIN_LOCATION + 'openzeppelin-solidity/test/helpers/expectThrow');

require("chai")
    .use(require("chai-as-promised"))
    .use(require('chai-bignumber')(BigNumber))
    .should()

const Members = artifacts.require("./factory/Members.sol");

contract('Members', function(accounts) {

    beforeEach('setup contract for each test', async () => {
        admin = accounts[0];
        user1 = accounts[1];
        user2 = accounts[2];
        user3 = accounts[3];
        user4 = accounts[4];
        user5 = accounts[5];
        user6 = accounts[6];
        members = await Members.new(admin);
    });

    it("create members with 0 owner address parameter fails.", async function () {
        await expectThrow(Members.new(0), "invalid _owner address");
    });

    it("add a custodian.", async function () {
        await members.addCustodian(user1);

        custodian0 = await members.getCustodian(0);
        custodians = await members.getCustodians();

        custodian0.should.equal(user1);
        (custodians.length).should.equal(1);
        custodians[0].should.equal(user1);
    });

    it("add a custodian with 0 address fails.", async function () {
        await expectThrow(members.addCustodian(0), "invalid custodian address");
    });

    it("remove a custodian.", async function () {
        await members.addCustodian(user1);
        await members.addCustodian(user2);
        await members.removeCustodian(user1);

        custodian0 = await members.getCustodian(0);
        custodians = await members.getCustodians();

        custodian0.should.equal(user2);
        (custodians.length).should.equal(1);
        custodians[0].should.equal(user2);
    });

    it("remove custodian with 0 address fails.", async function () {
        await expectThrow(members.removeCustodian(0), "invalid custodian address");
    });

    it("add a custodian not as owner.", async function () {
        await expectThrow(members.addCustodian(user1, {from:user1}));
    });

    it("add a custodian which was already added.", async function () {
        members.addCustodian(user1);
        await expectThrow(members.addCustodian(user1), "custodian add failed");
    });

    it("remove a custodian not as owner.", async function () {
        await members.addCustodian(user1);
        await expectThrow(members.removeCustodian(user1, {from:user1}));
    });

    it("remove a custodian which was already removed.", async function () {
        await members.addCustodian(user1);
        members.removeCustodian(user1);
        await expectThrow(members.removeCustodian(user1), "custodian remove failed");
    });

    it("add a few custodians and get the entire list.", async function () {
        await members.addCustodian(user1);
        await members.addCustodian(user2);
        await members.addCustodian(user3);
        await members.removeCustodian(user3);
        await members.removeCustodian(user2);
        await members.addCustodian(user4);
        await members.addCustodian(user5);
        await members.addCustodian(user6);
        await members.removeCustodian(user5);
        // at this level should have users 1, 4, 6

        custodians = await members.getCustodians();
        custodian0 = await members.getCustodian(0);
        custodian1 = await members.getCustodian(1);
        custodian2 = await members.getCustodian(2);

        (custodians.length).should.equal(3);
        custodians[0].should.equal(user1)
        custodians[1].should.equal(user4)
        custodians[2].should.equal(user6)
        custodian0.should.equal(user1)
        custodian1.should.equal(user4)
        custodian2.should.equal(user6)
    });

    it("add a merchant.", async function () {
        await members.addMerchant(user1);

        merchant0 = await members.getMerchant(0);
        merchants = await members.getMerchants();

        merchant0.should.equal(user1);
        (merchants.length).should.equal(1);
        merchants[0].should.equal(user1);
    });

    it("add a merchant with 0 address fails.", async function () {
        await expectThrow(members.addMerchant(0), "invalid merchant address");
    });

    it("remove a merchant.", async function () {
        await members.addMerchant(user1);
        await members.addMerchant(user2);
        await members.removeMerchant(user1);

        merchant0 = await members.getMerchant(0);
        merchants = await members.getMerchants();

        merchant0.should.equal(user2);
        (merchants.length).should.equal(1);
        merchants[0].should.equal(user2);
    });

    it("remove merchant with 0 address fails.", async function () {
        await expectThrow(members.removeMerchant(0), "invalid merchant address");
    });

    it("remove a merchant which was already removed.", async function () {
        await members.addMerchant(user1);
        await members.removeMerchant(user1);
        await expectThrow(members.removeMerchant(user1), "merchant remove failed");
    });

    it("add a merchant not as owner.", async function () {
        await expectThrow(members.addMerchant(user1, {from:user1}));
    });

    it("add a merchant which was already added.", async function () {
        members.addMerchant(user1);
        await expectThrow(members.addMerchant(user1), "merchant add failed");
    });

    it("remove a merchant not as owner.", async function () {
        await members.addMerchant(user1);
        await expectThrow(members.removeMerchant(user1, {from:user1}));
    });

    it("add a few merchants and get the entire list.", async function () {
        await members.addMerchant(user1);
        await members.addMerchant(user2);
        await members.addMerchant(user3);
        await members.removeMerchant(user3);
        await members.removeMerchant(user2);
        await members.addMerchant(user4);
        await members.addMerchant(user5);
        await members.addMerchant(user6);
        await members.removeMerchant(user5);
        // at this level should have users 1, 4, 6

        merchants = await members.getMerchants();
        merchant0 = await members.getMerchant(0);
        merchant1 = await members.getMerchant(1);
        merchant2 = await members.getMerchant(2);

        (merchants.length).should.equal(3);
        merchants[0].should.equal(user1)
        merchants[1].should.equal(user4)
        merchants[2].should.equal(user6)
        merchant0.should.equal(user1)
        merchant1.should.equal(user4)
        merchant2.should.equal(user6)
    });

    it("add a few merchants and custodians together and get the entire lists.", async function () {
        await members.addMerchant(user1);
        await members.addCustodian(user2);
        await members.addMerchant(user3);
        await members.addCustodian(user4);
        await members.addMerchant(user5);

        merchants = await members.getMerchants();
        custodians = await members.getCustodians();
        merchant0 = await members.getCustodian(0);
        merchant1 = await members.getCustodian(1);
        custodian0 = await members.getMerchant(0);
        custodian1 = await members.getMerchant(1);
        custodian2 = await members.getMerchant(2);

        (merchants.length).should.equal(3);
        (custodians.length).should.equal(2);

        merchants[0].should.equal(user1)
        merchants[1].should.equal(user3)
        merchants[2].should.equal(user5)
        merchant0.should.equal(user2)
        merchant1.should.equal(user4)

    });
});
