pragma solidity 0.4.24;


interface MembersInterface {
    function addCustodian(address custodian, bool add) external;
    function addMerchant(address merchant, bool add) external;
    function isCustodian(address val) external view returns(bool);
    function isMerchant(address val) external view returns(bool);
}