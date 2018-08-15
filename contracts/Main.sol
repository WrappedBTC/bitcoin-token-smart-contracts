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
        WBTCProxyInterface _wbtcProxy,
        RolesInterface _roles, 
        address _minter,
        address _burner 
    )
    public {
        require(_wbtcProxy != address(0), "bad address");
        require(_roles != address(0), "bad address");
        require(_minter != address(0), "bad address");
        require(_burner != address(0), "bad address");

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

    // onlyOwner actions on roles
    function addCustodian(address custodian, bool add) external onlyOwner {
        roles.addCustodian(custodian, add);
    }

    function addMerchant(address merchant, bool add) external onlyOwner {
        roles.addMerchant(merchant, add);
    } 

    // onlyOwner actions on token
    event Paused();

    function pause() external onlyOwner {
        wbtcProxy.getToken().pause();
        emit Paused();
    }

    event UnPaused();

    function unpause() external onlyOwner {
        wbtcProxy.getToken().unpause();
        emit UnPaused();
    }

    // onlyMinter/Burner actions on token
    function mint(address to, uint amount) external onlyMinter returns (bool) {
        require(to != address(0), "bad address");
        require(wbtcProxy.getToken().mint(to, amount), "minting failed.");
        return true;
    }

    function burn(uint value) external onlyBurner returns (bool) {
        wbtcProxy.getToken().burn(value);
        return true;
    }

    // all accessible
    function isCustodian(address val) external view returns(bool) {
        return roles.isCustodian(val);
    }

    function isMerchant(address val) external view returns(bool) {
        return roles.isMerchant(val);
    }

    function getProxy() external view returns(WBTCProxyInterface) {
        return wbtcProxy;
    }
}
