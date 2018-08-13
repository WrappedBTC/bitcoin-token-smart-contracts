pragma solidity 0.4.24;

import "./Withdrawable.sol";
import "./MainInterface.sol";
import "./WBTCTokenInterface.sol";
import "./WBTCProxyInterface.sol";


contract Burner is Withdrawable {

    MainInterface public main;
    WBTCProxyInterface public proxy;

    constructor(MainInterface _main, WBTCProxyInterface _proxy) public {
        require(_main != address(0), "bad address");
        require(_proxy != address(0), "bad address");
        
        main = _main;
        proxy = _proxy;
    }

    modifier onlyMerchant() {
        require(main.isMerchant(msg.sender), "sender not a merchant.");
        _;
    }

    event MainSet(MainInterface main);

    function setMain(MainInterface _main) external onlyOwner {
        require(_main != address(0), "bad address");
        main = _main;
        emit MainSet(main);
    }

    event WBTCProxySet(WBTCProxyInterface proxy);

    function setWBTCProxy(WBTCProxyInterface _proxy) external onlyOwner {
        require(_proxy != address(0), "bad address");
        proxy = _proxy;
        emit WBTCProxySet(proxy);
    }

    event Burned(uint value, string btcDestAddress);

    function burn(uint value, string btcDestAddress) external onlyMerchant returns (bool) {
        require(proxy.transferFrom(msg.sender, main, value), "trasnfer of tokens to burn failed");
        require(main.burn(value), "burn failed");
        emit Burned(value, btcDestAddress);
    }
}
