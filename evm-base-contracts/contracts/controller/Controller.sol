pragma solidity 0.4.24;

import "../utils/OwnableContract.sol";
import "../utils/OwnableContractOwner.sol";
import "./ControllerInterface.sol";
import "../factory/MembersInterface.sol";
import "../token/WrappedToken.sol";


contract Controller is ControllerInterface, OwnableContract, OwnableContractOwner {

    WrappedToken public token;
    MembersInterface public members;
    address public factory;

    constructor(WrappedToken _token) public {
        require(_token != address(0), "invalid _token address");
        token = _token;
    }

    modifier onlyFactory() {
        require(msg.sender == factory, "sender not authorized for minting or burning.");
        _;
    }

    // setters
    event MembersSet(MembersInterface indexed members);

    function setMembers(MembersInterface _members) external onlyOwner returns (bool) {
        require(_members != address(0), "invalid _members address");
        members = _members;
        emit MembersSet(members);
        return true;
    }

    event FactorySet(address indexed factory);

    function setFactory(address _factory) external onlyOwner returns (bool) {
        require(_factory != address(0), "invalid _factory address");
        factory = _factory;
        emit FactorySet(factory);
        return true;
    }

    // only owner actions on token
    event Paused();

    function pause() external onlyOwner returns (bool) {
        token.pause();
        emit Paused();
        return true;
    }

    event Unpaused();

    function unpause() external onlyOwner returns (bool) {
        token.unpause();
        emit Unpaused();
        return true;
    }

    // only factory actions on token
    function mint(address to, uint amount) external onlyFactory returns (bool) {
        require(to != address(0), "invalid to address");
        require(!token.paused(), "token is paused.");
        require(token.mint(to, amount), "minting failed.");
        return true;
    }

    function burn(uint value) external onlyFactory returns (bool) {
        require(!token.paused(), "token is paused.");
        token.burn(value);
        return true;
    }

    // all accessible
    function isCustodian(address addr) external view returns (bool) {
        return members.isCustodian(addr);
    }

    function isMerchant(address addr) external view returns (bool) {
        return members.isMerchant(addr);
    }

    function getToken() external view returns (ERC20) {
        return token;
    }

    // overriding
    function renounceOwnership() public onlyOwner {
        revert("renouncing ownership is blocked.");
    }
}
