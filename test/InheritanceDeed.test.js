const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider({ gasLimit: 100000000 })); 
const { describe, it, beforeEach } = require('mocha');

const compiledTitleDeed = require('../ethereum/build/TitleDeed.json');
const compiledInheritance = require("../ethereum/build/Inheritance.json");
const compiledUSDC = require("../ethereum/build/TestToken.json");

let accounts;
let titleDeed;
let titleDeedAddress;

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();
    
    titleDeed = await new web3.eth.Contract(compiledTitleDeed.abi)
        .deploy({ data: compiledTitleDeed.evm.bytecode.object })
        .send({ from: accounts[0], gas: "10000000" });
    
    titleDeedAddress = titleDeed.options.address;
});

describe("InheritanceDeed", () => {
    it('deploys a contract', () => {
        assert.ok(titleDeed.options.address);
    });

    describe("safeMint", () => {
        it('increments the tokenIdCounter and returns the new tokenId', async () => {
            const tokenIdBefore = await titleDeed.methods.getLastTokenId().call();
            await titleDeed.methods.safeMint("token1").send({ from: accounts[0], gas: "1000000" });
            const tokenIdAfter = await titleDeed.methods.getLastTokenId().call();

            assert.strictEqual(Number(tokenIdAfter), Number(tokenIdBefore) + 1);
        });
    
        it('sets the correct tokenURI for the new tokenId', async () => {
            const tokenURI = "https://mymarket.com/tokenId/1";
            await titleDeed.methods.safeMint(tokenURI).send({ from: accounts[0], gas: "1000000" });
            const tokenId = await titleDeed.methods.getLastTokenId().call();
            const result = await titleDeed.methods.tokenURI(tokenId).call();

            assert.strictEqual(result, tokenURI);
        });
    
        it('adds a new DeedNFT to the idToDeedNFT mapping', async () => {
            await titleDeed.methods.safeMint("token1").send({ from: accounts[0], gas: "1000000" });
            const tokenId = await titleDeed.methods.getLastTokenId().call();
            const deedNFT = await titleDeed.methods.getElementByTokenId(tokenId).call();

            assert.strictEqual(Number(deedNFT.tokenId), Number(tokenId));
            assert.strictEqual(deedNFT.administrator, accounts[0]);
        });
    
        it('transfers the new token to the contract address', async () => {
            await titleDeed.methods.safeMint("token1").send({ from: accounts[0], gas: "1000000" });
            const tokenId = await titleDeed.methods.getLastTokenId().call();
            const ownerBefore = await titleDeed.methods.ownerOf(tokenId).call();

            assert.strictEqual(ownerBefore, titleDeedAddress);
        });
    });

    describe("getLastElement", () => {
        it('returns the last element added to the array', async () => {
          const element1 = "hi";
          const element2 = "hello";
          const element3 = "bye";
      
          await titleDeed.methods.safeMint(element1).send({ from: accounts[0], gas: "1000000" });
          await titleDeed.methods.safeMint(element2).send({ from: accounts[0], gas: "1000000" });
          await titleDeed.methods.safeMint(element3).send({ from: accounts[0], gas: "1000000" });
      
          const lastElement = await titleDeed.methods.getLastElement().call();
        
          assert.strictEqual(await titleDeed.methods.tokenURI(lastElement.tokenId).call(), element3);
        });
    });

    describe("getElementByTokenId", () => {
        let tokenId;
    
        beforeEach(async () => {
            await titleDeed.methods.safeMint("hello").send({ from: accounts[2], gas: "1000000" });
            tokenId = await titleDeed.methods.getLastTokenId().call();
        });
    
        it('returns the DeedNFT associated with the given tokenId', async () => {
            const deedNFT = await titleDeed.methods.getElementByTokenId(tokenId).call();

            assert.strictEqual(Number(deedNFT.tokenId), Number(tokenId));
            assert.strictEqual(deedNFT.administrator, accounts[2]);
        });
    
        it('throws an error if the tokenId does not exist', async () => {
            try {
                const deedNFT = await titleDeed.methods.getElementByTokenId(tokenId + 1).call();
                assert.fail('Expected an error to be thrown');
            } catch (err) {
                assert(true);
            }
        });
    });
    
    describe("getLastTokenId", () => {
        it('returns 0 when there are no tokens', async () => {
          const result = await titleDeed.methods.getLastTokenId().call();

          assert.strictEqual(Number(result), 0);
        });
      
        it('returns the correct token id', async () => {
          await titleDeed.methods.safeMint("testing").send({ from: accounts[2], gas: "1000000" });
          await titleDeed.methods.safeMint("testing123").send({ from: accounts[2], gas: "1000000" });
          const tokenId = await titleDeed.methods.getLastTokenId().call();

          assert.strictEqual(Number(tokenId), 2);
        });
    });
      
    describe("getAdministratorNFTs", () => {
        it('returns an array of token IDs owned by the contract administrator', async () => {
            await titleDeed.methods.safeMint("token1").send({ from: accounts[2], gas: "1000000" });
            await titleDeed.methods.safeMint("token2").send({ from: accounts[1], gas: "1000000" });
            await titleDeed.methods.safeMint("token3").send({ from: accounts[2], gas: "1000000" });
    
            const administratorNFTs = await titleDeed.methods.getAdministratorNFTs().call({ from: accounts[2] });
    
            assert.strictEqual(administratorNFTs.length, 2);
            assert.strictEqual(Number(administratorNFTs[0].tokenId), 1);
            assert.strictEqual(Number(administratorNFTs[1].tokenId), 3);
        });
    
        it('returns an empty array if the contract administrator owns no tokens', async () => {
            await titleDeed.methods.safeMint("hi").send({ from: accounts[1], gas: "1000000" });
            await titleDeed.methods.safeMint("hello").send({ from: accounts[2], gas: "1000000" });
            const administratorNFTs = await titleDeed.methods.getAdministratorNFTs().call({ from: accounts[0] });

            assert.strictEqual(administratorNFTs.length, 0);
        });
    });
    
    describe("executeInheritance", () => {
        let inheritanceContract;

        beforeEach(async () => {
            const usdcTokenFactory = await new web3.eth.Contract(compiledUSDC.abi)
                .deploy({ data: compiledUSDC.evm.bytecode.object })
                .send({ from: accounts[0], gas: "100000000" });
            usdcTokenAddress = usdcTokenFactory.options.address;

            inheritanceContract = await new web3.eth.Contract(compiledInheritance.abi)
                .deploy({ data: compiledInheritance.evm.bytecode.object, arguments: [accounts[0], "180", usdcTokenAddress] })
                .send({ from: accounts[0], gas: "100000000" });
        });

        it('throws an error if the contract administrator is still alive', async () => {
            await assert.rejects(
                titleDeed.methods.executeInheritance(inheritanceContract.options.address).send({ from: accounts[1] }),
                /Owner still alive, you can't redeem the NFTs yet./
            );
        });

        it('transfers all NFTs to the heirs', async () => {
            const index = 0;

            await inheritanceContract.methods.updateAliveTimeOut(0).send({ from: accounts[0], gas: "100000000" });

            await inheritanceContract.methods.requestInheritance(accounts[1]).send({ from: accounts[1], gas: "100000000" });
            await inheritanceContract.methods.requestInheritance(accounts[2]).send({ from: accounts[2], gas: "100000000" });

            await inheritanceContract.methods.acceptInheritanceRequest(index, accounts[1], 10).send({ from: accounts[0], gas: "100000000" });
            await inheritanceContract.methods.acceptInheritanceRequest(index, accounts[2], 10).send({ from: accounts[0], gas: "100000000" });

            await titleDeed.methods.safeMint("token1").send({ from: accounts[1], gas: "100000000" });
            const tokenId1 = await titleDeed.methods.getLastTokenId().call();
            await inheritanceContract.methods.addNFTDeed(tokenId1, accounts[1]).send({ from: accounts[0], gas: "100000000" });

            await titleDeed.methods.safeMint("token2").send({ from: accounts[1], gas: "100000000" });
            const tokenId2 = await titleDeed.methods.getLastTokenId().call();
            await inheritanceContract.methods.addNFTDeed(tokenId2, accounts[1]).send({ from: accounts[0], gas: "100000000" });

            await titleDeed.methods.safeMint("token3").send({ from: accounts[2], gas: "100000000" });
            const tokenId3 = await titleDeed.methods.getLastTokenId().call();
            await inheritanceContract.methods.addNFTDeed(tokenId3, accounts[2]).send({ from: accounts[0], gas: "100000000" });

            let heirNFT1 = await titleDeed.methods.getElementByTokenId(tokenId1).call({ from: accounts[1] });
            assert.strictEqual(heirNFT1.administrator, accounts[1]);

            let heirNFT2 = await titleDeed.methods.getElementByTokenId(tokenId2).call({ from: accounts[1] });
            assert.strictEqual(heirNFT2.administrator, accounts[1]);

            let heirNFT3 = await titleDeed.methods.getElementByTokenId(tokenId3).call({ from: accounts[2] });
            assert.strictEqual(heirNFT3.administrator, accounts[2]);
        });
    
    });

});


