const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider({ gasLimit: 100000000 }));

const compiledHeirsAdministration = require("../ethereum/build/HeirsAdministration.json");
const compiledFactory = require("../ethereum/build/InheritanceFactory.json");
const compiledInheritance = require("../ethereum/build/Inheritance.json");
const compiledUSDC = require("../ethereum/build/TestToken.json");

let accounts;
let heirsAdministration;
let factory;
let inheritanceAddress;
let inheritanceAddress2;
let inheritanceAddress3;
let inheritanceAddress4;

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

    await factory.methods.createInheritance("180", usdcTokenAddress).send({ from: accounts[1], gas: "10000000" });
    inheritanceAddress2 = await factory.methods.inheritances(accounts[1]).call();
    await factory.methods.createInheritance("180", usdcTokenAddress).send({ from: accounts[2], gas: "10000000" });
    inheritanceAddress3 = await factory.methods.inheritances(accounts[2]).call();
    await factory.methods.createInheritance("180", usdcTokenAddress).send({ from: accounts[3], gas: "10000000" });
    inheritanceAddress4 = await factory.methods.inheritances(accounts[3]).call();

    heirsAdministration = await new web3.eth.Contract(compiledHeirsAdministration.abi)
        .deploy({ data: compiledHeirsAdministration.evm.bytecode.object })
        .send({ from: accounts[0], gas: "10000000" });
});

