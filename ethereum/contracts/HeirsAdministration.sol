// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract HeirsAdministration {

    mapping(address => address[]) public pendingInheritances; // mapping(heirAddresses => inheritanceAddresses)
    mapping(address => address[]) public rejectedInheritances; // mapping(heirAddresses => inheritanceAddresses)
    
    event PendingInheritanceRemoved(address indexed heir, address indexed inheritance);

    function addPendingInheritance(address _inheritance) public {
        require(pendingInheritances[msg.sender].length < 3, "You can only request up to 3 inheritances");
        pendingInheritances[msg.sender].push(_inheritance);
    }

    function removePendingInheritance(address _inheritance) public {
        for (uint i = 0; i < pendingInheritances[msg.sender].length; i++) {
            if (pendingInheritances[msg.sender][i] == _inheritance) {
                rejectedInheritances[msg.sender].push(_inheritance);
                delete pendingInheritances[msg.sender][i];

                emit PendingInheritanceRemoved(msg.sender, _inheritance);
                break;
            }
        }
    }
    
    //GET FUNCTIONS
    function getPendingInheritances() public view returns (address[] memory) {
        return pendingInheritances[msg.sender];
    }

    function getRejectedInheritances() public view returns (address[] memory) {
        return rejectedInheritances[msg.sender];
    }

    function hasPendingInheritances() public view returns (bool) {
        return pendingInheritances[msg.sender].length > 0;
    }

    function hasRejectedInheritances() public view returns (bool) {
        return rejectedInheritances[msg.sender].length > 0;
    }
}