pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/BurnableToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/PausableToken.sol";
import "../utils/OwnableContract.sol";


contract WBTC is StandardToken, DetailedERC20("Wrapped BTC", "WBTC", 8),
    MintableToken, BurnableToken, PausableToken, OwnableContract {

    function burn(uint value) public onlyOwner {
        super.burn(value);
    }

    function finishMinting() public onlyOwner returns (bool) {
        return false;
    }

    function renounceOwnership() public onlyOwner {
        revert("renouncing ownership is blocked");
    }
}

