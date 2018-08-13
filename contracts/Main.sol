pragma solidity 0.4.24;

import "./Withdrawable.sol";
import "./WithdrawableOwner.sol";
import "./WBTCTokenInterface.sol";
import "./MainInterface.sol";
import "./RolesInterface.sol";
import "./WBTCProxyInterface.sol";


contract Main is MainInterface, Withdrawable, WithdrawableOwner {

    WBTCTokenInterface public token;
    WBTCProxyInterface public wbtcProxy;
    RolesInterface public roles;
    address public minter;
    address public burner;

    constructor(
        WBTCTokenInterface _token,
        WBTCProxyInterface _wbtcProxy,
        RolesInterface _roles, 
        address _minter,
        address _burner 
    )
    public {
        require(_token != address(0), "bad address");
        require(_wbtcProxy != address(0), "bad address");
        require(_roles != address(0), "bad address");
        require(_minter != address(0), "bad address");
        require(_burner != address(0), "bad address");

        token = _token;
        wbtcProxy = _wbtcProxy;
        roles = _roles;
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

    function setToken(WBTCTokenInterface _token) external onlyOwner {
        require(_token != address(0), "bad address");
        token = _token;
        wbtcProxy.setToken(_token);
        emit TokenSet(token);
    }

    event WBTCProxySet(WBTCProxyInterface wbtcProxy);

    function setWBTCProxy(WBTCProxyInterface _wbtcProxy) external onlyOwner {
        require(_wbtcProxy != address(0), "bad address");
        wbtcProxy = _wbtcProxy;
        emit WBTCProxySet(wbtcProxy);
    }

    event RolesSet(RolesInterface roles);

    function setRoles(RolesInterface _roles) external onlyOwner {
        require(_roles != address(0), "bad address");
        roles = _roles;
        emit RolesSet(roles);
    }

    event MinterSet(address minter);

    function setMinter(address _minter) external onlyOwner {
        require(_minter != address(0), "bad address");
        minter = _minter;
        emit MinterSet(minter);
    }

    event BurnerSet(address burner);

    function setBurner(address _burner) external onlyOwner {
        require(_burner != address(0), "bad address");
        burner = _burner;
        emit BurnerSet(burner);
    }

    // onlyOwner actions on token
    event Paused();

    function pause() external onlyOwner {
        token.pause();
        emit Paused();
    }

    event UnPaused();

    function unpause() external onlyOwner {
        token.unpause();
        emit UnPaused();
    }

    // onlyMinter/Burner actions on token
    function mint(address to, uint amount) external onlyMinter returns (bool) {
        require(to != address(0), "bad address");
        require(token.mint(to, amount), "minting failed.");
        return true;
    }

    function burn(uint value) external onlyBurner returns (bool) {
        token.burn(value);
        return true;
    }

    // all accessible
    function isCustodian(address val) external view returns(bool) {
        return roles.isCustodian(val);
    }

    function isMerchant(address val) external view returns(bool) {
        return roles.isMerchant(val);
    }
}
