// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./Inheritance.sol";

contract TitleDeed is ERC721URIStorage {
    using Counters for Counters.Counter;

    Counters.Counter private tokenIdCounter;
    // mapping(Identificador incremental => tokenId y address del dueño del NFT)
        // To make it easier, Identificador incremental y always the same as tokenId.
    mapping(uint256 => DeedNFT) private idToDeedNFT; 

    constructor() ERC721("TitleDeed", "TDD") {}

    struct DeedNFT {
        uint256 tokenId;
        address administrator;
    }

    struct Heir {
        address heir;
        uint256 share;
        uint256 etherBalance;
        uint256 usdcBalance;
        uint256[] NFTDeedIds;
    }

    function safeMint(string memory tokenURI) public returns (uint256) {
        tokenIdCounter.increment(); // We start counting our tokenIds from 1.
        uint256 tokenId = tokenIdCounter.current();

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);

        addToDeedNFTArray(tokenId);

        // We transfer this token to the contract address to:
            // 1. Avoid the owner to trade it.
            // 2. Avoid extra calls to approve() method for this smart contract to be able to manipulate the NFT.
            // 3. Avoid extra steps for the owner in Metamask approving the function approve(). 
        _transfer(msg.sender, address(this), tokenId); 

        return tokenId;
    }

    function addToDeedNFTArray(uint256 tokenId) private {
        idToDeedNFT[tokenId] = DeedNFT(tokenId, msg.sender);
    }

    // GET METHODS
    function getLastElement() public view returns (DeedNFT memory) { //Remover o actualizar para msg.sender, este contrato deberia usarse por todos los Administrator.
        uint256 currentTokenId = tokenIdCounter.current();
        return idToDeedNFT[currentTokenId];
    }

    function getElementByTokenId(uint256 tokenId) public view returns (DeedNFT memory) { //Remover o actualizar para msg.sender, este contrato deberia usarse por todos los Administrator.
        return idToDeedNFT[tokenId];
    }

    function getLastTokenId() public view returns (uint256) {
        return tokenIdCounter.current();
    }

    function getAdministratorNFTs() public view returns (DeedNFT[] memory) {
        uint256 tokensAmount = tokenIdCounter.current();
        uint256 itemCount = 0;
        uint256 currentIndex = 0;

        // We get the amount of deeds created by the administrator.
        for(uint256 i = 0; i < tokensAmount; i++) {
            if(idToDeedNFT[i+1].administrator == msg.sender) {
                itemCount += 1;
            }
        }

        DeedNFT[] memory deeds = new DeedNFT[](itemCount);
        // Once we have the count of all the NFTs from the administrator, we create an array to store all the NFTs.
        for(uint256 i = 0; i < tokensAmount; i++) {
            if(idToDeedNFT[i+1].administrator == msg.sender) {
                uint256 currentId = i+1;
                DeedNFT storage currentItem = idToDeedNFT[currentId];
                deeds[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }

        return deeds;
    }

    //FUNDAMENTAL FUNCTIONS
    function executeInheritance(address contractAddress) public {
        Inheritance inheritanceContract = Inheritance(contractAddress);
        require(inheritanceContract.isAdministratorDead(), "Owner still alive, you can't redeem the NFTs yet.");

        address[] memory heirAddresses = inheritanceContract.getHeirsAddresses();

        for(uint256 i = 0; i < heirAddresses.length; i++) {
            uint256[] memory nftDeedIds = inheritanceContract.getNFTDeedsByHeirAddress(heirAddresses[i]);

            for(uint256 x = 0; x < nftDeedIds.length; x++) {
                _transfer(address(this), heirAddresses[i], nftDeedIds[x]);
            }
        }
    }

}