pragma solidity 0.4.24;


import "openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/BurnableToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/PausableToken.sol";
import "../utils/Withdrawable.sol";
import "../token/TokenInterface.sol";


contract Token is TokenInterface, StandardToken, DetailedERC20, MintableToken, BurnableToken, PausableToken,
    Withdrawable {

    /* solhint-disable no-empty-blocks */
    constructor() public DetailedERC20("Wrapped Bitcoin", "WBTC", 8) { }
    /* solhint-enable no-empty-blocks */

    function burn(uint value) public onlyOwner {
        super.burn(value);
    }

    function finishMinting() public onlyOwner canMint returns (bool) {
        return false;
    }

}
