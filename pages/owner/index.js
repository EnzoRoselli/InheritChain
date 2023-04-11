import React, { useState, useEffect } from "react";
import { Grid } from "semantic-ui-react";
import Layout from "../../components/Layout";
import InheritanceFactory from "../../ethereum/factory";
import web3 from "../../ethereum/web3";
import Inheritance from "../../ethereum/build/Inheritance.json";
import DepositWithdrawEther from "../../components/DepositWithdrawEther";
import DepositWithdrawUSDC from "../../components/DepositWithdrawUSDC";
import AliveSignal from "../../components/AliveSignal";
import OwnerAddress from "../../components/ownerAddress";
import MessageComponent from "../../components/Message";

const OwnerPage = () => {
    const [inheritanceContract, setInheritanceContract] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [inheritanceAddress, setInheritanceAddress] = useState([]);

    useEffect(() => {
        const getInheritanceContract = async () => {
            try {
                await web3.eth.getAccounts().then(async (accounts) => {
                    setAccounts(accounts);
                    await InheritanceFactory.methods.inheritances(accounts[0]).call().then(async (address) => {
                        console.log(address);
                        setInheritanceAddress([address]);
                        const inheritanceContract = await new web3.eth.Contract(Inheritance.abi, address);
                        setInheritanceContract(inheritanceContract);
                        console.log(inheritanceContract);
                    });
                });
            } catch (error) {
                console.log(error);
            }
        };
        getInheritanceContract();
    }, []);

    return (
        <Layout>
            <OwnerAddress
                inheritanceAddress={inheritanceAddress}
            />
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
                <Grid.Row>
                    <Grid.Column>
                        <MessageComponent 
                            inheritanceContract={inheritanceContract}
                            accounts={accounts}
                        />
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        </Layout>
    );
};

export default OwnerPage;
