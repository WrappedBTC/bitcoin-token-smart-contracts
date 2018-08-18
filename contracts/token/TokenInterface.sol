pragma solidity 0.4.24;


interface TokenInterface {
    function burn(uint value) external;
    function mint(address to, uint amount) external returns (bool);
    function pause() external;
    function unpause() external;
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}
