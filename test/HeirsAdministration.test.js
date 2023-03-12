const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider({ gasLimit: 100000000 }));

const compiledHeirsAdministration = require("../ethereum/build/HeirsAdministration.json");

let accounts;
let heirsAdministration;

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();

    heirsAdministration = await new web3.eth.Contract(compiledHeirsAdministration.abi)
        .deploy({ data: compiledHeirsAdministration.evm.bytecode.object })
        .send({ from: accounts[0], gas: "10000000" });
});

describe("Heirs Administration contract", async () => {
    describe("addPendingInheritance", async () => {
        it("adds an inheritance to the pending inheritances array", async () => {
            await heirsAdministration.methods.addPendingInheritance(accounts[1]).send({ from: accounts[0], gas: "10000000" });

            const pendingInheritances = await heirsAdministration.methods.getPendingInheritances().call({ from: accounts[0] });

            assert.strictEqual(pendingInheritances.length, 1);
            assert.strictEqual(pendingInheritances[0], accounts[1]);
        });

        it("does not allow adding more than 3 pending inheritances", async () => {
            await heirsAdministration.methods.addPendingInheritance(accounts[1]).send({ from: accounts[0], gas: "10000000" });
            await heirsAdministration.methods.addPendingInheritance(accounts[1]).send({ from: accounts[0], gas: "10000000" });
            await heirsAdministration.methods.addPendingInheritance(accounts[1]).send({ from: accounts[0], gas: "10000000" });

            try {
                await heirsAdministration.methods.addPendingInheritance(accounts[1]).send({ from: accounts[0], gas: "10000000" });
                assert.fail("An exception should have been thrown");
            } catch (error) {
                assert(error.message.indexOf("You can only request up to 3 inheritances") >= 0);
            }
        });
    });

    describe("removePendingInheritance", async () => {
        it("removes an inheritance from the pending inheritances array", async () => {
            await heirsAdministration.methods.addPendingInheritance(accounts[1]).send({ from: accounts[0], gas: "10000000" });
            await heirsAdministration.methods.addPendingInheritance(accounts[2]).send({ from: accounts[0], gas: "10000000" });

            let pendingInheritances = await heirsAdministration.methods.getPendingInheritances().call({ from: accounts[0] });
            assert.strictEqual(pendingInheritances.length, 2);

            await heirsAdministration.methods.removePendingInheritance(accounts[1]).send({ from: accounts[0], gas: "10000000" });

            pendingInheritances = await heirsAdministration.methods.getPendingInheritances().call({ from: accounts[0] });
            pendingInheritances = pendingInheritances.filter(value => value != 0);

            assert.strictEqual(pendingInheritances.length, 1);
        });

        it("adds an inheritance to the rejected inheritances array", async () => {
            await heirsAdministration.methods.addPendingInheritance(accounts[1]).send({ from: accounts[0], gas: "10000000" });
            await heirsAdministration.methods.removePendingInheritance(accounts[1]).send({ from: accounts[0], gas: "10000000" });

            const rejectedInheritances = await heirsAdministration.methods.getRejectedInheritances().call({ from: accounts[0] });
            assert.strictEqual(rejectedInheritances.length, 1);
            assert.strictEqual(rejectedInheritances[0], accounts[1]);
        });

        it("emits an event when removing an inheritance from the pending inheritances array", async () => {
            await heirsAdministration.methods.addPendingInheritance(accounts[1]).send({ from: accounts[0], gas: "10000000" });

            const tx = await heirsAdministration.methods.removePendingInheritance(accounts[1]).send({ from: accounts[0], gas: "10000000" });
            const pendingInheritanceRemovedEvents = tx.events.PendingInheritanceRemoved;

            assert.strictEqual(pendingInheritanceRemovedEvents.event, "PendingInheritanceRemoved");
            assert.strictEqual(pendingInheritanceRemovedEvents.returnValues[0], accounts[0]);
            assert.strictEqual(pendingInheritanceRemovedEvents.returnValues[1], accounts[1]);
        });
    });

    describe("getPendingInheritances", async () => {
        it("returns an array of pending inheritances for the caller", async () => {
            await heirsAdministration.methods.addPendingInheritance(accounts[1]).send({ from: accounts[0], gas: "10000000" });
            await heirsAdministration.methods.addPendingInheritance(accounts[2]).send({ from: accounts[0], gas: "10000000" });
            await heirsAdministration.methods.addPendingInheritance(accounts[3]).send({ from: accounts[0], gas: "10000000" });

            const pendingInheritances = await heirsAdministration.methods.getPendingInheritances().call({ from: accounts[0] });

            assert.strictEqual(pendingInheritances.length, 3);
            assert.strictEqual(pendingInheritances[0], accounts[1]);
            assert.strictEqual(pendingInheritances[1], accounts[2]);
            assert.strictEqual(pendingInheritances[2], accounts[3]);
        });
    });

    describe("getRejectedInheritances", async () => {
        it("returns an array of rejected inheritances for the caller", async () => {
            await heirsAdministration.methods.addPendingInheritance(accounts[1]).send({ from: accounts[0], gas: "10000000" });
            await heirsAdministration.methods.removePendingInheritance(accounts[1]).send({ from: accounts[0], gas: "10000000" });

            const rejectedInheritances = await heirsAdministration.methods.getRejectedInheritances().call({ from: accounts[0] });

            assert.strictEqual(rejectedInheritances.length, 1);
            assert.strictEqual(rejectedInheritances[0], accounts[1]);
        });
    });

    describe("hasPendingInheritances", async () => {
        it("returns true if the caller has pending inheritances", async () => {
            await heirsAdministration.methods.addPendingInheritance(accounts[1]).send({ from: accounts[0], gas: "10000000" });

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
            await heirsAdministration.methods.addPendingInheritance(accounts[1]).send({ from: accounts[0], gas: "10000000" });
            await heirsAdministration.methods.removePendingInheritance(accounts[1]).send({ from: accounts[0], gas: "10000000" });

            const hasRejectedInheritances = await heirsAdministration.methods.hasRejectedInheritances().call({ from: accounts[0] });

            assert.strictEqual(hasRejectedInheritances, true);
        });

        it("returns false if the caller has no rejected inheritances", async () => {
            const hasRejectedInheritances = await heirsAdministration.methods.hasRejectedInheritances().call({ from: accounts[1] });

            assert.strictEqual(hasRejectedInheritances, false);
        });
    });
});





