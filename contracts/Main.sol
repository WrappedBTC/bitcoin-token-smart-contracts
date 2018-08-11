pragma solidity ^0.4.24;

import './Withdrawable.sol';
import './WithdrawableOwner.sol';


interface WBTCProxyInterface {
    function setToken(WBTCTokenInterface _token) public;
}


interface WBTCTokenInterface {
    function burn(uint256 _value) public;
    function mint(address _to, uint256 _amount) public returns (bool);
    function pause() public;
    function unpause() public;
}


contract Main is Withdrawable, WithdrawableOwner {

    WBTCTokenInterface public token;
    WBTCProxyInterface public wbtcProxy;
    address public minter;
    address public burner;

    constructor(WBTCTokenInterface _token, WBTCProxyInterface _wbtcProxy, address _minter, address _burner) public {
        token = _token;
        wbtcProxy = _wbtcProxy;
        minter = _minter;
        burner = _burner;
    }

    modifier onlyMinter() {
        require(msg.sender == minter, "sender not authorized for minting.");
        _;
    }

    modifier onlyBurner() {
        require(msg.sender == burner, "sender not authorized for burning.");
        _;
    }

    // setters for this contract

    event TokenSet(WBTCTokenInterface token);

    function setToken(WBTCTokenInterface _token) public onlyOwner {
        token = _token;
        emit TokenSet(token);
    }

    event WBTCProxySet(WBTCProxyInterface wbtcProxy);

    function setWBTCProxy(WBTCProxyInterface _wbtcProxy) public onlyOwner {
        wbtcProxy = _wbtcProxy;
        emit WBTCProxySet(wbtcProxy);
    }

    event MinterSet(address burner);

    function setMinter(address _minter) public onlyOwner {
        minter = _minter;
        emit MinterSet(minter);
    }

    event BurnerSet(address burner);

    function setBurner(address _burner) public onlyOwner {
        burner = _burner;
        emit BurnerSet(burner);
    }

    // setters for proxy

    event WBTCProxyTokeSet(WBTCTokenInterface _token);

    function setWBTCProxyToken(WBTCTokenInterface _token) public onlyOwner {
        wbtcProxy.setToken(_token);
        emit WBTCProxyTokeSet(_token);
    }

    // onlyOwner actions on token

    event Paused();

    function pause() public onlyOwner {
        token.pause();
        emit Paused();
    }

    event UnPaused();

    function unpause() public onlyOwner {
        token.unpause();
        emit UnPaused();
    }

    // onlyMinter/Burner actions on token

    event Mint(address to, uint256 amount, bytes32 btcTxid);

    function mint(address to, uint256 amount, bytes32 btcTxid) public onlyMinter {
        //Yaron - require or return value?
        require(token.mint(to, amount), "minting failed.");
        emit Mint(to, amount, btcTxid);
    }

    event Burn(uint256 value, string btcDestAddress);

    function burn(uint256 value, string btcDestAddress) public onlyBurner {
        //Yaron - require or return value? (does not return anything)
        token.burn(value);
        emit Burn(value, btcDestAddress);
    }
}
