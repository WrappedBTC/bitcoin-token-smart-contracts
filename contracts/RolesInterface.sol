pragma solidity 0.4.24;


interface RolesInterface {
    function isCustodian(address val) external view returns(bool);
    function isMerchant(address val) external view returns(bool);
}