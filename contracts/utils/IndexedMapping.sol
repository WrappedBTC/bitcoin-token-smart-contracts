pragma solidity 0.4.24;


contract IndexedMapping {

    mapping(address=>bool) public valueExists;
    mapping(address=>uint) public valueIndex;
    address[] public valueList;

    function add(address val) public returns(bool) {
        if (exists(val)) return false;

        valueExists[val] = true;
        valueIndex[val] = valueList.length;
        valueList.push(val);
        return true;
    }

    function remove(address val) public returns(bool) {
        uint index;
        address lastVal;

        if (!exists(val)) return false;

        index = valueIndex[val];
        lastVal = valueList[valueList.length - 1];

        // remove val 
        delete valueExists[val];
        delete valueIndex[val];

        // replace it with last val
        valueList[index] = lastVal;
        valueIndex[lastVal] = index;
        valueList.length--;

        return true;
    }

    function exists(address val) public view returns(bool) {
        return valueExists[val];
    }

    function getValue(uint index) public view returns(address) {
        return valueList[index];
    }
}
