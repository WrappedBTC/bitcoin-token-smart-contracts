pragma solidity 0.4.24;


import "../utils/OwnableContract.sol";


contract OwnableContractOwner is OwnableContract {

    event CalledTransferOwnership(OwnableContract ownedContract, address newOwner);

    function callTransferOwnership(OwnableContract ownedContract, address newOwner) external onlyOwner {
        require(newOwner != address(0), "bad address");
        ownedContract.transferOwnership(newOwner);
        emit CalledTransferOwnership(ownedContract, newOwner);
    }

    event CalledClaimOwnership(OwnableContract contractToOwn);

    function callClaimOwnership(OwnableContract contractToOwn) external onlyOwner {
        contractToOwn.claimOwnership();
        emit CalledClaimOwnership(contractToOwn);
    }
 
    event CalledReclaimToken(OwnableContract ownedContract, ERC20 _token);
 
    function callReclaimToken(OwnableContract ownedContract, ERC20 _token) external onlyOwner {
        require(_token != address(0), "bad address");
        ownedContract.reclaimToken(_token);
        emit CalledReclaimToken(ownedContract, _token);
    }

    event CalledReclaimEther(OwnableContract ownedContract);

    function callReclaimEther(OwnableContract ownedContract) external onlyOwner { 
        ownedContract.reclaimEther();
        emit CalledReclaimEther(ownedContract);
    }
}
