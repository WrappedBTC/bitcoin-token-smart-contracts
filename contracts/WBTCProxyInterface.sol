pragma solidity 0.4.24;


import "./WBTCTokenInterface.sol";


interface WBTCProxyInterface {
    function transfer(address to, uint value) external returns (bool);
    function approve(address spender, uint value) external returns (bool);
    function transferFrom(address from, address to, uint value) external returns (bool);
    function totalSupply() external view returns (uint);
    function name() external view returns (string);
    function symbol() external view returns (string);
    function decimals() external view returns (uint8);
    function balanceOf(address who) external view returns (uint);
    function allowance(address owner, address spender) external view returns (uint);
    function increaseApproval(address spender, uint256 addedValue) external returns (bool);
    function decreaseApproval(address spender, uint256 subtractedValue) external returns (bool);
    function setToken(WBTCTokenInterface token) external;
    function getToken() external view returns (WBTCTokenInterface);
}