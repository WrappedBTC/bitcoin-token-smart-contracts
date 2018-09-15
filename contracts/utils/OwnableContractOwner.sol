pragma solidity 0.4.24;

import "../utils/OwnableContract.sol";


contract OwnableContractOwner is OwnableContract {

    event CalledTransferOwnership(OwnableContract ownedContract, address newOwner);

    function callTransferOwnership(OwnableContract ownedContract, address newOwner) external onlyOwner returns (bool) {
        require(newOwner != address(0), "invalid newOwner address");
        ownedContract.transferOwnership(newOwner);
        emit CalledTransferOwnership(ownedContract, newOwner);
        return true;
    }

    event CalledClaimOwnership(OwnableContract contractToOwn);

    function callClaimOwnership(OwnableContract contractToOwn) external onlyOwner returns (bool) {
        contractToOwn.claimOwnership();
        emit CalledClaimOwnership(contractToOwn);
        return true;
    }

    event CalledReclaimToken(OwnableContract ownedContract, ERC20 _token);

    function callReclaimToken(OwnableContract ownedContract, ERC20 _token) external onlyOwner returns (bool) {
        require(_token != address(0), "invalid _token address");
        ownedContract.reclaimToken(_token);
        emit CalledReclaimToken(ownedContract, _token);
        return true;
    }
}
