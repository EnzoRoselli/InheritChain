// This file is used to create an instance of web3 library and export it to other files.
import Web3 from "web3";
 
let web3;
 
//this code is called when the file is executed. This is the first thing that is executed when the file is executed.
if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") { //typeof let us know if a variable is defined, if exists. "typeof window.ethereum !== "undefined"" let us know if web3 library has been injected in the browser
    // We are in the browser and metamask is running.
    web3 = new Web3(window.ethereum);
} else {
    // We are on the server *OR* the user is not running metamask
    // We are going to connect to the Infura API. Infura is a service that allows us to connect to a remote Ethereum network. We can use Infura to connect to the main Ethereum network, the Goerli test network.
    const provider = new Web3.providers.HttpProvider(
        "https://goerli.infura.io/v3/2f1717a3aa2d47f7b27fab5b48ec46ba" //This is the address of the network we want to connect to. We get this address from infura.io website.
    );
    web3 = new Web3(provider); // The provider is the network we want to connect to. 
}
 
export default web3;