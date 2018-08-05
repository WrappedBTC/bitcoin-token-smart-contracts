pragma solidity ^0.4.24;


import 'openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/BurnableToken.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/PausableToken.sol';
import 'openzeppelin-solidity/contracts/ownership/Claimable.sol';
import 'openzeppelin-solidity/contracts/ownership/CanReclaimToken.sol';
import 'openzeppelin-solidity/contracts/ownership/HasNoEther.sol';


contract WBTCToken is StandardToken, DetailedERC20, MintableToken, BurnableToken, PausableToken, Claimable,
    CanReclaimToken, HasNoEther {

    constructor() public DetailedERC20("Wrapped Bitcoin", "WBTC", 8) {}

    function burn(uint256 value) public onlyOwner {
        super.burn(value);
    }

    function finishMinting() public onlyOwner canMint returns (bool){
        return false;
    }

}
