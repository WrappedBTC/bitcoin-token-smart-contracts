const { expectThrow } = require('../../node_modules/openzeppelin-solidity/test/helpers/expectThrow');
const { ethSendTransaction, ethGetBalance } = require('../../node_modules/openzeppelin-solidity/test/helpers/web3');

const HasNoEtherTest = artifacts.require('WBTC');
const ForceEther = artifacts.require('ForceEther');

function shouldBehaveLikeHasNoEther (accounts) {

  const amount = web3.toWei('1', 'ether');

  it('should be constructible', async function () {
    await HasNoEtherTest.new();
  });

  it('should not accept ether in constructor', async function () {
    await expectThrow(HasNoEtherTest.new({ value: amount }), "Cannot send value to non-payable constructor");
  });

  it('should not accept ether', async function () {
    const hasNoEther = await HasNoEtherTest.new();

    await expectThrow(
      ethSendTransaction({
        from: accounts[1],
        to: hasNoEther.address,
        value: amount,
      }),
    );
  });
};

module.exports = { shouldBehaveLikeHasNoEther };
