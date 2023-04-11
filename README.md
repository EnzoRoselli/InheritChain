# **:link: InheritChain**

InheritChain is a blockchain-based application designed to automate the inheritance process, eliminating the need for intermediaries. Users can assume one of two roles within the platform: **heirs** or **owners**. The application facilitates user registration for both roles, enabling owners to periodically signal their status as alive, while heirs can claim their inheritance based on the owner's status.

The core of InheritChain is built upon Solidity Smart Contracts, which run on the Ethereum network. These Smart Contracts autonomously handle the inheritance logic, ensuring a secure, transparent, and trustless environment for the distribution of assets. Using the blockchain technology, InheritChain bypasses the need for middlemen, such as lawyers or notaries, reducing time, cost, and potential disputes in the inheritance process.

In addition to the blockchain component, InheritChain features an external database for storing data that is not suitable for on-chain storage, such as large text messages or multimedia files. The platform also features a practical and easy-to-use frontend, which aims to simplify the experience for users navigating the inheritance process.

## **Roles and Functionalities :busts_in_silhouette:**

### **Owner Role :busts_in_silhouette:**

- Can load money in USDC and Ether.
- Supports using NFTs for documents (property titles, insurance policies, formal wills, etc.) and photos/images.
- Can upload videos and messages for heirs (initially, only text messages are included in the MVP).
- Must periodically press a button to send a signal indicating they are alive; the time period can be configured within the application.
- Can accept or reject users who wish to subscribe as heirs.
- Can decide which users inherit their assets and in what amounts, with the option to select multiple heirs for certain items.

### **Heir Role :busts_in_silhouette:**

- Can request to subscribe as an heir with another user.
- Can press a button to claim inheritance at any time, with the application verifying if the owner has passed away.
- Can access distributed assets and assets from the owner once they pass away.
- Can transfer ownership of inherited NFTs and money to other subscribed heirs, as well as messages they have received.

## **Technologies Used :computer:**

- JavaScript
- React
- Next.js
- Solidity
- web3.js library
- Ganache
- Truffle
- Goerli testnet
- Infura
- OpenZeppelin library
- Semantic-UI
- Mocha
- Axios
- IPFS with Pinata

## Requirements :clipboard:

- Git
- npm
- Node
- MySQL8
- Pinata Key and Secret
- USDC Goerli Smart Contract address to use


## **Installation and Setup :wrench:**

1. Clone the project
    
    ```
    git clone https://github.com/EnzoRoselli/InheritChain
    ```
    
2. Change to the project directory
    
    ```
    cd InheritChain
    ```
    
3. Install dependencies
    
    ```
    npm install
    ```
4. Create a .env file in the root of the project. Add the following environment variables:

    ```
    MNEMONIC=your_mnemonic_phrase_here
    SERVER_URL=https://goerli.infura.io/v3/2f1717a3aa2d47f7b27fab5b48ec46ba #You can use this one if you wish.
    USDC_TOKEN_ADDRESS=0x07865c6E87B9F70255377e024ace6630C1Eaa37F #You can use this one if you wish.
    PIGNATA_API_KEY=your_pinata_api_key_here
    PIGNATA_API_SECRET=your_pinata_secret_here
    ```
5. Compile the Smart Contracts
    
    ```
    cd ethereum
    node compile.js
    ```
    
6. Deploy the Smart Contracts to testnet blockchain
    
    ```
    cd ethereum
    node deploy.js
    ```
    
7. Start the local development server
    
    ```
    npm run dev
    ```
    

## **Accessing the Application :computer:**

- Open your browser and navigate to **[http://localhost:3000](http://localhost:3000/)**

## **Contributing :handshake:**

1. Fork the project
2. Create a feature branch using GitFlow
3. Commit your changes
4. Push to the branch
5. Open a pull request

## **Branching (GitFlow) :sparkler:**

- Feature: Local/remote branch for a feature. After merging it into develop, delete it.
- Develop: Stores all completed features that haven’t yet been released.
- Master: Stores the finished releases.

---

By Enzo Roselli
