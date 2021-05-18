pragma solidity 0.4.24;

import "../utils/OwnableContract.sol";
import "../utils/IndexedMapping.sol";
import "../factory/MembersInterface.sol";


contract Members is MembersInterface, OwnableContract {

    address public custodian;

    using IndexedMapping for IndexedMapping.Data;
    IndexedMapping.Data internal merchants;

    constructor(address _owner) public {
        require(_owner != address(0), "invalid _owner address");
        owner = _owner;
    }

    event CustodianSet(address indexed custodian);

    function setCustodian(address _custodian) external onlyOwner returns (bool) {
        require(_custodian != address(0), "invalid custodian address");
        custodian = _custodian;

        emit CustodianSet(_custodian);
        return true;
    }

    event MerchantAdd(address indexed merchant);

    function addMerchant(address merchant) external onlyOwner returns (bool) {
        require(merchant != address(0), "invalid merchant address");
        require(merchants.add(merchant), "merchant add failed");

        emit MerchantAdd(merchant);
        return true;
    } 

    event MerchantRemove(address indexed merchant);

    function removeMerchant(address merchant) external onlyOwner returns (bool) {
        require(merchant != address(0), "invalid merchant address");
        require(merchants.remove(merchant), "merchant remove failed");

        emit MerchantRemove(merchant);
        return true;
    }

    function isCustodian(address addr) external view returns (bool) {
        return (addr == custodian);
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
