const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

function shouldBehaveLikeDetailedERC20 (accounts, _name, _symbol, _decimals) {

  it('has a name', async function () {
    const name = await this.detailedERC20.name();
    name.should.be.equal(_name);
  });

  it('has a symbol', async function () {
    const symbol = await this.detailedERC20.symbol();
    symbol.should.be.equal(_symbol);
  });

  it('has an amount of decimals', async function () {
    const decimals = await this.detailedERC20.decimals();
    decimals.should.be.bignumber.equal(_decimals);
  });
};

module.exports = { shouldBehaveLikeDetailedERC20 };
