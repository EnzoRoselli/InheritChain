import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { Button, Input, Icon, Form, Message, Card, Container, Loader, Image, Segment, Grid, List, Progress } from "semantic-ui-react";
import web3 from "../../ethereum/web3";
import InheritanceFactory from "../../ethereum/factory";
import Inheritance from "../../ethereum/build/Inheritance.json";

const ERROR_MESSAGES = {
    INSUFFICIENT_FUNDS: "Insufficient funds in account.",
    USER_DENIED: "Transaction cancelled by user.",
    NETWORK_NOT_SYNCED: "Ethereum client not synced with network.",
    NOT_A_NUMBER: "No letters or words, must be a number.",
    TRANSACTION_FAILED: "Transaction failed.",
};

const HeirManagement = () => {
    const [inheritanceContract, setInheritanceContract] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [inheritanceRequests, setInheritanceRequests] = useState([]);
    const [heirs, setHeirs] = useState([]);
    const [totalShares, setTotalShares] = useState(0);

    useEffect(() => {
        const getInheritanceContract = async () => {
            try {
                await web3.eth.getAccounts().then(async (accounts) => {
                    setAccounts(accounts);
                    await InheritanceFactory.methods.inheritances(accounts[0]).call().then(async (address) => {
                        const inheritanceContract = await new web3.eth.Contract(Inheritance.abi, address);
                        setInheritanceContract(inheritanceContract);
                    });
                });
            } catch (error) {
                console.log(error);
            }
        };
        getInheritanceContract();
    }, []);

    useEffect(() => {
        if (inheritanceContract) {
            fetchInheritanceRequests();
            fetchHeirs();
            fetchTotalShares();
        }
    }, [inheritanceContract]);

    const fetchInheritanceRequests = async () => {
        const requests = await inheritanceContract.methods.getInheritanceRequests().call({ from: accounts[0] });
        setInheritanceRequests(requests);
    };

    const fetchHeirs = async () => {
        const fetchedHeirs = await inheritanceContract.methods.getHeirs().call({ from: accounts[0] });
        setHeirs(fetchedHeirs);
        console.log("fetchedHeirs", fetchedHeirs);
    };

    const fetchTotalShares = async () => {
        const shares = await inheritanceContract.methods.getTotalShares().call({ from: accounts[0] });
        setTotalShares(shares);
    };

    const acceptRequest = async (index, requester, currentShare) => {
        try {
            if (isNaN(currentShare)) throw new Error("Invalid share value.");
            await inheritanceContract.methods
                .acceptInheritanceRequest(index, requester, currentShare)
                .send({ from: accounts[0] });
            await fetchInheritanceRequests();
            await fetchHeirs();
            await fetchTotalShares();
        } catch (error) {
            throw error;
        }
    };

    const rejectRequest = async (index, requester) => {
        try {
            await inheritanceContract.methods
                .rejectInheritanceRequest(index, requester)
                .send({ from: accounts[0] });
            await fetchInheritanceRequests();
            await fetchHeirs();
        } catch (error) {
            throw error;
        }
    };

    const RequestItem = ({ index, request, acceptRequest, rejectRequest }) => {
        const [currentShare, setCurrentShare] = useState("");
        const [requestErrorMessage, setRequestErrorMessage] = useState("");
        const [acceptLoading, setAcceptLoading] = useState(false);
        const [rejectLoading, setRejectLoading] = useState(false);

        const handleAcceptRequest = async (index, request, currentShare) => {
            setAcceptLoading(true);
            setRequestErrorMessage("");
            try {
                await acceptRequest(index, request, currentShare);
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
                        setRequestErrorMessage(`${ERROR_MESSAGES.TRANSACTION_FAILED} ${error.message}`);
                }
            } finally {
                setAcceptLoading(false);
            }
        };

        const handleRejectRequest = async (index, request) => {
            setRejectLoading(true);
            setRequestErrorMessage("");
            try {
                await rejectRequest(index, request);
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
                        setRequestErrorMessage(`${ERROR_MESSAGES.TRANSACTION_FAILED} ${error.message}`);
                }
            } finally {
                setRejectLoading(false);
            }
        };

        return (
            <List.Item key={index}>
                <Grid>
                    <Grid.Row columns={4} verticalAlign="middle">
                        <Grid.Column width={6}>
                            <span>{request}</span>
                        </Grid.Column>
                        <Grid.Column width={4}>
                            <Input
                                type="number"
                                placeholder="15%"
                                value={currentShare}
                                onChange={e => setCurrentShare(e.target.value)}
                                style={{ width: '7rem', marginRight: '1rem', marginLeft: '7rem' }}
                            />
                        </Grid.Column>
                        <Grid.Column width={3}>
                            <Button
                                onClick={() => handleAcceptRequest(index, request, currentShare)}
                                color="green"
                                loading={acceptLoading}
                                disabled={rejectLoading || currentShare.trim() === ""}
                                style={{ marginRight: '0.5rem' }}
                            >
                                Aceptar
                            </Button>
                        </Grid.Column>
                        <Grid.Column width={3}>
                            <Button
                                onClick={() => handleRejectRequest(index, request)}
                                color="red"
                                loading={rejectLoading}
                                disabled={acceptLoading}
                            >
                                Rechazar
                            </Button>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
                {requestErrorMessage && (
                    <Message error header="Oops!" content={requestErrorMessage} style={{ width: '53.5rem' }} />
                )}
            </List.Item>
        );
    };

    const remainingShare = 100 - totalShares;

    return (
        <>
            <Layout />
            <div style={{ padding: '0 10rem' }}>
                <Grid stackable columns={2} style={{ marginTop: '5rem' }}>
                    <Grid.Column>
                        <Card color="yellow" fluid>
                            <Card.Content>
                                <Card.Header>
                                    Pedidos de Herencia
                                    <span style={{ float: "right", color: "gray" }}>
                                        Porcentaje disponible: {remainingShare}%
                                    </span>
                                </Card.Header>
                                <Card.Description style={{ paddingTop: '0', marginTop: '1rem' }}>
                                    <List relaxed>
                                        {inheritanceRequests.map((request, index) => (
                                            <RequestItem
                                                key={index}
                                                index={index}
                                                request={request}
                                                acceptRequest={acceptRequest}
                                                rejectRequest={rejectRequest}
                                            />
                                        ))}
                                    </List>
                                </Card.Description>
                            </Card.Content>
                        </Card>
                    </Grid.Column>
                    <Grid.Column>
                        <Card color="green" fluid>
                            <Card.Content>
                                <Card.Header>
                                    Herederos actuales
                                    <Progress
                                        percent={totalShares}
                                        color="green"
                                        active
                                        style={{ width: "50%", float: "right" }}
                                        progress
                                    />
                                </Card.Header>
                                <Card.Description style={{ paddingTop: '0' }}>
                                    <List relaxed>
                                        {heirs.map((heir, index) => (
                                            <List.Item key={index}>
                                                <Grid>
                                                    <Grid.Row columns={2} verticalAlign="middle">
                                                        <Grid.Column width={10}>
                                                            <span>{heir[0]}</span>
                                                        </Grid.Column>
                                                        <Grid.Column width={6} textAlign="right">
                                                            <span style={{ color: 'gray' }}>Parte de herencia: {heir[1]}%</span>
                                                        </Grid.Column>
                                                    </Grid.Row>
                                                </Grid>
                                            </List.Item>
                                        ))}
                                    </List>
                                </Card.Description>
                            </Card.Content>
                        </Card>

                    </Grid.Column>
                </Grid>
            </div>
        </>
    );

};

export default HeirManagement;