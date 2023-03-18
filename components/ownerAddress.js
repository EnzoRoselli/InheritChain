import React, { useState, useEffect } from "react";
import { Button, Icon } from "semantic-ui-react";
// import InheritanceFactory from "../../ethereum/factory";
// import web3 from "../ethereum/web3";


const OwnerAddress = ({inheritanceAddress}) => {
    const [isCopied, setIsCopied] = useState(false);
    // const [inheritanceAddress, setInheritanceAddress] = useState("");

    // useEffect(() => {
    //     const getInheritanceContract = async () => {
    //         try {
    //             const accounts = await web3.eth.getAccounts();
    //             await InheritanceFactory.methods.inheritances(accounts[0]).call().then(async (address) => {
    //                 setInheritanceAddress(address);
    //             });
    //         } catch (error) {
    //             console.log(error);
    //         }
    //     };
    //     getInheritanceContract();
    // }, []);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(inheritanceAddress);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 750);
    };

    return (
        <div style={{ display: "flex", alignItems: "center" }}>
            <h2 style={{ marginRight: "1rem" }}>Contract address: {inheritanceAddress}</h2>
            <Button icon onClick={copyToClipboard} style={{ marginBottom: "1rem" }}>
                <Icon name={isCopied ? "check" : "copy outline"} />
            </Button>
        </div>
    );
};

export default OwnerAddress;