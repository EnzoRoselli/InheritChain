// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "./Inheritance.sol";

contract HeirsAdministration {
    mapping(address => address[]) private pendingInheritances; // mapping(heirAddresses => inheritanceAddresses)
    mapping(address => address[]) private rejectedInheritances; // mapping(heirAddresses => inheritanceAddresses)
    mapping(address => address[]) private approvedInheritances; // mapping(heirAddresses => inheritanceAddresses)

    event PendingInheritanceRemoved(
        address indexed heir,
        address indexed inheritance,
        bool approved
    );

    function addPendingInheritance(address _inheritance) public {
        require(
            pendingInheritances[msg.sender].length < 3,
            "You can only request up to 3 inheritances"
        );

        Inheritance inheritanceContract = Inheritance(_inheritance);
        inheritanceContract.requestInheritance(msg.sender);

        pendingInheritances[msg.sender].push(_inheritance);
    }

    function removePendingInheritanceToRejected(address _inheritance) public {
        uint indexToRemove;
        bool found = false;

        for (uint i = 0; i < pendingInheritances[msg.sender].length; i++) {
            if (pendingInheritances[msg.sender][i] == _inheritance) {
                indexToRemove = i;
                found = true;
                break;
            }
        }

        require(found, "Inheritance not found in pending list");

        rejectedInheritances[msg.sender].push(_inheritance);

        pendingInheritances[msg.sender][indexToRemove] = pendingInheritances[msg.sender][pendingInheritances[msg.sender].length - 1];
        pendingInheritances[msg.sender].pop();

        emit PendingInheritanceRemoved(msg.sender, _inheritance, false);
    }

    function removePendingInheritanceToApproved(address _inheritance) private {
        uint indexToRemove;
        bool found = false;

        for (uint i = 0; i < pendingInheritances[msg.sender].length; i++) {
            if (pendingInheritances[msg.sender][i] == _inheritance) {
                indexToRemove = i;
                found = true;
                break;
            }
        }

        require(found, "Inheritance not found in pending list");

        approvedInheritances[msg.sender].push(_inheritance);

        pendingInheritances[msg.sender][indexToRemove] = pendingInheritances[msg.sender][pendingInheritances[msg.sender].length - 1];
        pendingInheritances[msg.sender].pop();

        emit PendingInheritanceRemoved(msg.sender, _inheritance, true);
    }

    function updatePendingInheritances() public {
        for (uint i = 0; i < pendingInheritances[msg.sender].length; i++) {
            address inheritanceAddress = pendingInheritances[msg.sender][i];
            Inheritance inheritanceContract = Inheritance(inheritanceAddress);

            address[] memory requests = inheritanceContract
                .getInheritanceRequests();

            bool foundInRequests = false;
            for (uint j = 0; j < requests.length; j++) {
                if (requests[j] == msg.sender) {
                    foundInRequests = true;
                    break;
                }
            }

            if (foundInRequests) {
                continue;
            }

            address[] memory heirs = inheritanceContract.getHeirsAddresses();
            bool foundInHeirs = false;
            for (uint k = 0; k < heirs.length; k++) {
                if (heirs[k] == msg.sender) {
                    foundInHeirs = true;
                    break;
                }
            }

            if (foundInHeirs) {
                removePendingInheritanceToApproved(inheritanceAddress);
            } else {
                removePendingInheritanceToRejected(inheritanceAddress);
            }
        }
    }

    //GET FUNCTIONS
    function getPendingInheritances() public view returns (address[] memory) {
        return pendingInheritances[msg.sender];
    }

    function getApprovedInheritances() public view returns (address[] memory) {
        return approvedInheritances[msg.sender];
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

    function hasApprovedInheritances() public view returns (bool) {
        return approvedInheritances[msg.sender].length > 0;
    }
}
