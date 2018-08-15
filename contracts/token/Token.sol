pragma solidity 0.4.24;


import "../token/TokenImp.sol";


contract Token is Withdrawable {

    TokenImp public tokenImp;

    constructor(TokenImp _tokenImp) public {
        require(_tokenImp != address(0), "invalid _tokenImp address");
        tokenImp = _tokenImp;
    }

    function getTokenImp() public view returns (address) {
        return tokenImp;
    }

    event TokenSet(TokenImp tokenImp);

    function setTokenImp(TokenImp _tokenImp) public onlyOwner {
        require(_tokenImp != address(0), "invalid _tokenImp address");
        tokenImp = _tokenImp;
        emit TokenSet(tokenImp);
    }

    function totalSupply() public view returns (uint) {
        return tokenImp.totalSupply();
    }

    function name() public view returns (string) {
        return tokenImp.name();
    }

    function symbol() public view returns (string) {
        return tokenImp.symbol();
    }

    function decimals() public view returns (uint8) {
        return tokenImp.decimals();
    }

    function balanceOf(address who) public view returns (uint) {
        return tokenImp.balanceOf(who);
    }

    function allowance(address owner, address spender) public view returns (uint) {
        return tokenImp.allowance(owner, spender);
    }

    function transfer(address to, uint value) public returns (bool) {
        return tokenImp.transfer(to, value);
    }

    function approve(address spender, uint value) public returns (bool) {
        return tokenImp.approve(spender, value);
    }

    function transferFrom(address from, address to, uint value) public returns (bool) {
        return tokenImp.transferFrom(from, to, value);
    }

    function increaseApproval(address spender, uint256 addedValue) public returns (bool) {
        return tokenImp.increaseApproval(spender, addedValue);
    }

    function decreaseApproval(address spender, uint256 subtractedValue) public returns (bool) {
        return tokenImp.decreaseApproval(spender, subtractedValue);
    }
}
