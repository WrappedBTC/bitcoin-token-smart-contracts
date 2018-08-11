pragma solidity ^0.4.24;


import './Withdrawable.sol';


contract WithdrawableOwner is Withdrawable {

    event CalledTransferOwnership(Withdrawable ownedContract, address newOwner);

    function callTransferOwnership(Withdrawable ownedContract, address newOwner) public onlyOwner {
        ownedContract.transferOwnership(newOwner);
        emit CalledTransferOwnership(ownedContract, newOwner);
    }

    event CalledClaimOwnership(Withdrawable contractToOwn);

    function callClaimOwnership(Withdrawable contractToOwn) public onlyOwner {
        contractToOwn.claimOwnership();
        emit CalledClaimOwnership(contractToOwn);
    }
 
    event CalledReclaimToken(Withdrawable ownedContract, ERC20 _token);
 
    function callReclaimToken(Withdrawable ownedContract, ERC20 _token) external onlyOwner {
        ownedContract.reclaimToken(_token);
        emit CalledReclaimToken(ownedContract, _token);
    }

    event CalledReclaimEther(Withdrawable ownedContract);

    function callReclaimEther(Withdrawable ownedContract) external onlyOwner { 
        ownedContract.reclaimEther();
        emit CalledReclaimEther(ownedContract);
    }
}
