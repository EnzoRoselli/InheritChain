// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Example class - a mock class using delivering from ERC20
contract TestToken is ERC20 {
    constructor() ERC20("Basic", "BSC") {
        _mint(msg.sender, 10000000000);        
    }

    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }
}

