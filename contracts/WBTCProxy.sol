pragma solidity 0.4.24;

import "./WBTCToken.sol";


contract WBTCProxy is Withdrawable {

    WBTCToken public token;

    constructor(WBTCToken _token) public {
        require(_token != address(0), "bad address");
        token = _token;
    }

    function getToken() public view returns (address) {
        return token;
    }

    event TokenSet(WBTCToken token);

    function setToken(WBTCToken _token) public onlyOwner {
        require(_token != address(0), "bad address");
        token = _token;
        emit TokenSet(token);
    }

    function totalSupply() public view returns (uint) {
        return token.totalSupply();
    }

    function name() public view returns (string) {
        return token.name();
    }

    function symbol() public view returns (string) {
        return token.symbol();
    }

    function decimals() public view returns (uint8) {
        return token.decimals();
    }

    function balanceOf(address who) public view returns (uint) {
        return token.balanceOf(who);
    }

    function allowance(address owner, address spender) public view returns (uint) {
        return token.allowance(owner, spender);
    }

    function transfer(address to, uint value) public returns (bool) {
        return token.transfer(to, value);
    }

    function approve(address spender, uint value) public returns (bool) {
        return token.approve(spender, value);
    }

    function transferFrom(address from, address to, uint value) public returns (bool) {
        return token.transferFrom(from, to, value);
    }

    function increaseApproval(address spender, uint256 addedValue) public returns (bool) {
        return token.increaseApproval(spender, addedValue);
    }

    function decreaseApproval(address spender, uint256 subtractedValue) public returns (bool) {
        return token.decreaseApproval(spender, subtractedValue);
    }
}
