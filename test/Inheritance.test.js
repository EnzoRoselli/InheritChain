const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider({ gasLimit: 100000000 }));

// We get both of the compiled contracts from Inheritance.sol, located in build folder.
const compiledFactory = require("../ethereum/build/InheritanceFactory.json");
const compiledInheritance = require("../ethereum/build/Inheritance.json");
const compiledUSDC = require("../ethereum/build/TestToken.json");
const { it } = require('mocha');

let accounts;
let factory;
let inheritanceAddress;
let inheritance;
let usdcTokenAddress;
let usdcTokenInstance;

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();

    // Deploys a new USDC token contract.
    const usdcTokenFactory = await new web3.eth.Contract(compiledUSDC.abi)
        .deploy({ data: compiledUSDC.evm.bytecode.object })
        .send({ from: accounts[0], gas: "10000000" });
    usdcTokenAddress = usdcTokenFactory.options.address;

    usdcTokenInstance = await new web3.eth.Contract(compiledUSDC.abi, usdcTokenAddress);

    // Deploys a new InheritanceFactory.
    factory = await new web3.eth.Contract(compiledFactory.abi)
        .deploy({ data: compiledFactory.evm.bytecode.object })
        .send({ from: accounts[0], gas: "10000000" });

    // Deploys a new Inheritance.
    // "180" represents the alive timeout in seconds from the Administrator.
    await factory.methods.createInheritance("180", usdcTokenAddress).send({ from: accounts[0], gas: "10000000" });

    // Saves the new Inheritance contract address.
    // We use "call()" instead of "send()" method because we are not changing any data, we are not sending a transaction.
    inheritanceAddress = await factory.methods.inheritances(accounts[0]).call();

    // Looks-up for the Inheritance deployed contract. To do that, we send the "inheritanceAddress" as a second argument to the "new web3.eth.Contract()" function.
    inheritance = await new web3.eth.Contract(
        compiledInheritance.abi,
        inheritanceAddress
    );

    // Mint 1000000000000000000 USDC tokens to the inheritance contract.
    // Get the USDC token instance from the inheritance contract.
    await usdcTokenInstance.methods.mint(inheritanceAddress, web3.utils.toWei("1", "ether")).send({ from: accounts[0], gas: "10000000" });
});

describe("Inheritance Factory contract", async () => {
    describe("deploy", async () => {
        it("deploys a factory and an inheritance", () => {
            assert.ok(factory.options.address);
            assert.ok(inheritance.options.address);
        });

        it("emits an event when an inheritance is created", async () => {
            const event = await factory.getPastEvents("LogInheritanceCreated", { fromBlock: 0, toBlock: "latest" });

            assert.strictEqual(event[0].returnValues[0], "Log all the values: Administrator address, Inheritance contract address, Number of inheritances deployed.");
            assert.strictEqual(event[0].returnValues[1], accounts[0]);
            assert.strictEqual(event[0].returnValues[2], inheritanceAddress);
            assert.strictEqual(Number(event[0].returnValues[3]), 1);
        });

        it("returns the number of deployed inheritances", async () => {
            const count = await factory.methods.getDeployedInheritancesCount().call();
            assert.strictEqual(Number(count), 1);
        });

        it("marks caller as the inheritance administrator", async () => {
            const administrator = await inheritance.methods.administrator().call();

            assert.strictEqual(accounts[0], administrator.administratorAddress);
        });

        it("returns true when the caller is an inheritance administrator and false otherwise", async () => {
            const isAdmin = await factory.methods.isAdmin().call({ from: accounts[0] });
            assert.strictEqual(isAdmin, true, "The caller should be an inheritance administrator.");
        
            const isAdmin2 = await factory.methods.isAdmin().call({ from: accounts[1] });
            assert.strictEqual(isAdmin2, false, "The caller should not be an inheritance administrator.");
        });
    });
});

