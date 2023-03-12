import React, { useState, useEffect } from "react";
import { Grid } from "semantic-ui-react";
import Layout from "../../components/Layout";
import InheritanceFactory from "../../ethereum/factory";
import web3 from "../../ethereum/web3";
import Inheritance from "../../ethereum/build/Inheritance.json";
import DepositWithdrawEther from "../../components/DepositWithdrawEther";
import DepositWithdrawUSDC from "../../components/DepositWithdrawUSDC";

const RegistryPage = () => {
    const [inheritanceContract, setInheritanceContract] = useState(null);
    const [accounts, setAccounts] = useState([]);

    useEffect(() => {
        const getInheritanceContract = async () => {
            try {
                const accounts = await web3.eth.getAccounts();
                setAccounts(accounts);
                const inheritanceAddress = await InheritanceFactory.methods.inheritances(accounts[0]).call();
                const inheritanceContract = new web3.eth.Contract(Inheritance.abi, inheritanceAddress);
                setInheritanceContract(inheritanceContract);
            } catch (error) {
                console.log(error);
            }
        };
        getInheritanceContract();
    }, []);

    return (
        <Layout>
            <Grid>
                <Grid.Row>
                    <Grid.Column width={7}>
                        <DepositWithdrawEther
                            inheritanceContract={inheritanceContract}
                            accounts={accounts}
                        />
                    </Grid.Column>
                </Grid.Row>

                <Grid.Row>
                    <Grid.Column width={7}>
                        <DepositWithdrawUSDC
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
