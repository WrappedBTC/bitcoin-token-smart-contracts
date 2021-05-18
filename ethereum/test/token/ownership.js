const { shouldBehaveLikeOwnable } = require("./Ownable.behaviour.js")
const { shouldBehaveLikeClaimable } = require("./Claimable.behaviour.js")
const { shouldBehaveLikeCanReclaimToken } = require("./CanReclaimToken.behaviour.js")
const { shouldBehaveLikeHasNoEther } = require("./HasNoEther.behaviour.js")

const Token = artifacts.require("./token/WBTC.sol");
const BasicTokenMock = artifacts.require('BasicTokenMock');

contract('Ownable', function (accounts) {
    beforeEach(async function () {
        this.ownable = await Token.new();
    });

    shouldBehaveLikeOwnable(accounts);
});


contract('Claimable', function (accounts) {
    beforeEach(async function () {
        claimable = await Token.new();
    });

    shouldBehaveLikeClaimable(accounts);
});


contract('CanReclaimToken', function (accounts) {
    beforeEach(async function () {
        const owner = accounts[0];

        // Create contract and token
        token = await BasicTokenMock.new(owner, 100);
        canReclaimToken = await Token.new();

        // Force token into contract
        await token.transfer(canReclaimToken.address, 10);
        const startBalance = await token.balanceOf(canReclaimToken.address);
        assert.equal(startBalance, 10);
    });

    shouldBehaveLikeCanReclaimToken(accounts);
});


contract('HasNoEther', function (accounts) {
    shouldBehaveLikeHasNoEther(accounts);
});