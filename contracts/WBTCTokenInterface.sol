pragma solidity 0.4.24;


interface WBTCTokenInterface {
    function burn(uint value) external;
    function mint(address to, uint amount) external returns (bool);
    function pause() external;
    function unpause() external;
}
