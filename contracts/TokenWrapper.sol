pragma solidity ^0.4.24;

import 'openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol';
import 'openzeppelin-solidity/contracts/ownership/Claimable.sol';


contract tokenWrapper is Claimable {

    DetailedERC20 token;

    constructor(DetailedERC20 _token) public {
        token = _token;
    }

    event TokenSet(DetailedERC20 token);

    function setToken(DetailedERC20 _token) public onlyOwner {
        token = _token;
        emit TokenSet(token);
    }

    function totalSupply() public view returns (uint256) {
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

    function balanceOf(address _who) public view returns (uint256) {
        return token.balanceOf(_who);
    }

    function allowance(address _owner, address _spender) public view returns (uint256) {
        return token.allowance(_owner, _spender);
    }

    function transfer(address _to, uint256 _value) public returns (bool) {
        return token.transfer(_to, _value);
    }

    function approve(address _spender, uint256 _value) public returns (bool) {
        return token.approve(_spender, _value);
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
        return token.transferFrom(_from, _to, _value);
    }
}
