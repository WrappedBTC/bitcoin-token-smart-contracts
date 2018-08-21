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
        uint indexed nonce,
        address indexed from,
        uint amount,
        string btcDepositAdress,
        string btcTxid,
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

        emit MintRequestAdd(nonce, msg.sender, amount, btcDepositAdress, btcTxid, timestamp, requestHash);
    }

    event Burned(
        uint indexed nonce,
        address indexed from,
        uint amount,
        string btcDepositAddress,
        uint timestamp,
        bytes32 requestHash
    );

    function burn(uint amount) external onlyMerchant returns (bool) {
        uint nonce = burnRequests.length;
        uint timestamp = now;
        string memory btcDepositAddress = merchantBtcDepositAddress[msg.sender];
        string memory btcTxid = ""; // set txid as empty since it is not known yet

        Request memory request =
            Request(msg.sender, amount, btcDepositAddress, btcTxid, nonce, timestamp, RequestStatus.PENDING);
        bytes32 requestHash = calcRequestHash(request);
        burnRequestNonce[requestHash] = nonce; 
        burnRequests.push(request);

        require(controller.getToken().transferFrom(msg.sender, controller, amount), "trasnfer tokens to burn failed");
        require(controller.burn(amount), "burn failed");

        emit Burned(nonce, msg.sender, amount, btcDepositAddress, timestamp, requestHash);
    }
    /* solhint-disable not-rely-on-time */

    function confirmMintRequest(bytes32 requestHash) external onlyCustodian {
        confirmOrRejectMintRequest(requestHash, true);
    }

    function rejectMintRequest(bytes32 requestHash) external onlyCustodian {
        confirmOrRejectMintRequest(requestHash, false);
    }

    event BurnConfirmed(
        uint indexed nonce,
        address indexed from,
        uint amount,
        string btcDepositAddress,
        string btcTxid,
        uint timestamp,
        bytes32 inputRequestHash
    );

    function confirmBurnRequest(bytes32 requestHash, string btcTxid) external onlyCustodian {
        require(requestHash != 0, "request hash is 0");
        uint nonce = burnRequestNonce[requestHash];
        Request memory request = burnRequests[nonce];

        require(request.status == RequestStatus.PENDING, "request is not pending");
        validateRequestHash(request, requestHash);

        burnRequests[nonce].btcTxid = btcTxid;
        burnRequests[nonce].status = RequestStatus.APPROVED;
        burnRequestNonce[calcRequestHash(burnRequests[nonce])] = nonce;

        string memory btcDepositAddress = merchantBtcDepositAddress[request.from];

        emit BurnConfirmed(
            request.nonce, request.from, request.amount, btcDepositAddress, btcTxid, request.timestamp, requestHash
        );
    }

    event MintRequestCancel(uint indexed nonce, address indexed from, bytes32 requestHash);

    function cancelMintRequest(bytes32 requestHash) external onlyMerchant {
        require(requestHash != 0, "request hash is 0");
        uint nonce = mintRequestNonce[requestHash];
        Request storage request = mintRequests[nonce];

        require(request.status == RequestStatus.PENDING, "request is not pending");
        require(msg.sender == request.from, "cancel sender is different than pending request initiator");
        validateRequestHash(request, requestHash);

        request.status = RequestStatus.CANCELED;

        emit MintRequestCancel(nonce, msg.sender, requestHash);
    }

    function getMintRequest(uint nonce)
    public
    view
    returns(
        uint requestNonce,
        address from,
        uint amount,
        string btcDestAddress,
        string btcTxid,
        uint timestamp,
        string status,
        bytes32 requestHash
    )
    {
        Request memory request = mintRequests[nonce];
        string memory statusString = getStatusString(request.status); 
        return (
            request.nonce,
            request.from,
            request.amount,
            request.btcDepositAddress,
            request.btcTxid,
            request.timestamp,
            statusString,
            calcRequestHash(request)
        );
    }

    function getBurnRequest(uint nonce)
    public
    view
    returns(
        uint requestNonce,
        address from,
        uint amount,
        string btcDepositAddress,
        string btcTxid,
        uint timestamp,
        string status,
        bytes32 requestHash
    )
    {
        Request storage request = burnRequests[nonce];
        string memory statusString = getStatusString(request.status); 
        return (
            request.nonce,
            request.from,
            request.amount,
            request.btcDepositAddress,
            request.btcTxid,
            request.timestamp,
            statusString,
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

    event MintConfirmed(
        uint indexed nonce,
        address indexed from,
        bool confirm,
        uint amount,
        string btcDepositAddress,
        string btcTxid,
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
            request.nonce,
            request.from,
            confirm,
            request.amount,
            request.btcDepositAddress,
            request.btcTxid,
            request.timestamp,
            requestHash
        );
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

    function getStatusString(RequestStatus status) internal pure returns (string) {
        if (status == RequestStatus.PENDING) {
            return "pending";
        } else if (status == RequestStatus.CANCELED) {
            return "canceled";
        } else if (status == RequestStatus.APPROVED) {
            return "approved";
        } else if (status == RequestStatus.REJECTED) {
            return "rejected";
        }
    }
}
