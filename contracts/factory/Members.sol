pragma solidity 0.4.24;

import "../utils/OwnableContract.sol";
import "../utils/IndexedMapping.sol";
import "../factory/MembersInterface.sol";


contract Members is MembersInterface, OwnableContract {

    using IndexedMapping for IndexedMapping.Data;
    IndexedMapping.Data internal custodians;
    IndexedMapping.Data internal merchants;

    constructor(address _owner) public {
        require(_owner != address(0), "invalid _owner address");
        owner = _owner;
    }

    event CustodianAdd(address custodian);

    function addCustodian(address custodian) external onlyOwner returns (bool) {
        require(custodian != address(0), "invalid custodian address");
        require(custodians.add(custodian), "custodian add failed"); 

        emit CustodianAdd(custodian);
        return true;
    }

    event CustodianRemove(address custodian);

    function removeCustodian(address custodian) external onlyOwner returns (bool) {
        require(custodian != address(0), "invalid custodian address");
        require(custodians.remove(custodian), "custodian remove failed");

        emit CustodianRemove(custodian);
        return true;
    }

    event MerchantAdd(address merchant);

    function addMerchant(address merchant) external onlyOwner returns (bool) {
        require(merchant != address(0), "invalid merchant address");
        require(merchants.add(merchant), "merchant add failed");

        emit MerchantAdd(merchant);
        return true;
    } 

    event MerchantRemove(address custodian);

    function removeMerchant(address merchant) external onlyOwner returns (bool) {
        require(merchant != address(0), "invalid merchant address");
        require(merchants.remove(merchant), "merchant remove failed");

        emit MerchantRemove(merchant);
        return true;
    }

    function isCustodian(address addr) external view returns (bool) {
        return custodians.exists(addr);
    }

    function getCustodian(uint index) external view returns (address) {
        return custodians.getValue(index);
    }

    function getCustodians() external view returns (address[]) {
        return custodians.getValueList();
    }

    function isMerchant(address addr) external view returns (bool) {
        return merchants.exists(addr);
    }

    function getMerchant(uint index) external view returns (address) {
        return merchants.getValue(index);
    }

    function getMerchants() external view returns (address[]) {
        return merchants.getValueList();
    }
}