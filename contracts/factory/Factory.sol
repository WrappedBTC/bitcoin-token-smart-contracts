pragma solidity 0.4.24;


import "../utils/Withdrawable.sol";
import "../controller/ControllerInterface.sol";


contract Factory is Withdrawable {

    enum RequestStatus {PENDING, CANCELED, APPROVED, REJECTED}

    struct Request {
        address from; // sender of the request.
        uint amount;
        string btcDepositAddress; // custodian's btc address in mint, merchant's btc address for burn. 
        string btcTxid;
        uint nonce;
        uint timestamp;
        RequestStatus status;
    }

    ControllerInterface public controller;
    mapping(address=>string) public custodianBtcDepositAddress;
    mapping(address=>string) public merchantBtcDepositAddress;
    mapping(bytes32=>uint) public mintRequestNonce;
    mapping(bytes32=>uint) public burnRequestNonce;
    Request[] public mintRequests;
    Request[] public burnRequests;

    constructor(ControllerInterface _controller) public {
        require(_controller != address(0), "invalid _controller address");
        controller = _controller;
    }

    modifier onlyMerchant() {
        require(controller.isMerchant(msg.sender), "sender not a merchant.");
        _;
    }

    modifier onlyCustodian() {
        require(controller.isCustodian(msg.sender), "sender not a custodian.");
        _;
    }

    event ControllerSet(ControllerInterface controller);

    function setController(ControllerInterface _controller) external onlyOwner {
        require(_controller != address(0), "invalid _controller address");
        controller = _controller;
        emit ControllerSet(controller);
    }

    event CustodianBtcDepositAddressSet(address merchant, string btcDepositAdress);

    function setCustodianBtcDepositAddress(address merchant, string btcDepositAdress) external onlyCustodian {
        require(merchant != 0, "merchant address is 0");
        require(nonEmptyString(btcDepositAdress), "invalid btc deposit address");

        custodianBtcDepositAddress[merchant] = btcDepositAdress;
        emit CustodianBtcDepositAddressSet(merchant, btcDepositAdress); 
    }

    event MerchantBtcDepositAddressSet(address merchant, string btcDepositAdress);

    function setMerchantBtcDepositAddress(string btcDepositAdress) external onlyMerchant {
        require(nonEmptyString(btcDepositAdress), "invalid btc deposit address");

        merchantBtcDepositAddress[msg.sender] = btcDepositAdress;
        emit MerchantBtcDepositAddressSet(msg.sender, btcDepositAdress); 
    }

    /* solhint-disable not-rely-on-time */
    event MintRequestAdd(
        address from,
        uint amount,
        string btcDepositAdress,
        string btcTxid,
        uint nonce,
        uint timestamp,
        bytes32 requestHash
    );

    function addMintRequest(uint amount, string btcTxid, string btcDepositAdress) external onlyMerchant {
        require(nonEmptyString(btcDepositAdress), "invalid btc deposit address"); 
        require(compareStrings(btcDepositAdress, custodianBtcDepositAddress[msg.sender]), "btc deposit address wrong");

        uint nonce = mintRequests.length;
        uint timestamp = now;

        Request memory request =
            Request(msg.sender, amount, btcDepositAdress, btcTxid, nonce, timestamp, RequestStatus.PENDING);
        bytes32 requestHash = calcRequestHash(request);
        mintRequestNonce[requestHash] = nonce; 
        mintRequests.push(request);

        emit MintRequestAdd(msg.sender, amount, btcDepositAdress, btcTxid, nonce, timestamp, requestHash);
    }

    event Burned(address from, uint amount, string btcDepositAddress, uint nonce, uint timestamp, bytes32 requestHash);

    function burn(uint amount) external onlyMerchant returns (bool) {
        uint nonce = burnRequests.length;
        uint timestamp = now;
        string memory btcDepositAddress = merchantBtcDepositAddress[msg.sender];
        string memory btcTxid = ""; // set txid as empty since it is not known yet

        Request memory request = Request(msg.sender, amount, btcDepositAddress, btcTxid, nonce, timestamp, RequestStatus.PENDING);
        bytes32 requestHash = calcRequestHash(request);
        burnRequestNonce[requestHash] = nonce; 
        burnRequests.push(request);

        require(controller.getToken().transferFrom(msg.sender, controller, amount), "trasnfer tokens to burn failed");
        require(controller.burn(amount), "burn failed");
        emit Burned(msg.sender, amount, btcDepositAddress, nonce, timestamp, requestHash);

    }
    /* solhint-disable not-rely-on-time */

    function confirmMintRequest(bytes32 requestHash) external onlyCustodian {
        confirmOrRejectMintRequest(requestHash, true);
    }

    function rejectMintRequest(bytes32 requestHash) external onlyCustodian {
        confirmOrRejectMintRequest(requestHash, false);
    }

    event BurnConfirmed(
        address from,
        uint amount,
        string btcDepositAddress,
        string btcTxid,
        uint nonce,
        uint timestamp,
        bytes32 requestHash
    );

    function confirmBurnRequest(bytes32 requestHash, string btcTxid) external onlyCustodian {
        require(requestHash != 0, "request hash is 0");
        uint nonce = burnRequestNonce[requestHash];
        Request memory request = burnRequests[nonce];

        require(request.status == RequestStatus.PENDING, "request is not pending");
        validateRequestHash(request, requestHash);

        burnRequests[nonce].btcTxid = btcTxid;
        burnRequests[nonce].status = RequestStatus.APPROVED; 

        string memory btcDepositAddress = merchantBtcDepositAddress[request.from];
        emit BurnConfirmed(request.from, request.amount, btcDepositAddress, btcTxid, request.nonce, request.timestamp, requestHash);
    }

    event MintRequestCancel(address from, uint nonce, bytes32 requestHash);

    function cancelMintRequest(bytes32 requestHash) external onlyMerchant {
        require(requestHash != 0, "request hash is 0");
        uint nonce = mintRequestNonce[requestHash];
        Request storage request = mintRequests[nonce];

        require(request.status == RequestStatus.PENDING, "request is not pending");
        require(msg.sender == request.from, "cancel sender is different than pending request initiator");
        validateRequestHash(request, requestHash);

        request.status = RequestStatus.CANCELED;
        emit MintRequestCancel(msg.sender, nonce, requestHash);
    }

    function getMintRequest(uint nonce)
    public
    view
    returns(
        address from,
        uint amount,
        string btcDestAddress,
        string btcTxid,
        uint requestNonce,
        uint timestamp,
        RequestStatus status,
        bytes32 requestHash
    )
    {
        Request memory request = mintRequests[nonce];
        return (
            request.from,
            request.amount,
            request.btcDepositAddress,
            request.btcTxid,
            request.nonce,
            request.timestamp,
            request.status,
            calcRequestHash(request)
        );
    }

    function getBurnRequest(uint nonce)
    public
    view
    returns(
        address from,
        uint amount,
        string btcDepositAddress,
        string btcTxid,
        uint requestNonce,
        uint timestamp,
        RequestStatus status,
        bytes32 requestHash
    )
    {
        Request storage request = burnRequests[nonce];
        return (
            request.from,
            request.amount,
            request.btcDepositAddress,
            request.btcTxid,
            request.nonce,
            request.timestamp,
            request.status,
            calcRequestHash(request)
        );
    }

    function getMintRequestsLength() public view returns (uint length) {
        return mintRequests.length;
    }

    function getBurnRequestsLength() public view returns (uint length) {
        return burnRequests.length;
    }

    function compareStrings (string a, string b) public pure returns (bool) {
        return (keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b)));
    }

    function nonEmptyString (string a) public pure returns (bool) {
        return (!compareStrings(a, ""));
    }

    function validateRequestHash(Request request, bytes32 requestHash) internal pure {
        bytes32 calculatedHash = calcRequestHash(request);
        require(requestHash == calculatedHash, "given request hash is different than hash of stored request.");
    }

    function calcRequestHash(Request request) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            request.from,
            request.amount,
            request.btcDepositAddress,
            request.btcTxid,
            request.nonce,
            request.timestamp,
            request.status
        ));
    }

    event MintConfirmed(
        bool confirm,
        address from,
        uint amount,
        string btcDepositAddress,
        string btcTxid,
        uint nonce,
        uint timestamp,
        bytes32 requestHash
    );

    function confirmOrRejectMintRequest(bytes32 requestHash, bool confirm) internal {
        require(requestHash != 0, "request hash is 0");
        uint nonce = mintRequestNonce[requestHash];
        Request memory request = mintRequests[nonce];

        require(request.status == RequestStatus.PENDING, "request is not pending");
        validateRequestHash(request, requestHash);

        if (confirm) {
            mintRequests[nonce].status = RequestStatus.APPROVED;
            require(controller.mint(request.from, request.amount), "mint failed");
        } else {
            mintRequests[nonce].status = RequestStatus.REJECTED;
        }

        emit MintConfirmed(
            confirm,
            request.from,
            request.amount,
            request.btcDepositAddress,
            request.btcTxid,
            request.nonce,
            request.timestamp,
            requestHash
        );
    }
}
