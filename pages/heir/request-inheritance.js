import React, { useState, useEffect } from "react";
import { Grid, Button, Input, Container, Card, Form, Message, Icon } from "semantic-ui-react";
import Layout from "../../components/Layout";
import HeirAdministration from "../../ethereum/heirAdministration";
import web3 from "../../ethereum/web3";

const ERROR_MESSAGES = {
    INSUFFICIENT_FUNDS: "Insufficient funds in account.",
    USER_DENIED: "Transaction cancelled by user.",
    NETWORK_NOT_SYNCED: "Ethereum client not synced with network.",
    NOT_A_NUMBER: "No letters or words, must be a number.",
    TRANSACTION_FAILED: "Transaction failed.",
};

const RequestInheritance = () => {
    const [accounts, setAccounts] = useState([]);
    const [pendingInheritances, setPendingInheritances] = useState([]);
    const [rejectedInheritances, setRejectedInheritances] = useState([]);
    const [inheritanceAddress, setInheritanceAddress] = useState('');
    const [requestErrorMessage, setRequestErrorMessage] = useState('');
    const [uploadingRequest, setUploadingRequest] = useState(false);
    const [updatingInheritances, setUpdatingInheritances] = useState(false);

    useEffect(() => {
        const getHeirInformation = async () => {
            try {
                await web3.eth.getAccounts().then(async (accounts) => {
                    setAccounts(accounts);
                    await fetchPendingInheritances(accounts);
                    await fetchRejectedInheritances(accounts);
                });
            } catch (error) {
                console.log(error);
            }
        };
        getHeirInformation();
    }, []);

    const fetchPendingInheritances = async (accounts) => {
        console.log('fetching pending inheritances', accounts[0]);
        const pendingInheritances = await HeirAdministration.methods.getPendingInheritances().call({ from: accounts[0] });
        setPendingInheritances(pendingInheritances);
        console.log(pendingInheritances);
    };

    const fetchRejectedInheritances = async (accounts) => {
        const rejectedInheritances = await HeirAdministration.methods.getRejectedInheritances().call({ from: accounts[0] });
        setRejectedInheritances(rejectedInheritances.slice(-5));
    };

    const requestInheritance = async () => {
        try {
            setUploadingRequest(true);
            setRequestErrorMessage('');
            await HeirAdministration.methods.addPendingInheritance(inheritanceAddress).send({ from: accounts[0] });

            setInheritanceAddress('');
            await fetchPendingInheritances(accounts);
        } catch (error) {
            const errorMessage = error.message;
            switch (errorMessage) {
                case ERROR_MESSAGES.USER_DENIED:
                case ERROR_MESSAGES.NETWORK_NOT_SYNCED:
                case ERROR_MESSAGES.INSUFFICIENT_FUNDS:
                case ERROR_MESSAGES.NOT_A_NUMBER:
                    setRequestErrorMessage(ERROR_MESSAGES[errorMessage]);
                    break;
                default:
                    if (!errorMessage.includes("header")) {
                        setRequestErrorMessage(`${ERROR_MESSAGES.TRANSACTION_FAILED} ${error.message}`);
                    }
            }
        } finally {
            setUploadingRequest(false);
        }
    };

    const updateInheritances = async () => {
        try {
            setUpdatingInheritances(true);
            await HeirAdministration.methods.updatePendingInheritances().send({ from: accounts[0] });
            await fetchPendingInheritances(accounts);
            await fetchRejectedInheritances(accounts);
        } catch (error) {
            console.error("Error updating inheritances:", error);
        } finally {
            setUpdatingInheritances(false);
        }
    };

    return (
        <Layout>
            <Container style={{ maxWidth: '100px', paddingTop: '2rem' }}>
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <Form onSubmit={requestInheritance} error={!!requestErrorMessage}>
                        <Form.Field>
                            <Grid>
                                <Grid.Row>
                                    <Grid.Column width={12}>
                                        <h1>Peticion para ser Heredero:</h1>
                                    </Grid.Column>
                                </Grid.Row>
                                <Grid.Row style={{ paddingTop: '0' }}>
                                    <Grid.Column width={12}>
                                        <Input
                                            placeholder="Escriba la dirección de la herencia"
                                            value={inheritanceAddress}
                                            onChange={(event) => setInheritanceAddress(event.target.value)}
                                            fluid
                                        />
                                    </Grid.Column>
                                    <Grid.Column width={4}>
                                        <Button type="submit" primary disabled={!inheritanceAddress} loading={uploadingRequest}>
                                            Enviar
                                        </Button>
                                    </Grid.Column>
                                </Grid.Row>
                                <Grid.Row style={{ maxHeight: '15px' }}>
                                    <Grid.Column width={15}>
                                        {requestErrorMessage && (
                                            <Message error header="Oops!" content={requestErrorMessage} />
                                        )}
                                    </Grid.Column>
                                </Grid.Row>
                            </Grid>
                        </Form.Field>

                    </Form>
                </div>
            </Container>

            <Grid stackable columns={2} style={{ marginTop: '12rem' }}>
                <Grid.Column>
                    <Card color="teal" fluid>
                        <Card.Content>
                            <Card.Header>Herencias pendientes</Card.Header>
                        </Card.Content>
                        <Card.Content style={{ paddingTop: '0' }}>
                            <ul>
                                {pendingInheritances.map((inheritance, index) => (
                                    <li key={index}>{inheritance}</li>
                                ))}
                            </ul>
                        </Card.Content>
                    </Card>
                </Grid.Column>
                <Grid.Column>
                    <Card color="red" fluid>
                        <Card.Content>
                            <Card.Header>Herencias rechazadas</Card.Header>
                        </Card.Content>
                        <Card.Content style={{ paddingTop: '0' }}>
                            <ul>
                                {rejectedInheritances.map((inheritance, index) => (
                                    <li key={index}>{inheritance}</li>
                                ))}
                            </ul>
                        </Card.Content>
                    </Card>
                </Grid.Column>
            </Grid>
            <div style={{ position: "fixed", bottom: "2rem", right: "2rem" }}>
                <Button
                    color="yellow"
                    onClick={updateInheritances}
                    loading={updatingInheritances}
                >
                    <Icon name="refresh" />
                    Actualizar
                </Button>
            </div>

        </Layout>
    );
};

export default RequestInheritance;
