pragma solidity 0.4.24;


interface MembersInterface {
    function setCustodian(address _custodian) external returns (bool);
    function addMerchant(address merchant) external returns (bool);
    function removeMerchant(address merchant) external returns (bool);
    function isCustodian(address addr) external view returns (bool);
    function isMerchant(address addr) external view returns (bool);
}
