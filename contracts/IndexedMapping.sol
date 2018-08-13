pragma solidity 0.4.24;


contract IndexedMapping {

    mapping(address=>bool) public valueExists;
    mapping(address=>uint) public valueIndex;
    address[] public valueList;
    uint public length;

    function add(address val) public returns(bool) {
        if (valueExists[val]) return false;

        valueExists[val] = true;
        valueList[length] = val;
        valueIndex[val] = length;
        length++;
        return true;
    }

    function remove(address val) public returns(bool) {
        uint index;

        if (!valueExists[val]) return false;
        valueExists[val] = false;

        index = valueIndex[val];
        if (length > 1) {
            // list has more than 1 item.
            valueList[index] = valueList[length];
            valueIndex[val] = length;
        } else {
            // list has a single item.
            valueList[index] = 0;
            valueIndex[val] = 0;
        }

        length--;
        return true;
    }

    function exists(address val) public view returns(bool) {
        return valueExists[val];
    }

    function getAddress(uint index) public view returns(address) {
        return valueList[index];
    }
}
