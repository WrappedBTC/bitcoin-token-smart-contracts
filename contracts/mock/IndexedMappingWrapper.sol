pragma solidity 0.4.24;

import "../utils/IndexedMapping.sol";


contract IndexedMappingWrapper {

    using IndexedMapping for IndexedMapping.Data;
    IndexedMapping.Data internal data;

    function add(address val) external returns (bool) {
        return data.add(val);
    }

    function remove(address val) external returns (bool) {
        return data.remove(val);
    }
 
    function exists(address val) external view returns (bool) {
        return data.exists(val);
    }

    function getValue(uint index) external view returns (address) {
        return data.getValue(index);
    }

    function getValueList() external view returns (address[]) {
        return data.getValueList();
    }
}
