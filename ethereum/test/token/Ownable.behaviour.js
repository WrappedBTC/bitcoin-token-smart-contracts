const { ZEPPELIN_LOCATION, ZERO_ADDRESS } = require("../helper.js");
const { expectThrow } = require(ZEPPELIN_LOCATION + 'openzeppelin-solidity/test/helpers/expectThrow');
const { EVMRevert } = require(ZEPPELIN_LOCATION + 'openzeppelin-solidity/test/helpers/EVMRevert');

require('chai')
  .should();

function shouldBehaveLikeOwnable (accounts) {
  describe('as an ownable', function () {
    it('should have an owner', async function () {
      const owner = await this.ownable.owner();
      owner.should.not.eq(ZERO_ADDRESS);
    });

    // since need to also claim ownership, simple transfer ownership is not enoguh
    it('does not change owner after transfer without claim', async function () {
      const other = accounts[1];
      await this.ownable.transferOwnership(other);
      const owner = await this.ownable.owner();

      owner.should.not.eq(other);
    });

    it('should prevent non-owners from transfering', async function () {
      const other = accounts[2];
      const owner = await this.ownable.owner.call();
      owner.should.not.eq(other);
      await expectThrow(this.ownable.transferOwnership(other, { from: other }), EVMRevert);
    });

    // since transfer ownership awaits claim, transfer to 0 address can not happen implicitly.
    it('should not revert for transferownership to 0 address', async function () {
      const originalOwner = await this.ownable.owner();
      await this.ownable.transferOwnership(null, { from: originalOwner });
    });

    it('does not lose owner after renouncement', async function () {
        const ownerBefore = await this.ownable.owner();
        await expectThrow(this.ownable.renounceOwnership(), EVMRevert);
        const ownerAfter = await this.ownable.owner();
        ownerAfter.should.not.eq(ZERO_ADDRESS);
        ownerAfter.should.eq(ownerBefore);
    });

    it('should prevent non-owners from renouncement', async function () {
      const other = accounts[2];
      const owner = await this.ownable.owner.call();
      owner.should.not.eq(other);
      await expectThrow(this.ownable.renounceOwnership({ from: other }), EVMRevert);
    });
  });
}

module.exports = {
  shouldBehaveLikeOwnable,
};
