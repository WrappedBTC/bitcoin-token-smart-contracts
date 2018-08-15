pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/ownership/Claimable.sol";
import "openzeppelin-solidity/contracts/ownership/CanReclaimToken.sol";
import "openzeppelin-solidity/contracts/ownership/HasNoEther.sol";


    /* solhint-disable no-empty-blocks */
contract Withdrawable is Claimable, CanReclaimToken, HasNoEther { }
    /* solhint-enable no-empty-blocks */