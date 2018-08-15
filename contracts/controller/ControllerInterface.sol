pragma solidity 0.4.24;


import "../token/TokenInterface.sol";


interface ControllerInterface {
    function mint(address to, uint amount) external returns (bool);
    function burn(uint value) external returns (bool);
    function isCustodian(address val) external view returns(bool);
    function isMerchant(address val) external view returns(bool);
    function getToken() external view returns(TokenInterface);
}
