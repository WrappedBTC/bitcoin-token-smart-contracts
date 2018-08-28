pragma solidity 0.4.24;


library IndexedMapping {

    struct indexedMapping {
        mapping(address=>bool) valueExists;
        mapping(address=>uint) valueIndex;
        address[] valueList;
    }

    function add(indexedMapping storage self, address val) internal returns(bool) {
        if (exists(self, val)) return false;

        self.valueExists[val] = true;
        self.valueIndex[val] = self.valueList.push(val) - 1;
        return true;
    }

    function remove(indexedMapping storage self, address val) internal returns(bool) {
        uint index;
        address lastVal;

        if (!exists(self, val)) return false;

        index = self.valueIndex[val];
        lastVal = self.valueList[self.valueList.length - 1];

        // remove val 
        delete self.valueExists[val];
        delete self.valueIndex[val];

        // replace it with last val
        self.valueList[index] = lastVal;
        self.valueIndex[lastVal] = index;
        self.valueList.length--;

        return true;
    }

    function exists(indexedMapping storage self, address val) internal view returns(bool) {
        return self.valueExists[val];
    }

    function getValue(indexedMapping storage self, uint index) internal view returns(address) {
        return self.valueList[index];
    }

    function getValueList(indexedMapping storage self) internal view returns(address[]) {
        return self.valueList;
    }
}