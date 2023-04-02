//This file is used to deploy the contract to the goerli test network. 

// To run this file, we need to install the following libraries: 
// npm install --save-dev @truffle/hdwallet-provider
// npm install --save-dev web3
// npm install --save-dev dotenv

//to run this file, we need to run the following command:
//node deploy.js

//To deploy the contract, we need to have a mnemonic, and we need to connect to a network using that mnemonic.
require("dotenv").config({path: "../.env"}); // This is a library that allows us to use environment variables.
const HDWalletProvider = require("@truffle/hdwallet-provider"); // This is a library that allows us to connect to a network using a mnemonic, and it will unlock the first account that is generated from that mnemonic.
const Web3 = require("web3"); // This is a library that allows us to interact with the Ethereum network.
const fs = require("fs");
const compiledFactory = require("./build/InheritanceFactory.json"); // This is the compiled contract that we want to deploy.
const titleDeed = require("./build/TitleDeed.json");
const heirsAdministration = require("./build/HeirsAdministration.json");

const USDC_GOERLI_ADDRESS = process.env.USDC_TOKEN_ADDRESS;
const PIGNATA_API_KEY = process.env.PIGNATA_API_KEY;
const PIGNATA_API_SECRET = process.env.PIGNATA_API_SECRET;

const mnemonic = process.env.MNEMONIC; // This is the mnemonic that we will use to connect to the network.
const serverUrl = process.env.SERVER_URL; // This is the url of the network that we want to connect to.

const provider = new HDWalletProvider(
    mnemonic,
    serverUrl
); // The first argument is the mnemonic of the account we want to unlock, the second argument is the network we want to connect to.
const web3 = new Web3(provider); // This is the instance of web3 that we will use to interact with the network.

const deploy = async () => {
    try {
    const accounts = await web3.eth.getAccounts();

    console.log("Attempting to deploy from account", accounts[0]);

    const resultFactory = await new web3.eth.Contract(compiledFactory.abi)
        .deploy({ data: compiledFactory.evm.bytecode.object })
        .send({ gas: "10000000", from: accounts[0] });
    console.log("Factory contract deployed to", resultFactory.options.address);

    const resultTitleDeed = await new web3.eth.Contract(titleDeed.abi) 
        .deploy({ data: titleDeed.evm.bytecode.object })
        .send({ gas: "10000000", from: accounts[0] });
    console.log("TitleDeed contract deployed to", resultTitleDeed.options.address);

    const resultHeirsAdministration = await new web3.eth.Contract(heirsAdministration.abi)
        .deploy({ data: heirsAdministration.evm.bytecode.object })
        .send({ gas: "10000000", from: accounts[0] });
    console.log("HeirsAdministration contract deployed to", resultHeirsAdministration.options.address);
    
    fs.writeFile(
        "../.env.local",
        `NEXT_PUBLIC_FACTORY_ADDRESS=${resultFactory.options.address}\nNEXT_PUBLIC_TITLE_DEED_ADDRESS=${resultTitleDeed.options.address}\nNEXT_PUBLIC_HEIRS_ADMINISTRATION_ADDRESS=${resultHeirsAdministration.options.address}\nNEXT_PUBLIC_USDC_GOERLI_ADDRESS=${USDC_GOERLI_ADDRESS}\nNEXT_PUBLIC_PIGNATA_API_KEY=${PIGNATA_API_KEY}\nNEXT_PUBLIC_PIGNATA_API_SECRET=${PIGNATA_API_SECRET}`,
        (err) => {
          if (err) throw err;
          console.log("Addresses written to .env.local");
        }
    );
    } catch (error) {
        console.error("Error during deployment:", error);
    } finally {
      provider.engine.stop();
    }
};

deploy();