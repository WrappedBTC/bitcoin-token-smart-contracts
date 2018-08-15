pragma solidity 0.4.24;


import "../utils/Withdrawable.sol";
import "../controller/ControllerInterface.sol";


contract Factory is Withdrawable {

    enum RequestStatus {PENDING, CANCELED, APPROVED, REJECTED}

    struct Request {
        address from;
        address to; // relevant only for mint, otherwise assumed 0
        uint amount;
        string btcData; // txid for mint, btc destination address for burn
        uint nonce;
        uint timestamp;
        RequestStatus status;
    }

    ControllerInterface public controller;
    Request[] public mintRequests;
    Request[] public burnRequests;

    constructor(ControllerInterface _controller) external {
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

    /* solhint-disable not-rely-on-time */
    event MintRequestAdd(address from, address to, uint amount, string btcTxid, uint nonce, uint timestamp);

    function addMintRequest(address to, uint amount, string btcTxid) external onlyMerchant {
        require(to != address(0), "invalid to address");
        uint nonce = mintRequests.length;
        uint timestamp = now;

        mintRequests.push(Request(msg.sender, to, amount, btcTxid, nonce, timestamp, RequestStatus.PENDING));
        emit MintRequestAdd(msg.sender, to, amount, btcTxid, nonce, timestamp);
    }

    event Burned(address from, uint amount, string btcDestAddress, uint nonce, uint timestamp);

    function burn(uint amount, string btcDestAddress) external onlyMerchant returns (bool) {
        uint nonce = burnRequests.length;
        uint timestamp = now;

        burnRequests.push(Request(msg.sender, 0, amount, btcDestAddress, nonce, timestamp, RequestStatus.PENDING));
        require(controller.getToken().transferFrom(msg.sender, controller, amount), "trasnfer tokens to burn failed");
        require(controller.burn(amount), "burn failed");
        emit Burned(msg.sender, amount, btcDestAddress, nonce, timestamp);
    }
    /* solhint-disable not-rely-on-time */

    event MintConfirmed(
        bool confirm,
        address from,
        address to,
        uint amount,
        string btcTxid,
        uint nonce,
        uint timestamp
    );

    function confirmMintRequest(uint nonce, bytes32 requestHash, bool confirm) external onlyCustodian {
        Request storage request = mintRequests[nonce];
        require(request.status == RequestStatus.PENDING, "request is not pending");
        validateRequestHash(request, requestHash);

        if (confirm) {
            request.status = RequestStatus.APPROVED;
            require(controller.mint(request.to, request.amount), "mint failed");
        } else {
            request.status = RequestStatus.REJECTED;
        }

        emit MintConfirmed(
            confirm,
            request.from,
            request.to,
            request.amount,
            request.btcData,
            request.nonce,
            request.timestamp
        );
    }

    event BurnConfirmed(bool confirm, address from, uint amount, string btcDestAddress, uint nonce, uint timestamp);

    function confirmBurnRequest(uint nonce, bytes32 requestHash, bool confirm) external onlyCustodian {
        Request storage request = burnRequests[nonce];
        require(request.status == RequestStatus.PENDING, "request is not pending");
        validateRequestHash(request, requestHash);

        if (confirm) {
            request.status = RequestStatus.APPROVED;
        } else {
            request.status = RequestStatus.REJECTED;
        }

        emit BurnConfirmed(confirm, request.from, request.amount, request.btcData, request.nonce, request.timestamp);
    }

    event MintRequestCancel(address from, uint nonce);

    function cancelMintRequest(uint nonce, bytes32 requestHash) external onlyMerchant {
        Request storage request = mintRequests[nonce];
        require(request.status == RequestStatus.PENDING, "request is not pending");
        require(msg.sender == request.from, "cancel sender is different than pending request initiator");
        validateRequestHash(request, requestHash);

        request.status = RequestStatus.CANCELED;
        emit MintRequestCancel(msg.sender, nonce);
    }

    function calcRequestHash(
        address from,
        address to,
        uint amount,
        string btcData,
        uint nonce,
        uint timestamp,
        RequestStatus status
    )
        public
        pure
        returns(bytes32)
    {
        return keccak256(abi.encodePacked(from, to, amount, btcData, nonce, timestamp, status));
    }

    function getMintRequest(uint nonce)
        public
        view
        returns(address from, address to, uint amount, string btcTxid, uint requestNonce, uint timestamp)
    {
        Request storage request = mintRequests[nonce];
        return (request.from, request.to, request.amount, request.btcData, request.nonce, request.timestamp);
    }

    function getBurnRequest(uint nonce)
        public
        view
        returns(address from, uint amount, string btcDestAddress, uint requestNonce, uint timestamp)
    {
        Request storage request = burnRequests[nonce];
        return (request.from, request.amount, request.btcData, request.nonce, request.timestamp);
    }

    function getMintRequestsLength() public view returns (uint length) {
        return mintRequests.length;
    }

    function getBurnRequestsLength() public view returns (uint length) {
        return burnRequests.length;
    }

    function validateRequestHash(Request storage request, bytes32 requestHash) internal view {
        bytes32 calculatedHash = calcRequestHash(
            request.from,
            request.to,
            request.amount,
            request.btcData,
            request.nonce,
            request.timestamp,
            request.status
        );
        require(requestHash == calculatedHash, "given request hash is different than hash of stored request.");
    }
}
