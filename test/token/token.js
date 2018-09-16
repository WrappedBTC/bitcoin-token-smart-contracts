const { shouldBehaveLikeBasicToken } = require("./BasicToken.behaviour.js")
const { shouldBehaveLikeDetailedERC20 } = require("./DetailedERC20.behaviour.js")
const { shouldBehaveLikeStandardToken } = require("./StandardToken.behaviour.js")
const { shouldBehaveLikeMintableToken } = require("./MintableToken.behaviour.js")
const { shouldBehaveLikePausableToken } = require("./PausableToken.behaviour.js")
const { shouldBehaveLikeBurnableToken } = require("./BurnableToken.behaviour.js")

const Token = artifacts.require("./token/WBTC.sol");

contract('shouldBehaveLikeDetailedERC20', function (accounts) {
    const initialBalance = 100;
    const owner = accounts[0];

    beforeEach(async function () {
        this.detailedERC20 = await Token.new({ from: owner });
    });

    shouldBehaveLikeDetailedERC20(accounts, "Wrapped BTC", "WBTC", 8);
});


contract('BasicToken', function ([owner, recipient, anotherAccount]) {
    const initialBalance = 100;

    beforeEach(async function () {
        this.token = await Token.new({ from: owner });
        await this.token.mint(owner, initialBalance);
    });

    shouldBehaveLikeBasicToken([owner, recipient, anotherAccount]);
});


contract('StandardToken', function ([owner, recipient, anotherAccount]) {
    const initialBalance = 100;

    beforeEach(async function () {
        this.token = await Token.new({ from: owner });
        await this.token.mint(owner, initialBalance);
    });

    shouldBehaveLikeStandardToken([owner, recipient, anotherAccount]);
});


contract('PausableToken', function ([owner, recipient, anotherAccount]) {
    const initialBalance = 100;

    beforeEach(async function () {
        this.token = await Token.new({ from: owner });
        await this.token.mint(owner, initialBalance);
    });

    shouldBehaveLikePausableToken([owner, recipient, anotherAccount]);
});


contract('MintableToken', function ([owner, anotherAccount]) {
    const minter = owner;

    beforeEach(async function () {
        this.token = await Token.new({ from: owner });
    });

    shouldBehaveLikeMintableToken([owner, anotherAccount, minter]);
});


contract('BurnableToken', function ([owner, anotherAccount]) {
    const initialBalance = 1000;

    beforeEach(async function () {
        this.token = await Token.new({ from: owner });
        await this.token.mint(owner, initialBalance);
    });

    shouldBehaveLikeBurnableToken([owner, anotherAccount], initialBalance);
});