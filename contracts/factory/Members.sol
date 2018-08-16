pragma solidity 0.4.24;


import "../utils/Withdrawable.sol";
import "../utils/IndexedMapping.sol";
import "../utils/WithdrawableOwner.sol";
import "../factory/MembersInterface.sol";


contract Members is MembersInterface, Withdrawable, WithdrawableOwner {

    IndexedMapping public custodians;
    IndexedMapping public merchants;

    constructor() public {
        custodians = new IndexedMapping();
        merchants = new IndexedMapping();
    }

    event CustodianAdd(address custodian, bool add);

    function addCustodian(address custodian, bool add) external onlyOwner {
        require(custodian != address(0), "invalid custodian address");
        if (add) {
            require(custodians.add(custodian), "custodian insert failed"); 
        } else {
            require(custodians.remove(custodian), "custodian remove failed");
        }

        emit CustodianAdd(custodian, add);
    }

    event MerchantAdd(address custodian, bool add);

    function addMerchant(address merchant, bool add) external onlyOwner {
        require(merchant != address(0), "invalid merchant address");
        if (add) {
            require(merchants.add(merchant), "merchant insert failed"); 
        } else {
            require(merchants.remove(merchant), "merchant remove failed");
        }

        emit MerchantAdd(merchant, add);
    } 

    function isCustodian(address val) external view returns(bool) {
        return custodians.exists(val);
    }

    function isMerchant(address val) external view returns(bool) {
        return merchants.exists(val);
    }
}