describe("Heirs Administration contract", async () => {
    describe("addPendingInheritance", async () => {
        it("adds an inheritance to the pending inheritances array", async () => {
            await heirsAdministration.methods.addPendingInheritance(inheritanceAddress).send({ from: accounts[0], gas: "10000000" });

            const pendingInheritances = await heirsAdministration.methods.getPendingInheritances().call({ from: accounts[0] });

            assert.strictEqual(pendingInheritances.length, 1);
            assert.strictEqual(pendingInheritances[0], inheritanceAddress);
        });

        it("does not allow adding more than 3 pending inheritances", async () => {
            await heirsAdministration.methods.addPendingInheritance(inheritanceAddress).send({ from: accounts[0], gas: "10000000" });
            await heirsAdministration.methods.addPendingInheritance(inheritanceAddress2).send({ from: accounts[0], gas: "10000000" });
            await heirsAdministration.methods.addPendingInheritance(inheritanceAddress3).send({ from: accounts[0], gas: "10000000" });

            try {
                await heirsAdministration.methods.addPendingInheritance(inheritanceAddress4).send({ from: accounts[0], gas: "10000000" });
                assert.fail("An exception should have been thrown");
            } catch (error) {
                assert(error.message.indexOf("You can only request up to 3 inheritances") >= 0);
            }
        });
    });

    describe("removePendingInheritance", async () => {
        it("removes an inheritance from the pending inheritances array", async () => {
            await heirsAdministration.methods.addPendingInheritance(inheritanceAddress).send({ from: accounts[0], gas: "10000000" });
            await heirsAdministration.methods.addPendingInheritance(inheritanceAddress2).send({ from: accounts[0], gas: "10000000" });

            let pendingInheritances = await heirsAdministration.methods.getPendingInheritances().call({ from: accounts[0] });
            assert.strictEqual(pendingInheritances.length, 2);

            await heirsAdministration.methods.removePendingInheritanceToRejected(inheritanceAddress2).send({ from: accounts[0], gas: "10000000" });

            pendingInheritances = await heirsAdministration.methods.getPendingInheritances().call({ from: accounts[0] });
            pendingInheritances = pendingInheritances.filter(value => value != 0);

            assert.strictEqual(pendingInheritances.length, 1);
        });

        it("adds an inheritance to the rejected inheritances array", async () => {
            await heirsAdministration.methods.addPendingInheritance(inheritanceAddress).send({ from: accounts[0], gas: "10000000" });
            await heirsAdministration.methods.removePendingInheritanceToRejected(inheritanceAddress).send({ from: accounts[0], gas: "10000000" });

            const rejectedInheritances = await heirsAdministration.methods.getRejectedInheritances().call({ from: accounts[0] });
            assert.strictEqual(rejectedInheritances.length, 1);
            assert.strictEqual(rejectedInheritances[0], inheritanceAddress);
        });

        it("emits an event when removing an inheritance from the pending inheritances array", async () => {
            await heirsAdministration.methods.addPendingInheritance(inheritanceAddress).send({ from: accounts[0], gas: "10000000" });

            const tx = await heirsAdministration.methods.removePendingInheritanceToRejected(inheritanceAddress).send({ from: accounts[0], gas: "10000000" });
            const pendingInheritanceRemovedEvents = tx.events.PendingInheritanceRemoved;

            assert.strictEqual(pendingInheritanceRemovedEvents.event, "PendingInheritanceRemoved");
            assert.strictEqual(pendingInheritanceRemovedEvents.returnValues[0], accounts[0]);
            assert.strictEqual(pendingInheritanceRemovedEvents.returnValues[1], inheritanceAddress);
        });
    });

    describe("updatePendingInheritances", async () => {
        it("moves inheritance from pending to approved if the caller is added as an heir", async () => {
            await heirsAdministration.methods.addPendingInheritance(inheritanceAddress).send({ from: accounts[0], gas: "10000000" });

            const inheritance = await new web3.eth.Contract(compiledInheritance.abi, inheritanceAddress);
            await inheritance.methods.acceptInheritanceRequest(0, accounts[0], 50).send({ from: accounts[0], gas: "10000000" });

            await heirsAdministration.methods.updatePendingInheritances().send({ from: accounts[0], gas: "10000000" });

            const pendingInheritances = await heirsAdministration.methods.getPendingInheritances().call({ from: accounts[0] });
            const approvedInheritances = await heirsAdministration.methods.getApprovedInheritances().call();

            assert.strictEqual(pendingInheritances.length, 0);
            assert.strictEqual(approvedInheritances.length, 1);
            assert.strictEqual(approvedInheritances[0], inheritanceAddress);
        });

        it("moves approved inheritance from pending to approved inheritances array", async () => {
            await heirsAdministration.methods.addPendingInheritance(inheritanceAddress).send({ from: accounts[1], gas: "10000000" });

            const inheritance = await new web3.eth.Contract(compiledInheritance.abi, inheritanceAddress);
            await inheritance.methods.acceptInheritanceRequest(0, accounts[1], 50).send({ from: accounts[0], gas: "10000000" });

            await heirsAdministration.methods.updatePendingInheritances().send({ from: accounts[1], gas: "10000000" });

            const approvedInheritances = await heirsAdministration.methods.getApprovedInheritances().call({ from: accounts[1] });
            assert.strictEqual(approvedInheritances.length, 1);
            assert.strictEqual(approvedInheritances[0], inheritanceAddress);

            const pendingInheritances = await heirsAdministration.methods.getPendingInheritances().call({ from: accounts[1] });
            assert.strictEqual(pendingInheritances.length, 0);
        });

        it("moves rejected inheritance from pending to rejected inheritances array", async () => {
            await heirsAdministration.methods.addPendingInheritance(inheritanceAddress).send({ from: accounts[1], gas: "10000000" });

            const inheritance = await new web3.eth.Contract(compiledInheritance.abi, inheritanceAddress);
            await inheritance.methods.rejectInheritanceRequest(0, accounts[1]).send({ from: accounts[0], gas: "10000000" });

            await heirsAdministration.methods.updatePendingInheritances().send({ from: accounts[1], gas: "10000000" });

            const rejectedInheritances = await heirsAdministration.methods.getRejectedInheritances().call({ from: accounts[1] });
            assert.strictEqual(rejectedInheritances.length, 1);
            assert.strictEqual(rejectedInheritances[0], inheritanceAddress);

            const pendingInheritances = await heirsAdministration.methods.getPendingInheritances().call({ from: accounts[1] });
            assert.strictEqual(pendingInheritances.length, 0);
        });
    });

    describe("getPendingInheritances", async () => {
        it("returns an array of pending inheritances for the caller", async () => {
            await heirsAdministration.methods.addPendingInheritance(inheritanceAddress).send({ from: accounts[0], gas: "10000000" });
            await heirsAdministration.methods.addPendingInheritance(inheritanceAddress2).send({ from: accounts[0], gas: "10000000" });
            await heirsAdministration.methods.addPendingInheritance(inheritanceAddress3).send({ from: accounts[0], gas: "10000000" });

            const pendingInheritances = await heirsAdministration.methods.getPendingInheritances().call({ from: accounts[0] });

            assert.strictEqual(pendingInheritances.length, 3);
            assert.strictEqual(pendingInheritances[0], inheritanceAddress);
            assert.strictEqual(pendingInheritances[1], inheritanceAddress2);
            assert.strictEqual(pendingInheritances[2], inheritanceAddress3);
        });
    });

    describe("getRejectedInheritances", async () => {
        it("returns an array of rejected inheritances for the caller", async () => {
            await heirsAdministration.methods.addPendingInheritance(inheritanceAddress).send({ from: accounts[0], gas: "10000000" });
            await heirsAdministration.methods.removePendingInheritanceToRejected(inheritanceAddress).send({ from: accounts[0], gas: "10000000" });

            const rejectedInheritances = await heirsAdministration.methods.getRejectedInheritances().call({ from: accounts[0] });

            assert.strictEqual(rejectedInheritances.length, 1);
            assert.strictEqual(rejectedInheritances[0], inheritanceAddress);
        });
    });

    describe("hasPendingInheritances", async () => {
        it("returns true if the caller has pending inheritances", async () => {
            await heirsAdministration.methods.addPendingInheritance(inheritanceAddress).send({ from: accounts[0], gas: "10000000" });

            const hasPendingInheritances = await heirsAdministration.methods.hasPendingInheritances().call({ from: accounts[0] });

            assert.strictEqual(hasPendingInheritances, true);
        });

        it("returns false if the caller has no pending inheritances", async () => {
            const hasPendingInheritances = await heirsAdministration.methods.hasPendingInheritances().call({ from: accounts[1] });

            assert.strictEqual(hasPendingInheritances, false);
        });
    });

    describe("hasRejectedInheritances", async () => {
        it("returns true if the caller has rejected inheritances", async () => {
            await heirsAdministration.methods.addPendingInheritance(inheritanceAddress).send({ from: accounts[0], gas: "10000000" });
            await heirsAdministration.methods.removePendingInheritanceToRejected(inheritanceAddress).send({ from: accounts[0], gas: "10000000" });

            const hasRejectedInheritances = await heirsAdministration.methods.hasRejectedInheritances().call({ from: accounts[0] });

            assert.strictEqual(hasRejectedInheritances, true);
        });

        it("returns false if the caller has no rejected inheritances", async () => {
            const hasRejectedInheritances = await heirsAdministration.methods.hasRejectedInheritances().call({ from: accounts[1] });

            assert.strictEqual(hasRejectedInheritances, false);
        });
    });
});
