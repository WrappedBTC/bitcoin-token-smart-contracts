pragma solidity 0.4.24;

import "./Withdrawable.sol";
import "./MainInterface.sol";


contract FactoryBase is Withdrawable {

    struct Request {
        address from;
        address to; // relevant only for mint, otherwise assumed 0
        uint amount;
        string btcData; // txid for mint, btc destination address for burn
        uint nonce;
        uint timestamp;
        bool pending;
    }

    MainInterface public main;
    Request[] public mintRequests;
    Request[] public burnRequests;

    constructor(MainInterface _main) public {
        require(_main != address(0), "bad address");
        main = _main;
    }

    modifier onlyMerchant() {
        require(main.isMerchant(msg.sender), "sender not a merchant.");
        _;
    }

    modifier onlyCustodian() {
        require(main.isCustodian(msg.sender), "sender not a custodian.");
        _;
    }

    event MainSet(MainInterface main);

    function setMain(MainInterface _main) public onlyOwner {
        require(_main != address(0), "bad address");
        main = _main;
        emit MainSet(main);
    }

    function calcRequestHash(
        address from,
        address to,
        uint amount,
        string btcData,
        uint nonce,
        uint timestamp,
        bool pending
    )
        public
        pure
        returns(bytes32)
    {
        return keccak256(abi.encodePacked(from, to, amount, btcData, nonce, timestamp, pending));
    }

    function validateRequestHash(Request storage request, bytes32 requestHash) internal view {
        bytes32 calculatedHash = calcRequestHash( request.from,
                                                 request.to,
                                                 request.amount,
                                                 request.btcData,
                                                 request.nonce,
                                                 request.timestamp,
                                                 request.pending);
        require(requestHash == calculatedHash, "given request hash is different than hash of stored request.");
    }

    event MintRequestAdd(address from, address to, uint amount, string btcTxid, uint nonce, uint timestamp);

    function addMintRequest(address to, uint amount, string btcTxid) public onlyMerchant {
        require(to != address(0), "bad address");
        uint nonce = mintRequests.length;
        uint timestamp = now;
        mintRequests.push(Request(msg.sender, to, amount, btcTxid, nonce, timestamp, true));
        emit MintRequestAdd(msg.sender, to, amount, btcTxid, nonce, timestamp);
    }

    event Burned(address from, uint amount, string btcDestAddress, uint nonce, uint timestamp);

    function burn(uint amount, string btcDestAddress) external onlyMerchant returns (bool) {
        uint nonce = burnRequests.length;
        uint timestamp = now;
        //TODO - should it reall ybe "pending"?
        burnRequests.push(Request(msg.sender, 0, amount, btcDestAddress, nonce, timestamp, true));

        // perfrom the burn
        require(main.getProxy().transferFrom(msg.sender, main, amount), "trasnfer of tokens to burn failed");
        require(main.burn(amount), "burn failed");
        emit Burned(msg.sender, amount, btcDestAddress, nonce, timestamp);
    }


    event MintDone(address from, address to, uint amount, string btcTxid, uint nonce, uint timestamp);

    function confirmMintRequest(uint nonce, bytes32 requestHash) public onlyCustodian {
        Request storage request = mintRequests[nonce];
        require(!request.pending, "request is not pending");
        validateRequestHash(request, requestHash);

        require(main.mint(request.to, request.amount), "mint failed");
        request.pending = false;
        emit MintDone(request.from, request.to, request.amount, request.btcData, request.nonce, request.timestamp);
    }

    event BurnConfirmed(address from, uint amount, string btcDestAddress, uint nonce, uint timestamp);

    function confirmBurnRequest(uint nonce, bytes32 requestHash) public onlyCustodian {
        Request storage request = burnRequests[nonce];
        require(!request.pending, "request is not pending");
        validateRequestHash(request, requestHash);

        request.pending = false;
        emit BurnConfirmed(request.from, request.amount, request.btcData, request.nonce, request.timestamp);
    }

    event MintRequestCancel(address from, uint nonce);

    function cancelMintRequest(uint nonce, bytes32 requestHash) public onlyMerchant {
        Request storage request = mintRequests[nonce];
        require(!request.pending, "request is not pending");
        require(msg.sender == request.from, "cancel sender is different than pending request initiator");
        validateRequestHash(request, requestHash);

        request.pending = false;
        emit MintRequestCancel(msg.sender, nonce);
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

}
