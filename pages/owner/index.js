import React, { useState, useEffect } from "react";
import { Grid, Button, Icon } from "semantic-ui-react";
import Layout from "../../components/Layout";
import InheritanceFactory from "../../ethereum/factory";
import web3 from "../../ethereum/web3";
import Inheritance from "../../ethereum/build/Inheritance.json";
import DepositWithdrawEther from "../../components/DepositWithdrawEther";
import DepositWithdrawUSDC from "../../components/DepositWithdrawUSDC";
import AliveSignal from "../../components/AliveSignal";

const RegistryPage = () => {
    const [inheritanceContract, setInheritanceContract] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [inheritanceAddress, setInheritanceAddress] = useState("");
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        const getInheritanceContract = async () => {
            try {
                const accounts = await web3.eth.getAccounts();
                setAccounts(accounts);
                await InheritanceFactory.methods.inheritances(accounts[0]).call().then(async (address) => {
                    setInheritanceAddress(address);
                    const inheritanceContract = await new web3.eth.Contract(Inheritance.abi, address);
                    setInheritanceContract(inheritanceContract);
                });
            } catch (error) {
                console.log(error);
            }
        };
        getInheritanceContract();
    }, []);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(inheritanceAddress);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 750);
    };

    return (
        <Layout>
            <div style={{ display: "flex", alignItems: "center" }}>
                <h2 style={{ marginRight: "1rem" }}>Contract address: {inheritanceAddress}</h2>
                <Button icon onClick={copyToClipboard} style={{ marginBottom: "1rem" }}>
                    <Icon name={isCopied ? "check" : "copy outline"} />
                </Button>
            </div>
            <Grid>
                <Grid.Row>
                    <Grid.Column width={7}>
                        <DepositWithdrawEther
                            inheritanceContract={inheritanceContract}
                            accounts={accounts}
                        />
                    </Grid.Column>
                    <Grid.Column width={7}>
                        <DepositWithdrawUSDC
                            inheritanceContract={inheritanceContract}
                            accounts={accounts}
                        />
                    </Grid.Column>
                </Grid.Row>

                <Grid.Row>
                    <Grid.Column width={7}>
                        <AliveSignal
                            inheritanceContract={inheritanceContract}
                            accounts={accounts}
                        />
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        </Layout>
    );
};

export default RegistryPage;
