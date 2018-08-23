pragma solidity 0.4.24;


interface MembersInterface {
    function addCustodian(address custodian) external;
    function removeCustodian(address custodian) external;
    function addMerchant(address merchant) external;
    function removeMerchant(address merchant) external;
    function isCustodian(address addr) external view returns(bool);
    function isMerchant(address addr) external view returns(bool);
}