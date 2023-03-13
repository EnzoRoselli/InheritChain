import React, { useState, useEffect } from "react";
import { Card, Form, Input, Button, Message, Grid, Popup, Icon } from "semantic-ui-react";
import web3 from "../ethereum/web3";

const INSUFFICIENT_FUNDS_ERROR = "Insufficient funds in account.";
const USER_DENIED_ERROR = "Transaction cancelled by user.";
const NETWORK_NOT_SYNCED_ERROR = "Ethereum client not synced with network.";
const NOT_A_NUMBER_ERROR = "No letters or words, must be a number.";
const TRANSACTION_FAILED_ERROR = "Transaction failed.";

const AliveSignal = ({ inheritanceContract, accounts }) => {
    const [aliveSignalErrorMessage, setAliveSignalErrorMessage] = useState("");
    const [aliveTimeOutErrorMessage, setAliveTimeOutErrorMessage] = useState("");
    const [loadingButton, setLoadingButton] = useState(null);
    const [lastAlive, setLastAlive] = useState("");
    const [aliveTimeOut, setAliveTimeOut] = useState("");
    const [aliveTimeOutInput, setAliveTimeOutInput] = useState("");
    const [isAdministratorDead, setIsAdministratorDead] = useState(false);

    useEffect(() => {
        const fetchAliveInfo = async () => {
            if (inheritanceContract) {
                const lastAlive = await inheritanceContract.methods.getLastAlive().call({ from: accounts[0] });
                formatLastAliveDate(lastAlive);

                const aliveTimeOut = await inheritanceContract.methods.getAliveTimeOut().call({ from: accounts[0] });
                setAliveTimeOut(aliveTimeOut);

                const result = await inheritanceContract.methods.isAdministratorDead().call();
                setIsAdministratorDead(result);
            }
        };
        fetchAliveInfo();
    }, [inheritanceContract]);

    useEffect(() => {
        let interval = null;
        if (aliveTimeOut && !isAdministratorDead) {
            interval = setInterval(async () => {
                const result = await inheritanceContract.methods.isAdministratorDead().call();
                setIsAdministratorDead(result);
            }, aliveTimeOut * 1000);
        }
        return () => clearInterval(interval);
    }, [aliveTimeOut, inheritanceContract, isAdministratorDead, lastAlive]);

    const formatLastAliveDate = (lastAlive) => {
        const lastAliveDate = new Date(parseInt(lastAlive) * 1000);
        const options = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric'
        };
        const formattedLastAliveDate = lastAliveDate.toLocaleString('es-ES', options);
        setLastAlive(formattedLastAliveDate);
    };

    const handleAliveFunctions = async (method, aliveTimeOut, setErrorMessage) => {
        setAliveSignalErrorMessage("");
        setAliveTimeOutErrorMessage("");
        try {
            if (method === inheritanceContract.methods.signalAlive) {
                await method().send({ from: accounts[0] });
                formatLastAliveDate(await inheritanceContract.methods.getLastAlive().call({ from: accounts[0] }));
            } else {
                await method(aliveTimeOut).send({ from: accounts[0] });
                setAliveTimeOut(await inheritanceContract.methods.getAliveTimeOut().call({ from: accounts[0] }));
            }
            const result = await inheritanceContract.methods.isAdministratorDead().call();
            setIsAdministratorDead(result);
        } catch (error) {
            const errorHandlers = {
                [USER_DENIED_ERROR]: setErrorMessage,
                [NETWORK_NOT_SYNCED_ERROR]: setErrorMessage,
                [INSUFFICIENT_FUNDS_ERROR]: setErrorMessage,
                [NOT_A_NUMBER_ERROR]: setErrorMessage,
                default: () => setErrorMessage(`${TRANSACTION_FAILED_ERROR} ${error.message}`),
            };
            const handleError = errorHandlers[error.message] || errorHandlers.default;
            handleError(error);
        } finally {
            setLoadingButton(null);
            setAliveTimeOutInput("");
        }
    };

    const handleAliveSignal = async () => {
        setLoadingButton("aliveSignal");
        await handleAliveFunctions(inheritanceContract.methods.signalAlive, 0, setAliveSignalErrorMessage);
    };

    const updateAliveTimeOut = async () => {
        setLoadingButton("aliveTimeOut");
        await handleAliveFunctions(inheritanceContract.methods.updateAliveTimeOut, aliveTimeOutInput, setAliveTimeOutErrorMessage);
    };

    return (
        <Card color="yellow" fluid>
            <Card.Content>
                <Card.Header align="center">Ultima señal de vida: {lastAlive}</Card.Header>
                <Card.Description>
                    <Form error={!!aliveSignalErrorMessage || !!aliveTimeOutErrorMessage}>
                        <Form.Field align="center">
                            <Grid>
                                <Grid.Row>
                                    <Grid.Column width={16}>
                                        <h3 style={{ display: 'inline-block', marginRight: '10px' }}>Enviar señal de vida</h3>
                                        <Button
                                            color="yellow"
                                            style={{ display: 'inline-block' }}
                                            onClick={handleAliveSignal}
                                            loading={loadingButton === "aliveSignal"}
                                            disabled={loadingButton === "aliveTimeOut"}
                                        >
                                            {loadingButton === "aliveSignal" ? "Enviando..." : "Enviar"}
                                        </Button>
                                    </Grid.Column>
                                </Grid.Row>
                            </Grid>
                        </Form.Field>
                        <Form.Field>
                            <label>Tiempo de vida: {aliveTimeOut} segs</label>
                            <Grid>
                                <div style={{ marginTop: '10px' }}>
                                    <Popup
                                        trigger={<Icon name="info circle" />}
                                        content="Tiempo durante el cual das fe de que estás vivo, una vez pasado este tiempo deberás volver a confirmar que estás vivo. Caso contrario tus herederos podrán acceder a tus bienes."
                                        position="top center"
                                    />
                                    <label>Editar señal de vida</label>
                                </div>
                                <Grid.Row style={{ marginTop: '-6px' }}>
                                    <Grid.Column width={12}>
                                        <Input
                                            label="segs"
                                            labelPosition="right"
                                            placeholder="180"
                                            onChange={(event) => setAliveTimeOutInput(event.target.value)}
                                            value={aliveTimeOutInput}
                                            type="number"
                                            fluid
                                        />
                                    </Grid.Column>
                                    <Grid.Column width={4}>
                                        <Button
                                            onClick={updateAliveTimeOut}
                                            fluid
                                            color="yellow"
                                            disabled={loadingButton === "aliveSignal"}
                                            loading={loadingButton === "aliveTimeOut"}
                                        >
                                            {loadingButton === "aliveTimeOut" ? "Editando..." : "Editar"}
                                        </Button>
                                    </Grid.Column>
                                </Grid.Row>
                            </Grid>
                        </Form.Field>
                        <h1>Usted esta: {isAdministratorDead ? <span style={{ color: 'red' }}>Muerto</span> : <span style={{ color: 'green' }}>Vivo</span>}</h1>

                        {aliveSignalErrorMessage && (
                            <Message error header="Oops!" content={aliveSignalErrorMessage} />
                        )}
                        {aliveTimeOutErrorMessage && (
                            <Message error header="Oops!" content={aliveTimeOutErrorMessage} />
                        )}
                    </Form>
                </Card.Description>
            </Card.Content>
        </Card>
    );
};

export default AliveSignal;