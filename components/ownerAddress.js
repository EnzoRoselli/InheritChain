import React, { useState, useEffect } from "react";
import { Button, Icon, Dropdown } from "semantic-ui-react";

const OwnerAddress = ({ inheritanceAddress, selectable = false, onAddressSelected }) => {
    const [isCopied, setIsCopied] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState(
        inheritanceAddress && inheritanceAddress.length > 0 ? inheritanceAddress[0] : ""
    );

    useEffect(() => {
        if (inheritanceAddress && inheritanceAddress.length > 0) {
            setSelectedAddress(inheritanceAddress[0]);
        }
    }, [inheritanceAddress]);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(selectedAddress);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 750);
    };

    const handleAddressChange = (e, { value }) => {
        setSelectedAddress(value);
        if (onAddressSelected) {
            onAddressSelected(value);
        }
    };

    return (
        <div style={{ display: "flex", alignItems: "center" }}>
            <h2 style={{ marginRight: "1rem" }}>
                Direccion del Contrato:{" "}
                {selectable && inheritanceAddress.length > 1 ? (
                    <Dropdown
                        inline
                        options={inheritanceAddress.map((address) => ({
                            key: address,
                            text: address,
                            value: address,
                        }))}
                        value={selectedAddress}
                        onChange={handleAddressChange}
                    />
                ) : (
                    selectedAddress
                )}
            </h2>
            <Button icon onClick={copyToClipboard} style={{ marginBottom: "1rem" }}>
                <Icon name={isCopied ? "check" : "copy outline"} />
            </Button>
        </div>
    );
};

export default OwnerAddress;
