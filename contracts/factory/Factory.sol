pragma solidity 0.4.24;

import "../utils/OwnableContract.sol";
import "../controller/ControllerInterface.sol";


contract Factory is OwnableContract {

    enum RequestStatus {PENDING, CANCELED, APPROVED, REJECTED}

    struct Request {
        address requester; // sender of the request.
        uint amount; // amount of wbtc to mint/burn.
        string btcDepositAddress; // custodian's btc address in mint, merchant's btc address in burn.
        string btcTxid; // bitcoin txid for sending/redeeming btc in the mint/burn process.
        uint nonce; // serial number allocated for each request.
        uint timestamp; // time of the request creation.
        RequestStatus status; // status of the request.
    }

    ControllerInterface public controller;

    // mapping between merchant to the corresponding custodian deposit address, used in the minting process.
    // by using a different deposit address per merchant the custodian can identify which merchant deposited.
    mapping(address=>string) public custodianBtcDepositAddress;

    // mapping between merchant to the its deposit address where btc should be moved to, used in the burning process.
    mapping(address=>string) public merchantBtcDepositAddress;

    // mapping between a mint request hash and the corresponding request nonce. 
    mapping(bytes32=>uint) public mintRequestNonce;

    // mapping between a burn request hash and the corresponding request nonce.
    mapping(bytes32=>uint) public burnRequestNonce;

    Request[] public mintRequests;
    Request[] public burnRequests;

    constructor(ControllerInterface _controller) public {
        require(_controller != address(0), "invalid _controller address");
        controller = _controller;
        owner = _controller;
    }

    modifier onlyMerchant() {
        require(controller.isMerchant(msg.sender), "sender not a merchant.");
        _;
    }

    modifier onlyCustodian() {
        require(controller.isCustodian(msg.sender), "sender not a custodian.");
        _;
    }

    event CustodianBtcDepositAddressSet(address indexed merchant, address indexed sender, string btcDepositAddress);

    function setCustodianBtcDepositAddress(
        address merchant,
        string btcDepositAddress
    )
        external
        onlyCustodian
        returns (bool) 
    {
        require(merchant != 0, "invalid merchant address");
        require(controller.isMerchant(merchant), "merchant address is not a real merchant.");
        require(!isEmptyString(btcDepositAddress), "invalid btc deposit address");

        custodianBtcDepositAddress[merchant] = btcDepositAddress;
        emit CustodianBtcDepositAddressSet(merchant, msg.sender, btcDepositAddress);
        return true;
    }

    event MerchantBtcDepositAddressSet(address indexed merchant, string btcDepositAddress);

    function setMerchantBtcDepositAddress(string btcDepositAddress) external onlyMerchant returns (bool) {
        require(!isEmptyString(btcDepositAddress), "invalid btc deposit address");

        merchantBtcDepositAddress[msg.sender] = btcDepositAddress;
        emit MerchantBtcDepositAddressSet(msg.sender, btcDepositAddress);
        return true; 
    }

    event MintRequestAdd(
        uint indexed nonce,
        address indexed requester,
        uint amount,
        string btcDepositAddress,
        string btcTxid,
        uint timestamp,
        bytes32 requestHash
    );

    function addMintRequest(
        uint amount,
        string btcTxid,
        string btcDepositAddress
    )
        external
        onlyMerchant
        returns (bool)
    {
        require(!isEmptyString(btcDepositAddress), "invalid btc deposit address"); 
        require(compareStrings(btcDepositAddress, custodianBtcDepositAddress[msg.sender]), "wrong btc deposit address");

        uint nonce = mintRequests.length;
        uint timestamp = getTimestamp();

        Request memory request = Request({
            requester: msg.sender,
            amount: amount,
            btcDepositAddress: btcDepositAddress,
            btcTxid: btcTxid,
            nonce: nonce,
            timestamp: timestamp,
            status: RequestStatus.PENDING
        });

        bytes32 requestHash = calcRequestHash(request);
        mintRequestNonce[requestHash] = nonce; 
        mintRequests.push(request);

        emit MintRequestAdd(nonce, msg.sender, amount, btcDepositAddress, btcTxid, timestamp, requestHash);
        return true;
    }

    event MintRequestCancel(uint indexed nonce, address indexed requester, bytes32 requestHash);

    function cancelMintRequest(bytes32 requestHash) external onlyMerchant returns (bool) {
        uint nonce;
        Request memory request;

        (nonce, request) = getPendingMintRequest(requestHash);

        require(msg.sender == request.requester, "cancel sender is different than pending request initiator");
        mintRequests[nonce].status = RequestStatus.CANCELED;

        emit MintRequestCancel(nonce, msg.sender, requestHash);
        return true;
    }

    event MintConfirmed(
        uint indexed nonce,
        address indexed requester,
        uint amount,
        string btcDepositAddress,
        string btcTxid,
        uint timestamp,
        bytes32 requestHash
    );

    function confirmMintRequest(bytes32 requestHash) external onlyCustodian returns (bool) {
        uint nonce;
        Request memory request;

        (nonce, request) = getPendingMintRequest(requestHash);

        mintRequests[nonce].status = RequestStatus.APPROVED;
        require(controller.mint(request.requester, request.amount), "mint failed");

        emit MintConfirmed(
            request.nonce,
            request.requester,
            request.amount,
            request.btcDepositAddress,
            request.btcTxid,
            request.timestamp,
            requestHash
        );
        return true;
    }

    event MintRejected(
        uint indexed nonce,
        address indexed requester,
        uint amount,
        string btcDepositAddress,
        string btcTxid,
        uint timestamp,
        bytes32 requestHash
    );

    function rejectMintRequest(bytes32 requestHash) external onlyCustodian returns (bool) {
        uint nonce;
        Request memory request;

        (nonce, request) = getPendingMintRequest(requestHash);

        mintRequests[nonce].status = RequestStatus.REJECTED;

        emit MintRejected(
            request.nonce,
            request.requester,
            request.amount,
            request.btcDepositAddress,
            request.btcTxid,
            request.timestamp,
            requestHash
        );
        return true;
    }

    event Burned(
        uint indexed nonce,
        address indexed requester,
        uint amount,
        string btcDepositAddress,
        uint timestamp,
        bytes32 requestHash
    );

    function burn(uint amount) external onlyMerchant returns (bool) {
        string memory btcDepositAddress = merchantBtcDepositAddress[msg.sender];
        require(!isEmptyString(btcDepositAddress), "merchant btc deposit address was not set"); 

        uint nonce = burnRequests.length;
        uint timestamp = getTimestamp();

        // set txid as empty since it is not known yet.
        string memory btcTxid = "";

        Request memory request = Request({
            requester: msg.sender,
            amount: amount,
            btcDepositAddress: btcDepositAddress,
            btcTxid: btcTxid,
            nonce: nonce,
            timestamp: timestamp,
            status: RequestStatus.PENDING
        });

        bytes32 requestHash = calcRequestHash(request);
        burnRequestNonce[requestHash] = nonce; 
        burnRequests.push(request);

        require(controller.getWBTC().transferFrom(msg.sender, controller, amount), "trasnfer tokens to burn failed");
        require(controller.burn(amount), "burn failed");

        emit Burned(nonce, msg.sender, amount, btcDepositAddress, timestamp, requestHash);
        return true;
    }

    event BurnConfirmed(
        uint indexed nonce,
        address indexed requester,
        uint amount,
        string btcDepositAddress,
        string btcTxid,
        uint timestamp,
        bytes32 inputRequestHash
    );

    function confirmBurnRequest(bytes32 requestHash, string btcTxid) external onlyCustodian returns (bool) {
        uint nonce;
        Request memory request;

        (nonce, request) = getPendingBurnRequest(requestHash);

        burnRequests[nonce].btcTxid = btcTxid;
        burnRequests[nonce].status = RequestStatus.APPROVED;
        burnRequestNonce[calcRequestHash(burnRequests[nonce])] = nonce;

        emit BurnConfirmed(
            request.nonce,
            request.requester,
            request.amount,
            request.btcDepositAddress,
            btcTxid,
            request.timestamp,
            requestHash
        );
        return true;
    }

    function getMintRequest(uint nonce)
        external
        view
        returns (
            uint requestNonce,
            address requester,
            uint amount,
            string btcDepositAddress,
            string btcTxid,
            uint timestamp,
            string status,
            bytes32 requestHash
        )
    {
        Request memory request = mintRequests[nonce];
        string memory statusString = getStatusString(request.status); 

        requestNonce = request.nonce;
        requester = request.requester;
        amount = request.amount;
        btcDepositAddress = request.btcDepositAddress;
        btcTxid = request.btcTxid;
        timestamp = request.timestamp;
        status = statusString;
        requestHash = calcRequestHash(request);
    }

    function getMintRequestsLength() external view returns (uint length) {
        return mintRequests.length;
    }

    function getBurnRequest(uint nonce)
        external
        view
        returns (
            uint requestNonce,
            address requester,
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

        requestNonce = request.nonce;
        requester = request.requester;
        amount = request.amount;
        btcDepositAddress = request.btcDepositAddress;
        btcTxid = request.btcTxid;
        timestamp = request.timestamp;
        status = statusString;
        requestHash = calcRequestHash(request);
    }

    function getBurnRequestsLength() external view returns (uint length) {
        return burnRequests.length;
    }

    function getTimestamp() internal view returns (uint) {
        // timestamp is only used for data maintaining purpose, it is not relied on for critical logic.
        return block.timestamp; // solhint-disable-line not-rely-on-time
    }

    function getPendingMintRequest(bytes32 requestHash) internal view returns (uint nonce, Request memory request) {
        require(requestHash != 0, "request hash is 0");
        nonce = mintRequestNonce[requestHash];
        request = mintRequests[nonce];
        validatePendingRequest(request, requestHash);
    }

    function getPendingBurnRequest(bytes32 requestHash) internal view returns (uint nonce, Request memory request) {
        require(requestHash != 0, "request hash is 0");
        nonce = burnRequestNonce[requestHash];
        request = burnRequests[nonce];
        validatePendingRequest(request, requestHash);
    }

    function validatePendingRequest(Request memory request, bytes32 requestHash) internal pure {
        require(request.status == RequestStatus.PENDING, "request is not pending");
        require(requestHash == calcRequestHash(request), "given request hash does not match a pending request");
    }

    function calcRequestHash(Request request) internal pure returns (bytes32) {
        return keccak256(abi.encode(
            request.requester,
            request.amount,
            request.btcDepositAddress,
            request.btcTxid,
            request.nonce,
            request.timestamp
        ));
    }

    function compareStrings (string a, string b) internal pure returns (bool) {
        return (keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b)));
    }

    function isEmptyString (string a) internal pure returns (bool) {
        return (compareStrings(a, ""));
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
        } else {
            // this fallback can never be reached.
            return "unknown";
        }
    }
}
