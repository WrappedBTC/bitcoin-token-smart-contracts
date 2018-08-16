pragma solidity 0.4.24;


import "../utils/Withdrawable.sol";
import "../utils/WithdrawableOwner.sol";
import "../controller/ControllerInterface.sol";
import "../token/TokenImpInterface.sol";
import "../token/TokenInterface.sol";
import "../factory/MembersInterface.sol";


contract Controller is ControllerInterface, Withdrawable, WithdrawableOwner {

    TokenInterface public token;
    MembersInterface public members;
    address public factory;

    constructor(TokenInterface _token) public {
        require(_token != address(0), "invalid _tokens address");
        token = _token;
    }

    modifier onlyFactory() {
        require(msg.sender == factory, "sender not authorized for minting or burning.");
        _;
    }

    // setters
    event TokenSet(TokenInterface _token);

    function setToken(TokenInterface _token) external onlyOwner {
        require(_token != address(0), "invalid _token address");
        token = _token;
        emit TokenSet(_token);
    }

    event TokenImpSet(TokenImpInterface tokenImp);

    function setTokenImp(TokenImpInterface _tokenImp) external onlyOwner {
        require(_tokenImp != address(0), "invalid _tokenImp address");
        token.setTokenImp(_tokenImp);
        emit TokenImpSet(_tokenImp);
    }

    event MembersSet(MembersInterface members);

    function setMembers(MembersInterface _members) external onlyOwner {
        require(_members != address(0), "invalid _members address");
        members = _members;
        emit MembersSet(members);
    }

    event FactorySet(address minter);

    function setFactory(address _factory) external onlyOwner {
        require(_factory != address(0), "invalid _factory address");
        factory = _factory;
        emit FactorySet(factory);
    }

    // onlyOwner actions on token
    event Paused();

    function pause() external onlyOwner {
        token.getTokenImp().pause();
        emit Paused();
    }

    event UnPaused();

    function unpause() external onlyOwner {
        token.getTokenImp().unpause();
        emit UnPaused();
    }

    // only Minter/Burner actions on token
    function mint(address to, uint amount) external onlyFactory returns (bool) {
        require(to != address(0), "bad address");
        require(token.getTokenImp().mint(to, amount), "minting failed.");
        return true;
    }

    function burn(uint value) external onlyFactory returns (bool) {
        token.getTokenImp().burn(value);
        return true;
    }

    // all accessible
    function isCustodian(address val) external view returns(bool) {
        return members.isCustodian(val);
    }

    function isMerchant(address val) external view returns(bool) {
        return members.isMerchant(val);
    }

    function getToken() external view returns(TokenInterface) {
        return token;
    }
}
