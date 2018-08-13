pragma solidity 0.4.24;

import "./Withdrawable.sol";
import "./MainInterface.sol";


contract Minter is Withdrawable {


    struct MintRequest {
        address from;
        address to;
        uint amount;
        string btcTxid;
        uint nonce;
        uint timestamp;
        bool pending;
    }

    MainInterface public main;
    MintRequest[] public requests;

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

    event MintRequestAdd(address from, address to, uint amount, string btcTxid);

    function addMintRequest(address to, uint amount, string btcTxid) public onlyMerchant {
        require(to != address(0), "bad address");
        uint nonce = requests.length;
        uint timestamp = now;
        requests.push(MintRequest(msg.sender, to, amount, btcTxid, nonce, timestamp, true));
        emit MintRequestAdd(msg.sender, to, amount, btcTxid);
    }

    event MintRequestCancel(address from, uint nonce);

    function cancelMintRequest(uint nonce) public onlyMerchant {
        require(!requests[nonce].pending, "request is not pending");
        require(msg.sender == requests[nonce].from, "cancel from parameter is different than request initiator");
        requests[nonce].pending = false;
        emit MintRequestCancel(msg.sender, nonce);
    }

    event MintDone(address from, address to, uint amount, string btcTxid, uint nonce, uint timestamp);

    function confirmMintReuest(uint nonce, bytes32 requestHash) public onlyCustodian {
        MintRequest memory request = requests[nonce];

        require(
            requestHash == calcRequestHash(
                request.from,
                request.to,
                request.amount,
                request.btcTxid,
                request.nonce,
                request.timestamp,
                request.pending),
            "given request hash is different than hash of stored request."
        );
        require(request.pending, "mint request is not pending");
        require(main.mint(request.to, request.amount), "mint failed");
        request.pending = false;
        emit MintDone(request.from, request.to, request.amount, request.btcTxid, request.nonce, request.timestamp);
    }

    function getMintRequest(uint nonce)
        public
        view
        returns(address from, address to, uint amount, string btcTxid, uint requestNonce, uint timestamp)
    {
        MintRequest storage request = requests[nonce];
        return (request.from, request.to, request.amount, request.btcTxid, request.nonce, request.timestamp);
    }

    function calcRequestHash(
        address from,
        address to,
        uint amount,
        string btcTxid,
        uint nonce,
        uint timestamp,
        bool pending
    )
        public
        pure
        returns(bytes32)
    {
        return keccak256(abi.encodePacked(from, to, amount, btcTxid, nonce, timestamp, pending));
    }
}
