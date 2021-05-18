const { ZEPPELIN_LOCATION } = require("../helper.js");
const { expectThrow } = require(ZEPPELIN_LOCATION + 'openzeppelin-solidity/test/helpers/expectThrow');

function shouldBehaveLikeCanReclaimToken(accounts) {

  it('should allow owner to reclaim tokens', async function () {
    const ownerStartBalance = await token.balanceOf(accounts[0]);
    await canReclaimToken.reclaimToken(token.address);
    const ownerFinalBalance = await token.balanceOf(accounts[0]);
    const finalBalance = await token.balanceOf(canReclaimToken.address);
    assert.equal(finalBalance, 0);
    assert.equal(ownerFinalBalance - ownerStartBalance, 10);
  });

  it('should allow only owner to reclaim tokens', async function () {
    await expectThrow(
      canReclaimToken.reclaimToken(token.address, { from: accounts[1] }),
    );
  });
};


module.exports = { shouldBehaveLikeCanReclaimToken };