describe("Inheritance contract", async () => {
    //CONSTRUCTOR
    describe("constructor", async () => {
        it("sets the administrator address correctly", async () => {
            const administrator = await inheritance.methods.administrator().call();
            assert.strictEqual(administrator.administratorAddress, accounts[0]);
        });

        it("sets the alive timeout correctly", async () => {
            const aliveTimeout = await inheritance.methods.getAliveTimeOut().call();
            assert.strictEqual(Number(aliveTimeout), 180);
        });
    });

    //DEPOSIT FUNCTIONS
    describe("deposit", async () => {
        it("allows anyone to deposit funds and emits LogDeposit event", async () => {
            const value = web3.utils.toWei("1", "ether");
            const tx = await inheritance.methods.deposit().send({ from: accounts[1], value: value });
            const balance = await web3.eth.getBalance(inheritanceAddress);
            assert.strictEqual(balance, value);

            // get the emitted event
            const logDepositEvent = tx.events.LogDeposit;

            const administrator = await inheritance.methods.administrator().call();
            assert.strictEqual(logDepositEvent.event, "LogDeposit");
            assert.strictEqual(logDepositEvent.returnValues[0], "Log all the values: Administrator address, Amount sent, Contract ether balance.");
            assert.strictEqual(logDepositEvent.returnValues[1], administrator.administratorAddress);
            assert.strictEqual(logDepositEvent.returnValues[2], value);
            assert.strictEqual(logDepositEvent.returnValues[3], balance);
        });
    });

    //WITHDRAW FUNCTIONS
    describe("withdraw", async () => {
        it("allows the administrator to withdraw funds", async () => {
            const value = "100000";
            await inheritance.methods.deposit().send({ from: accounts[1], value: value });

            // Get the contract balance before withdrawal
            let balanceBeforeWithdrawal = await web3.eth.getBalance(inheritanceAddress);

            // Withdraw funds
            let tx = await inheritance.methods.withdraw("100000").send({ from: accounts[0] });

            // Get the contract balance after withdrawal
            let balanceAfterWithdrawal = await web3.eth.getBalance(inheritanceAddress);

            // Get the difference in balance
            let difference = balanceBeforeWithdrawal - balanceAfterWithdrawal;

            assert.strictEqual(Number(difference), Number(value));
        });

        it("does not allow non-administrators to withdraw funds", async () => {
            const value = web3.utils.toWei("1", "ether");
            await inheritance.methods.deposit().send({ from: accounts[1], value: value });

            // Get the contract balance before withdrawal
            let balanceBeforeWithdrawal = await web3.eth.getBalance(inheritanceAddress);

            // Try to withdraw funds as non-administrator
            await assert.rejects(
                inheritance.methods.withdraw("1").send({ from: accounts[1] }),
                /revert/
            );

            // Get the contract balance after withdrawal attempt
            let balanceAfterWithdrawal = await web3.eth.getBalance(inheritanceAddress);

            assert.strictEqual(balanceBeforeWithdrawal, balanceAfterWithdrawal);
        });

        it("does not allow withdrawal if there are no funds in the contract", async () => {
            await assert.rejects(
                inheritance.methods.withdraw("1").send({ from: accounts[0] }),
                /revert/
            );
        });

        describe("withdrawUSDC", async () => {

            it("allows the administrator to withdraw USDC tokens", async () => {
                const amount = "100";

                // Get the contract USDC token balance before withdrawal.
                let balanceBeforeWithdrawal = await usdcTokenInstance.methods.balanceOf(inheritanceAddress).call();

                // Withdraw USDC tokens.
                let tx = await inheritance.methods.withdrawUSDC(amount).send({ from: accounts[0] });

                // Get the contract USDC token balance after withdrawal.
                let balanceAfterWithdrawal = await usdcTokenInstance.methods.balanceOf(inheritanceAddress).call();

                // Get the difference in USDC token balance.
                let difference = balanceBeforeWithdrawal - balanceAfterWithdrawal;

                assert(difference > amount);
            });

            it("does not allow non-administrators to withdraw USDC tokens", async () => {
                const amount = "100000";

                // Get the contract USDC token balance before withdrawal.
                let balanceBeforeWithdrawal = await usdcTokenInstance.methods.balanceOf(inheritanceAddress).call();

                // Try to withdraw USDC tokens as non-administrator.
                await assert.rejects(
                    inheritance.methods.withdrawUSDC(amount).send({ from: accounts[1] }),
                    /revert/
                );

                // Get the contract USDC token balance after withdrawal attempt.
                let balanceAfterWithdrawal = await usdcTokenInstance.methods.balanceOf(inheritanceAddress).call();

                assert.strictEqual(balanceBeforeWithdrawal, balanceAfterWithdrawal);
            });
        });

    });

    //FUNDAMENTAL FUNCTIONS
    describe("update AliveTimeout", async () => {
        it("allows the administrator to update the alive timeout", async () => {
            const newAliveTimeout = 360;
            await inheritance.methods.updateAliveTimeOut(newAliveTimeout).send({ from: accounts[0] });
            const aliveTimeout = await inheritance.methods.getAliveTimeOut().call();
            assert.strictEqual(Number(aliveTimeout), newAliveTimeout);
        });

        it("does not allow non-administrators to update the alive timeout", async () => {
            const newAliveTimeout = 360;
            await assert.rejects(
                inheritance.methods.updateAliveTimeOut(newAliveTimeout).send({ from: accounts[1] }),
                /revert/
            );
        });
    });

    describe("signalAlive", async () => {

        it("should update administrator's lastAlive timestamp", async () => {
            let administrator = await inheritance.methods.administrator().call();
            const oldTimestamp = administrator.lastAlive;

            await new Promise(r => setTimeout(r, 1000)); //wait 1 second to ensure administrator.lastAlive is different

            await inheritance.methods.signalAlive().send({ from: accounts[0] });

            administrator = await inheritance.methods.administrator().call();
            const newTimestamp = administrator.lastAlive;

            assert(newTimestamp > oldTimestamp);
        });

        it("should not allow non-administrators to signalAlive", async () => {
            await assert.rejects(
                inheritance.methods.signalAlive().send({ from: accounts[1] }),
                /revert/
            );
        });

        it("should emit LogAdministratorAlive event", async () => {
            const tx = await inheritance.methods.signalAlive().send({ from: accounts[0] });
            const event = tx.events.LogAdministratorAlive;
            assert.strictEqual(event.event, "LogAdministratorAlive");
        });


        it("should emit LogAdministratorAlive event with correct data", async () => {
            const aliveTimeOut = await inheritance.methods.getAliveTimeOut().call();
            const tx = await inheritance.methods.signalAlive().send({ from: accounts[0] });

            const event = tx.events.LogAdministratorAlive;
            assert.strictEqual(event.event, "LogAdministratorAlive");
            assert.strictEqual(event.returnValues[0], "Administrator sends a signal to show he is alive.");
            assert.strictEqual(event.returnValues[1], accounts[0]);
            assert.strictEqual(event.returnValues[4], aliveTimeOut);
        });

    });

    describe("requestInheritance", async () => {
        let inheritanceRequests;

        it("should add the sender to the inheritanceRequests array", async () => {
            inheritanceRequests = await inheritance.methods.getInheritanceRequests().call();
            const oldLength = inheritanceRequests.length;

            await inheritance.methods.requestInheritance(accounts[2]).send({ from: accounts[2] });

            inheritanceRequests = await inheritance.methods.getInheritanceRequests().call();
            const newLength = inheritanceRequests.length;

            assert.strictEqual(newLength, oldLength + 1);
            assert.strictEqual(inheritanceRequests[newLength - 1], accounts[2]);
        });

        it("should emit LogRequestToBeHeir event", async () => {
            const tx = await inheritance.methods.requestInheritance(accounts[2]).send({ from: accounts[2] });
            const event = tx.events.LogRequestToBeHeir;
            inheritanceRequests = await inheritance.methods.getInheritanceRequests().call();
            const heirs = await inheritance.methods.getHeirs().call();

            assert.strictEqual(event.event, "LogRequestToBeHeir");
            assert.strictEqual(event.returnValues[0], "User requests to be added as an heir.");
            assert.strictEqual(event.returnValues[1], accounts[2]);
            assert.strictEqual(Number(event.returnValues[2]), inheritanceRequests.length);
            assert.strictEqual(Number(event.returnValues[3]), heirs.length);
        });

        it("should revert if the sender has already requested inheritance", async () => {
            await inheritance.methods.requestInheritance(accounts[2]).send({ from: accounts[2] });
            await assert.rejects(
                inheritance.methods.requestInheritance(accounts[2]).send({ from: accounts[2] }),
                /Address already exists in requests array./
            );
        });
    });

    describe("acceptInheritanceRequest", async () => {
        let inheritanceRequests;
        let heirs;
        const index = 0;
        const share = 30;

        beforeEach(async () => {
            await inheritance.methods.requestInheritance(accounts[2]).send({ from: accounts[2] });
        });

        it("should add the requester to the heirs array", async () => {
            inheritanceRequests = await inheritance.methods.getInheritanceRequests().call();
            heirs = await inheritance.methods.getHeirs().call();
            const oldLength = heirs.length;

            await inheritance.methods.acceptInheritanceRequest(index, accounts[2], share).send({ from: accounts[0], gas: "10000000" });

            inheritanceRequests = await inheritance.methods.getInheritanceRequests().call();
            heirs = await inheritance.methods.getHeirs().call();
            const newLength = heirs.length;

            assert.strictEqual(newLength, oldLength + 1);
            assert.strictEqual(heirs[newLength - 1].heir, accounts[2]);
            assert.strictEqual(Number(heirs[newLength - 1].share), share);
        });

        it("should remove the request from the inheritanceRequests array", async () => {
            inheritanceRequests = await inheritance.methods.getInheritanceRequests().call();

            await inheritance.methods.acceptInheritanceRequest(index, accounts[2], share).send({ from: accounts[0], gas: "10000000" });

            inheritanceRequests = await inheritance.methods.getInheritanceRequests().call();
            assert(!inheritanceRequests.includes(accounts[2]));
        });

        it("should emit LogHeirAccepted event", async () => {
            const tx = await inheritance.methods.acceptInheritanceRequest(index, accounts[2], share).send({ from: accounts[0], gas: "10000000" });
            const event = tx.events.LogHeirAccepted;
            inheritanceRequests = await inheritance.methods.getInheritanceRequests().call();
            heirs = await inheritance.methods.getHeirs().call();

            assert.strictEqual(event.event, "LogHeirAccepted");
            assert.strictEqual(event.returnValues[0], "Administrator accepts user as an heir.");
            assert.strictEqual(event.returnValues[1], accounts[2]);
            assert.strictEqual(Number(event.returnValues[2]), share);
            assert.strictEqual(Number(event.returnValues[3]), inheritanceRequests.length);
            assert.strictEqual(Number(event.returnValues[4]), heirs.length);
        });

        it("should revert if the index is bigger than the requests array length", async () => {
            await assert.rejects(
                inheritance.methods.acceptInheritanceRequest(inheritanceRequests.length + 1, accounts[2], share).send({ from: accounts[0], gas: "10000000" }),
                /The index sent is bigger than the requests array length./
            );
        });

        it("should revert if the address sent doesn't match with the address stored in the requests array", async () => {
            await assert.rejects(
                inheritance.methods.acceptInheritanceRequest(index, accounts[3], share).send({ from: accounts[0], gas: "10000000" }),
                /Address sent doesn't match with the address stored in the requests array./
            );
        });

        it("should revert if the address already exists in heirs array", async () => {
            await inheritance.methods.acceptInheritanceRequest(index, accounts[2], share).send({ from: accounts[0], gas: "10000000" });

            await inheritance.methods.requestInheritance(accounts[2]).send({ from: accounts[2], gas: "10000000" });
            await assert.rejects(
                inheritance.methods.acceptInheritanceRequest(index, accounts[2], share).send({ from: accounts[0], gas: "10000000" }),
                /Address already exists in heirs array./
            );
        });

        it("should revert if the amount of shares exceed the 100% of the Inheritance", async () => {
            const totalShares = await inheritance.methods.getTotalShares().call();
            const remainingShares = 100 - totalShares;

            await assert.rejects(
                inheritance.methods.acceptInheritanceRequest(0, accounts[2], remainingShares + 1).send({ from: accounts[0], gas: "10000000" }),
                /the amount of shares exceed the 100% of the Inheritance./
            );
        });

    });

    describe("rejectInheritanceRequest", async () => {
        let inheritanceRequests;
        const index = 0;

        beforeEach(async () => {
            // Add a request before each test
            await inheritance.methods.requestInheritance(accounts[2]).send({ from: accounts[2] });

            inheritanceRequests = await inheritance.methods.getInheritanceRequests().call();
        });

        it("should remove the request from the inheritanceRequests array and emit LogHeirRejected event", async () => {
            const requester = inheritanceRequests[index];
            const oldLength = inheritanceRequests.length;

            const tx = await inheritance.methods.rejectInheritanceRequest(index, requester).send({ from: accounts[0], gas: "10000000" });

            inheritanceRequests = await inheritance.methods.getInheritanceRequests().call();
            const newLength = inheritanceRequests.length;

            assert.deepStrictEqual(newLength, oldLength - 1);
            assert.deepStrictEqual(inheritanceRequests[index], undefined);

            const event = tx.events.LogHeirRejected;
            const heirs = await inheritance.methods.getHeirs().call();

            assert.strictEqual(event.event, "LogHeirRejected");
            assert.strictEqual(event.returnValues[0], "Administrator rejects user's request to be an heir.");
            assert.strictEqual(event.returnValues[1], requester);
            assert.strictEqual(Number(event.returnValues[2]), inheritanceRequests.length);
            assert.strictEqual(Number(event.returnValues[3]), heirs.length);
        });

        it("should revert if the index is bigger than the requests array length", async () => {
            await assert.rejects(
                inheritance.methods.rejectInheritanceRequest(inheritanceRequests.length + 1, accounts[2]).send({ from: accounts[0], gas: "10000000" }),
                /The index sent is bigger than the requests array length./
            );
        });

        it("should revert if the address sent doesn't match with the address stored in the requests array", async () => {
            await assert.rejects(
                inheritance.methods.rejectInheritanceRequest(index, accounts[3]).send({ from: accounts[0], gas: "10000000" }),
                /Address sent doesn't match with the address stored in the requests array./
            );
        });

        it("should not allow if called by non-administrator accounts", async () => {
            await assert.rejects(
                inheritance.methods.rejectInheritanceRequest(index, accounts[2]).send({ from: accounts[1], gas: "10000000" }),
                /caller is not the owner/
            );
        });
    });

    describe("claimInheritance", async () => {
        let heirs;
        let inheritanceRequests;
        let index;
        let share;

        beforeEach(async () => {
            await inheritance.methods.updateAliveTimeOut(0).send({ from: accounts[0] });

            // Add a request before each test
            await inheritance.methods.requestInheritance(accounts[2]).send({ from: accounts[2] });

            inheritanceRequests = await inheritance.methods.getInheritanceRequests().call();
            index = 0;
            share = 10;

            await inheritance.methods.acceptInheritanceRequest(index, accounts[2], share).send({ from: accounts[0], gas: "10000000" });

            const value = web3.utils.toWei("1", "ether");
            await inheritance.methods.deposit().send({ from: accounts[0], value: value });

            heirs = await inheritance.methods.getHeirs().call();
        });

        it("should transfer the amount of Ether to the heir", async () => {
            const oldBalance = await web3.eth.getBalance(accounts[2]);
            await inheritance.methods.claimInheritance().send({ from: accounts[2], gas: "10000000" });
            const newBalance = await web3.eth.getBalance(accounts[2]);

            assert(Number(newBalance) > Number(oldBalance));
        });

        it("should emit LogHeirClaiming event", async () => {
            const tx = await inheritance.methods.claimInheritance().send({ from: accounts[2], gas: "10000000" });
            heirs = await inheritance.methods.getHeirs().call();

            const event = tx.events.LogHeirClaiming;
            assert.strictEqual(event.event, "LogHeirClaiming");
            assert.strictEqual(event.returnValues[0], "Ether and USDC money sent to the heir.");
            assert.strictEqual(event.returnValues[1], accounts[2]);
            assert.strictEqual(Number(event.returnValues[2]), share);
            assert.strictEqual(event.returnValues[4], heirs[0].etherBalance);
            assert.strictEqual(event.returnValues[6], heirs[0].usdcBalance);
        });
    });

    describe("addNFTDeed", async () => {

        it("should add an NFT to a heir", async () => {
            await inheritance.methods.requestInheritance(accounts[2]).send({ from: accounts[2] });
            await inheritance.methods.acceptInheritanceRequest(0, accounts[2], 10).send({ from: accounts[0], gas: "10000000" });

            await inheritance.methods.requestInheritance(accounts[3]).send({ from: accounts[3] });
            await inheritance.methods.acceptInheritanceRequest(0, accounts[3], 10).send({ from: accounts[0], gas: "10000000" });

            await inheritance.methods.addNFTDeed(accounts[2], 1).send({ from: accounts[0], gas: "10000000" });
            await inheritance.methods.addNFTDeed(accounts[2], 2).send({ from: accounts[0], gas: "10000000" });
            await inheritance.methods.addNFTDeed(accounts[3], 3).send({ from: accounts[0], gas: "10000000" });

            const nftDeedIds = await inheritance.methods.getNFTDeedsByHeirAddress(accounts[2]).call();
            assert.strictEqual(Number(nftDeedIds[0]), 1);
            assert.strictEqual(Number(nftDeedIds[1]), 2);

            const nftDeedIds2 = await inheritance.methods.getNFTDeedsByHeirAddress(accounts[3]).call();
            assert.strictEqual(Number(nftDeedIds2[0]), 3);
        });

        it("should not allow if the address sent doesn't match with any of the heirs", async () => {
            await assert.rejects(
                inheritance.methods.addNFTDeed(accounts[4], 1).send({ from: accounts[0], gas: "10000000" }),
                /Not heir address matched to the one sent./
            );
        });
    });

    //GET FUNCTIONS
    describe("getAliveTimeOut", async () => {
        it("should return the current aliveTimeOut value", async () => {
            const expectedAliveTimeOut = 1000;
            await inheritance.methods.updateAliveTimeOut(expectedAliveTimeOut).send({ from: accounts[0] });

            const aliveTimeOut = await inheritance.methods.getAliveTimeOut().call();

            assert.strictEqual(Number(aliveTimeOut), expectedAliveTimeOut);
        });

        it("should not allow if called by non-administrator accounts", async () => {
            await assert.rejects(
                inheritance.methods.getAliveTimeOut().send({ from: accounts[1] }),
                /caller is not the owner/
            );
        });
    });

    describe("getLastAlive", async () => {
        it("returns the last alive timestamp set in the constructor", async () => {
            await inheritance.methods.signalAlive().send({ from: accounts[0] });
            const block = await web3.eth.getBlock("latest");
            const blockTimestamp = block.timestamp;
            const lastAliveTimestamp = await inheritance.methods.getLastAlive().call();
            assert.strictEqual(Number(lastAliveTimestamp), blockTimestamp);
        });
      
        it("returns a non-zero timestamp after calling signalAlive", async () => {
          await inheritance.methods.signalAlive().send({ from: accounts[0] });
          const lastAliveTimestamp = await inheritance.methods.getLastAlive().call();
          assert.notStrictEqual(Number(lastAliveTimestamp), 0);
        });
    });
      
    describe("getEtherBalance", async () => {
        it("should return the current balance of the contract", async () => {
            const balance = await inheritance.methods.getEtherBalance().call();
            const expectedBalance = await web3.eth.getBalance(inheritanceAddress);

            assert.strictEqual(balance, expectedBalance);
        });
    });

    describe("getUSDCBalance", async () => {
        it("should return the current balance of the contract", async () => {
            const balance = await inheritance.methods.getUSDCBalance().call();
            const expectedBalance = await usdcTokenInstance.methods.balanceOf(inheritanceAddress).call();

            assert.strictEqual(balance, expectedBalance);
        });
    });

    describe("getInheritanceRequests", async () => {
        it("should return the current inheritanceRequests array", async () => {
            await inheritance.methods.requestInheritance(accounts[2]).send({ from: accounts[2] });

            const inheritanceRequests = await inheritance.methods.getInheritanceRequests().call();
            const expectedInheritanceRequests = [accounts[2]];

            assert.deepStrictEqual(inheritanceRequests, expectedInheritanceRequests);
        });
    });

    describe("getHeirs", async () => {
        it("should return the current heirs array", async () => {
            await inheritance.methods.requestInheritance(accounts[2]).send({ from: accounts[2] });

            const index = 0;
            const share = 10;

            await inheritance.methods.acceptInheritanceRequest(index, accounts[2], share).send({ from: accounts[0], gas: "10000000" });

            const heirs = await inheritance.methods.getHeirs().call();
            const expectedHeirs = [accounts[2]];

            assert.deepStrictEqual([heirs[0].heir], expectedHeirs);
            assert.strictEqual(Number(heirs[0].share), share);
        });
    });

    describe("getTotalShares", async () => {
        it("should return the current totalShares value", async () => {

            await inheritance.methods.requestInheritance(accounts[2]).send({ from: accounts[2] });
            const index = 0;
            const share = 10;
            await inheritance.methods.acceptInheritanceRequest(index, accounts[2], share).send({ from: accounts[0], gas: "10000000" });

            await inheritance.methods.requestInheritance(accounts[3]).send({ from: accounts[3] });
            await inheritance.methods.acceptInheritanceRequest(index, accounts[3], share).send({ from: accounts[0], gas: "10000000" });

            const totalShares = await inheritance.methods.getTotalShares().call();
            const expectedTotalShares = 20;

            assert.strictEqual(Number(totalShares), expectedTotalShares);
        });
    });

    describe("getNFTDeedsByHeirAddress", async () => {
        it("should return the current NFTDeedIds array", async () => {
            await inheritance.methods.requestInheritance(accounts[2]).send({ from: accounts[2] });
            await inheritance.methods.acceptInheritanceRequest(0, accounts[2], 10).send({ from: accounts[0], gas: "10000000" });

            await inheritance.methods.requestInheritance(accounts[3]).send({ from: accounts[3] });
            await inheritance.methods.acceptInheritanceRequest(0, accounts[3], 10).send({ from: accounts[0], gas: "10000000" });

            await inheritance.methods.addNFTDeed(accounts[2], 1).send({ from: accounts[0], gas: "10000000" });
            await inheritance.methods.addNFTDeed(accounts[2], 2).send({ from: accounts[0], gas: "10000000" });
            await inheritance.methods.addNFTDeed(accounts[3], 3).send({ from: accounts[0], gas: "10000000" });

            const nftDeedIds = await inheritance.methods.getNFTDeedsByHeirAddress(accounts[2]).call();
            const expectedNFTDeedIds = ["1", "2"];

            assert.deepStrictEqual(nftDeedIds, expectedNFTDeedIds);

            const nftDeedIds2 = await inheritance.methods.getNFTDeedsByHeirAddress(accounts[3]).call();
            const expectedNFTDeedIds2 = ["3"];

            assert.deepStrictEqual(nftDeedIds2, expectedNFTDeedIds2);
        });
    });

});

