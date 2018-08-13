pragma solidity 0.4.24;


import "openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/BurnableToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/PausableToken.sol";
import "./Withdrawable.sol";
import "./WBTCTokenInterface.sol";


contract WBTCToken is WBTCTokenInterface, StandardToken, DetailedERC20, MintableToken, BurnableToken, PausableToken,
    Withdrawable {

    constructor() public DetailedERC20("Wrapped Bitcoin", "WBTC", 8) {}

    function burn(uint value) public onlyOwner {
        super.burn(value);
    }

    function finishMinting() public onlyOwner canMint returns (bool) {
        return false;
    }

}
