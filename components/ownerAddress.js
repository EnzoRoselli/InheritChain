import React, { useState, useEffect } from "react";
import { Button, Icon } from "semantic-ui-react";

const OwnerAddress = ({inheritanceAddress}) => {
    const [isCopied, setIsCopied] = useState(false);

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