pragma solidity 0.4.24;


import "../token/WBTCInterface.sol";


interface ControllerInterface {
    function mint(address to, uint amount) external returns (bool);
    function burn(uint value) external returns (bool);
    function isCustodian(address addr) external view returns (bool);
    function isMerchant(address addr) external view returns (bool);
    function getWBTC() external view returns (WBTCInterface);
}
