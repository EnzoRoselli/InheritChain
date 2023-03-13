// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract InheritanceFactory {

    uint256 private deployedInheritancesCount;
    mapping (address => address) public inheritances; // mapping(administratorAddress => inheritanceContractAddress)

    event LogInheritanceCreated(string message, address indexed administrator, address indexed inheritance, uint256 deployedInheritancesCount);

    function createInheritance(uint256 aliveTimeOut, address usdcTokenAddress) public {
        require(inheritances[msg.sender] == address(0), "You have already one inheritance created, you can't have two."); // address(0) means null address in Solidity.

        inheritances[msg.sender] = address(new Inheritance(msg.sender, aliveTimeOut, usdcTokenAddress));
        deployedInheritancesCount++;

        emit LogInheritanceCreated("Log all the values: Administrator address, Inheritance contract address, Number of inheritances deployed.",
            msg.sender, inheritances[msg.sender], deployedInheritancesCount);
    }

    function getDeployedInheritancesCount() public view returns (uint) {
        return deployedInheritancesCount;
    }

    function isAdmin() public view returns (bool) {
        return inheritances[msg.sender] != address(0);
    }
}

contract Inheritance is Ownable {
    struct Administrator {
        address administratorAddress;
        uint256 lastAlive;
    }

    struct Heir {
        address heir;
        uint256 share;
        uint256 etherBalance;
        uint256 usdcBalance;
        uint256[] NFTDeedIds;
    }

    //ADMINISTRATOR VARIABLES
    Administrator public administrator;
    uint256 private aliveTimeOut; // Time limit for the administrator to send a signal to show he is alive.
    
    //HEIR VARIABLES
    Heir[] private heirs; // We want a maximum of 100 heirs.
    address[] private inheritanceRequests;  // We want a maximum of 100 requests.
    mapping(address => uint256) private heirsUSDC;
    mapping(address => uint256) private heirsEther;

    //TOKEN VARIABLES
    IERC20 token;
    // address constant USDC_TOKEN_ADDRESS = 0x07865c6E87B9F70255377e024ace6630C1Eaa37F;

    //EVENTS
    event LogDeposit(string message, address administratorAddress , uint256 value, uint256 contractBalance);
    event LogAdministratorAlive(string message, address indexed administrator, uint256 timestamp, uint256 currentTime, uint256 aliveTimeOut);
    event LogInheritanceClaimed(string message, address indexed heir, uint256 share, uint256 numberOfHeirs);
    event LogRequestToBeHeir(string message, address indexed requester, uint256 numberOfRequests, uint256 numberOfHeirs);
    event LogHeirAccepted(string message, address indexed heir, uint256 share, uint256 numberOfRequests, uint256 numberOfHeirs);
    event LogHeirRejected(string message, address indexed requester, uint256 numberOfRequests, uint256 numberOfHeirs);
    event LogHeirClaiming(string message, address indexed heir, uint256 share, uint256 etherSent, uint256 etherBalance, uint256 usdcSent, uint256 usdcBalance);
    
    //CONSTRUCTOR    
    constructor (address _administratorAddress, uint256 _aliveTimeOut, address _tokenAddress) {
        token = IERC20(_tokenAddress);

        transferOwnership(_administratorAddress); //We need to transfer the Ownership of the Ownable OpenZeppelin library.
        aliveTimeOut = _aliveTimeOut;

        administrator = Administrator({
            administratorAddress: _administratorAddress,
            lastAlive: block.timestamp
        });
    }

    //DEPOSIT FUNCTIONS
    function deposit() public payable {
        emit LogDeposit("Log all the values: Administrator address, Amount sent, Contract ether balance.",
            administrator.administratorAddress , msg.value, address(this).balance);
    }

    //WITHDRAW FUNCTIONS
    function withdrawUSDC(uint256 amount) public onlyOwner {
        require(amount > 0, "Amount must be positive.");
        require(amount <= getUSDCBalance(), "Not enough USDC balance.");

        require(token.transfer(msg.sender, amount), "Error while transferring USDC from the contract to the administrator.");
    }

    function withdraw(uint256 amount) public onlyOwner {
        require(amount > 0, "Amount must be positive.");
        require(amount <= address(this).balance, "Not enough ETH balance.");
        payable(msg.sender).transfer(amount);
    }

    //FUNDAMENTAL FUNCTIONS
    function updateAliveTimeOut(uint256 _aliveTimeOut) public onlyOwner {
        aliveTimeOut = _aliveTimeOut;
    }

    function signalAlive() public onlyOwner {
        administrator.lastAlive = block.timestamp;
        emit LogAdministratorAlive("Administrator sends a signal to show he is alive.", msg.sender, administrator.lastAlive, block.timestamp, aliveTimeOut);
    }

    function requestInheritance() public requestInheritanceValidations(msg.sender) {
        inheritanceRequests.push(msg.sender);
        emit LogRequestToBeHeir("User requests to be added as an heir.", msg.sender, inheritanceRequests.length, heirs.length);
    }

    function acceptInheritanceRequest(uint index, address requester, uint256 share) public onlyOwner acceptInheritanceValidations(index, requester, share) {
        uint256[] memory emptyArray;
        heirs.push(Heir(requester, share, 0, 0, emptyArray));
        removeRequest(index);
        emit LogHeirAccepted("Administrator accepts user as an heir.", requester, share, inheritanceRequests.length, heirs.length);
    }

    function rejectInheritanceRequest(uint index, address requester) public onlyOwner rejectInheritanceRequestValidations(index, requester) {
        removeRequest(index);
        emit LogHeirRejected("Administrator rejects user's request to be an heir.", requester, inheritanceRequests.length, heirs.length);
    }

    function isAdministratorDead() public view returns (bool) { // Shows if the aliveTimeOut has been reached, and the Heirs can redeem the Inheritance.
        return block.timestamp - administrator.lastAlive >= aliveTimeOut;
    }

    function claimInheritance() public isHeir(msg.sender) {

        if (isAdministratorDead()) {
            uint256 usdcInheritance = getUSDCBalance();
            uint256 etherInheritance = getEtherBalance();

            uint256 totalShares = getTotalShares();

            for (uint i = 0; i < heirs.length; i++) {
                heirsUSDC[heirs[i].heir] = (heirs[i].share * usdcInheritance) / totalShares;
                heirsEther[heirs[i].heir] = (heirs[i].share * etherInheritance) / totalShares;
            }

            address heirAddress;
            for (uint i = 0; i < heirs.length; i++) {
                heirAddress = heirs[i].heir;

                payable(heirAddress).transfer(heirsEther[heirAddress]);
                heirs[i].etherBalance = heirsEther[heirAddress];

                require(token.transfer(heirAddress, heirsUSDC[heirAddress]), "Error while transferring USDC from the contract to heir.");
                heirs[i].usdcBalance = heirsUSDC[heirAddress];

                emit LogHeirClaiming("Ether and USDC money sent to the heir.", heirAddress, heirs[i].share, heirsEther[heirAddress], 
                heirs[i].etherBalance, heirsUSDC[heirAddress], heirs[i].usdcBalance);
            }
        }
    }

    function addNFTDeed(address heirAddress, uint256 tokenId) public onlyOwner {
        for(uint256 i = 0; i < heirs.length; i++) {
            if(heirs[i].heir == heirAddress) {
                heirs[i].NFTDeedIds.push(tokenId);
                return;
            }
        }
        require(false, "Not heir address matched to the one sent.");
    }

    //GET FUNCTIONS
    function getAliveTimeOut() public view onlyOwner returns (uint256) {
        return aliveTimeOut;
    }

    function getLastAlive() public view onlyOwner returns (uint256) {
        return administrator.lastAlive;
    }

    function getEtherBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getUSDCBalance() public view returns (uint256) {
        return token.balanceOf(address(this));
    }

    function getInheritanceRequests() public view onlyOwner returns (address[] memory) {
        return inheritanceRequests;
    }

    function getHeirs() public view returns (Heir[] memory) {
        return heirs;
    }

    function getTotalShares() public view returns (uint256) {
        uint256 totalShares = 0;
        for (uint i = 0; i < heirs.length; i++) {
            totalShares += heirs[i].share;
        }
        return totalShares;
    }

    function getHeirsAddresses() public view returns (address[] memory) {
        address[] memory heirAddresses = new address[](heirs.length);
        uint256 index = 0;

        for(uint256 i = 0; i < heirs.length; i++) {
            heirAddresses[index] = heirs[i].heir;
            index += 1;
        }

        return heirAddresses;
    }

    function getNFTDeedsByHeirAddress(address heirAddress) public view returns (uint256[] memory nftDeedIds) {
        for(uint256 i = 0; i < heirs.length; i++) {
            if(heirs[i].heir == heirAddress) {
                return heirs[i].NFTDeedIds;
            }
        }
    }

    //MODIFIERS
    modifier requestInheritanceValidations(address addr) {
        require(heirs.length < 100, "Already reached the limit of 100 heirs.");
        require(inheritanceRequests.length < 100, "Already reached the limit of 100 inheritance requests.");

        for(uint i = 0; i < inheritanceRequests.length; i++) {
            require(inheritanceRequests[i] != addr, "Address already exists in requests array.");
        }
        _;
    }

    modifier acceptInheritanceValidations(uint index, address addr, uint256 share) {
        require(index < inheritanceRequests.length, "The index sent is bigger than the requests array length.");
        require(inheritanceRequests[index] == addr, "Address sent doesn't match with the address stored in the requests array.");

        uint256 totalShares = 0;
        for(uint i = 0; i < heirs.length; i++) {
            require(heirs[i].heir != addr, "Address already exists in heirs array.");
            totalShares += heirs[i].share;
        }

        require((totalShares + share) <= 100, "the amount of shares exceed the 100% of the Inheritance, try with a smaller amount of share.");
        _;
    }

    modifier rejectInheritanceRequestValidations(uint index, address addr) {
        require(index < inheritanceRequests.length, "The index sent is bigger than the requests array length.");
        require(inheritanceRequests[index] == addr, "Address sent doesn't match with the address stored in the requests array.");
        _;
    }

    modifier isHeir(address addr) {
        bool isPresent = false;
        for(uint i = 0; i < heirs.length; i++) {
            if(heirs[i].heir == addr) {
                isPresent = true;
            }
        }
        require(isPresent == true, "The address claiming the inheritance is not a Heir.");
        _;
    }

    function removeRequest(uint index) internal {
        require(index < inheritanceRequests.length, "The index sent is bigger than the requests array length.");

        for (uint i = index; i < inheritanceRequests.length-1; i++){
            inheritanceRequests[i] = inheritanceRequests[i+1];
        }
        inheritanceRequests.pop();
    }
}



