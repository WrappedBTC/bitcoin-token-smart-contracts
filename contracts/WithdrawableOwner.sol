pragma solidity 0.4.24;


import "./Withdrawable.sol";


contract WithdrawableOwner is Withdrawable {

    event CalledTransferOwnership(Withdrawable ownedContract, address newOwner);

    function callTransferOwnership(Withdrawable ownedContract, address newOwner) external onlyOwner {
        require(newOwner != address(0), "bad address");
        ownedContract.transferOwnership(newOwner);
        emit CalledTransferOwnership(ownedContract, newOwner);
    }

    event CalledClaimOwnership(Withdrawable contractToOwn);

    function callClaimOwnership(Withdrawable contractToOwn) external onlyOwner {
        contractToOwn.claimOwnership();
        emit CalledClaimOwnership(contractToOwn);
    }
 
    event CalledReclaimToken(Withdrawable ownedContract, ERC20 _token);
 
    function callReclaimToken(Withdrawable ownedContract, ERC20 _token) external onlyOwner {
        require(_token != address(0), "bad address");
        ownedContract.reclaimToken(_token);
        emit CalledReclaimToken(ownedContract, _token);
    }

    event CalledReclaimEther(Withdrawable ownedContract);

    function callReclaimEther(Withdrawable ownedContract) external onlyOwner { 
        ownedContract.reclaimEther();
        emit CalledReclaimEther(ownedContract);
    }
}
