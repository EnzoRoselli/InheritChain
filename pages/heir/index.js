import React, { useState, useEffect } from "react";
import { Grid, Button, Input } from "semantic-ui-react";
import Layout from "../../components/Layout";
import HeirAdministration from "../../ethereum/heirAdministration";
import web3 from "../../ethereum/web3";

const HeirPage = () => {
    const [accounts, setAccounts] = useState([]);
    const [pendingInheritances, setPendingInheritances] = useState([]);
    const [rejectedInheritances, setRejectedInheritances] = useState([]);
    const [ownerAddress, setOwnerAddress] = useState('');

    const fetchPendingInheritances = async () => {
        const pendingInheritances = await HeirAdministration.methods.getPendingInheritances().call({ from: accounts[0] });
        setPendingInheritances(pendingInheritances);
    };

    const fetchRejectedInheritances = async () => {
        const rejectedInheritances = await HeirAdministration.methods.getRejectedInheritances().call({ from: accounts[0] });
        setRejectedInheritances(rejectedInheritances.slice(-5));
    };

    useEffect(() => {
        const getHeirInformation = async () => {
            try {
                const accounts = await web3.eth.getAccounts();
                setAccounts(accounts);

                await fetchPendingInheritances();
                await fetchRejectedInheritances();

            } catch (error) {
                console.log(error);
            }
        };
        getHeirInformation();
    }, []);

    const handleRequestInheritance = async () => {
        try {
            await heirAdministration.methods.addPendingInheritance(ownerAddress).send({ from: accounts[0] });
            // Update the pendingInheritances state
            await fetchPendingInheritances();
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <Layout>
            <Grid>
                <Grid.Row>
                    <Grid.Column>
                        <h3>Pending Inheritances</h3>
                        <ul>
                            {pendingInheritances.map((inh, index) => (
                                <li key={index}>{inh}</li>
                            ))}
                        </ul>
                    </Grid.Column>
                    <Grid.Column>
                        <h3>Rejected Inheritances (Last 5)</h3>
                        <ul>
                            {rejectedInheritances.map((inh, index) => (
                                <li key={index}>{inh}</li>
                            ))}
                        </ul>
                    </Grid.Column>
                </Grid.Row>

                <Grid.Row>
                    <Grid.Column>
                        <h3>Request Inheritance</h3>
                        <Input
                            placeholder="Enter owner address"
                            value={ownerAddress}
                            onChange={(event) => setOwnerAddress(event.target.value)}
                        />
                        <Button onClick={handleRequestInheritance} primary>
                            Request Inheritance
                        </Button>
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        </Layout>
    );
};

export default HeirPage;
