pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/ownership/Claimable.sol";
import "openzeppelin-solidity/contracts/ownership/CanReclaimToken.sol";
import "openzeppelin-solidity/contracts/ownership/HasNoEther.sol";


// empty block is used as this contract just inherits others.
contract OwnableContract is CanReclaimToken, Claimable { } /* solhint-disable-line no-empty-blocks */