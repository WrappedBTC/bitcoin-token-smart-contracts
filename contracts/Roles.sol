pragma solidity 0.4.24;


import "./Withdrawable.sol";
import "./IndexedMapping.sol";
import "./RolesInterface.sol";


contract Roles is RolesInterface, Withdrawable {

    IndexedMapping public custodians;
    IndexedMapping public merchants;

    function addCustodian(address custodian, bool add) external onlyOwner {
        require(custodian != address(0), "bad address");
        if (add) {
            require(custodians.add(custodian), "custodian insert failed"); 
        } else {
            require(custodians.remove(custodian), "custodian remove failed");
        }
    }

    function addMerchant(address merchant, bool add) external onlyOwner {
        require(merchant != address(0), "bad address");
        if (add) {
            require(merchants.add(merchant), "merchant insert failed"); 
        } else {
            require(merchants.remove(merchant), "merchant remove failed");
        }
    } 

    function isCustodian(address val) external view returns(bool) {
        return custodians.exists(val);
    }

    function isMerchant(address val) external view returns(bool) {
        return merchants.exists(val);
    }
}
