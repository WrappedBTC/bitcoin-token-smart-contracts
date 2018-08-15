pragma solidity 0.4.24;


import "../utils/Withdrawable.sol";
import "../controller/WithdrawableOwner.sol";
import "../controller/ControllerInterface.sol";
import "../token/TokenImpInterface.sol";
import "../token/TokenInterface.sol";
import "../factory/MembersInterface.sol";


contract Controller is ControllerInterface, Withdrawable, WithdrawableOwner {

    TokenInterface public token;
    MembersInterface public members;
    address public minter;
    address public burner;

    constructor(
        TokenInterface _token,
        MembersInterface _members, 
        address _minter,
        address _burner 
    )
    public {
        require(_token != address(0), "invalid _tokens address");
        require(_members != address(0), "invalid _members address");
        require(_minter != address(0), "invalid _minter address");
        require(_burner != address(0), "invaild _burner address");

        token = _token;
        members = _members;
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

    // setters
    event TokenSet(TokenInterface _token, TokenImpInterface tokenImp);

    function setToken(TokenInterface _token, TokenImpInterface _tokenImp) external onlyOwner {
        require(_token != address(0), "invalid _token address");
        require(_tokenImp != address(0), "invalid _tokenImp address");
        token = _token;
        token.setTokenImp(_tokenImp);
        emit TokenSet(_token, _tokenImp);
    }

    event MembersSet(MembersInterface members);

    function setMembers(MembersInterface _members) external onlyOwner {
        require(_members != address(0), "invalid _members address");
        members = _members;
        emit MembersSet(members);
    }

    event MinterSet(address minter);

    function setMinter(address _minter) external onlyOwner {
        require(_minter != address(0), "invalid _minter address");
        minter = _minter;
        emit MinterSet(minter);
    }

    event BurnerSet(address burner);

    function setBurner(address _burner) external onlyOwner {
        require(_burner != address(0), "invalid _burner address");
        burner = _burner;
        emit BurnerSet(burner);
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
    function mint(address to, uint amount) external onlyMinter returns (bool) {
        require(to != address(0), "bad address");
        require(token.getTokenImp().mint(to, amount), "minting failed.");
        return true;
    }

    function burn(uint value) external onlyBurner returns (bool) {
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
