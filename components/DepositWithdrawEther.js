import React, { useState, useEffect } from "react";
import { Card, Form, Input, Button, Message, Grid } from "semantic-ui-react";
import web3 from "../ethereum/web3";

const INSUFFICIENT_FUNDS_ERROR = "Insufficient funds in account.";
const USER_DENIED_ERROR = "Transaction cancelled by user.";
const NETWORK_NOT_SYNCED_ERROR = "Ethereum client not synced with network.";
const NOT_A_NUMBER_ERROR = "No letters or words, must be a number.";
const TRANSACTION_FAILED_ERROR = "Transaction failed.";

const DepositWithdrawEther = ({ inheritanceContract, accounts }) => {
    const [depositErrorMessage, setDepositErrorMessage] = useState("");
    const [withdrawErrorMessage, setWithdrawErrorMessage] = useState("");
    const [depositAmount, setDepositAmount] = useState("");
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [loadingButton, setLoadingButton] = useState(null);
    const [etherBalance, setEtherBalance] = useState("");

    useEffect(() => {
        const fetchEtherBalance = async () => {
            if (inheritanceContract) {
                const balance = await inheritanceContract.methods.getEtherBalance().call();
                setEtherBalance(web3.utils.fromWei(balance, "ether"));
            }
        };
        fetchEtherBalance();
    }, [inheritanceContract]);

    const handleTransaction = async (method, amount, setErrorMessage) => {
        setDepositErrorMessage("");
        setWithdrawErrorMessage("");
        try {
            if (method === inheritanceContract.methods.withdraw) {
                await method(web3.utils.toWei(amount, "ether")).send({ from: accounts[0] });
            } else {
                await method().send({ from: accounts[0], value: web3.utils.toWei(amount, "ether") });
            }
            setEtherBalance(web3.utils.fromWei(await inheritanceContract.methods.getEtherBalance().call(), "ether"));
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
            setWithdrawAmount("");
            setDepositAmount("");
        }
    };

    const handleDeposit = async () => {
        setLoadingButton("deposit");
        await handleTransaction(inheritanceContract.methods.deposit, depositAmount, setDepositErrorMessage);
    };

    const handleWithdraw = async () => {
        setLoadingButton("withdraw");
        await handleTransaction(inheritanceContract.methods.withdraw, withdrawAmount, setWithdrawErrorMessage);
    };

    return (
        <Card color="green" fluid>
            <Card.Content>
                <Card.Header align="center">Ether</Card.Header>
                <Card.Meta>Balance: {etherBalance} ethers</Card.Meta>
                <Card.Description>
                    <Form error={!!depositErrorMessage || !!withdrawErrorMessage}>
                        <Form.Field>
                            <label>Depositar Ether</label>
                            <Grid>
                                <Grid.Row>
                                    <Grid.Column width={12}>
                                        <Input
                                            label="Ether"
                                            labelPosition="right"
                                            placeholder=".01"
                                            onChange={(event) => setDepositAmount(event.target.value)}
                                            value={depositAmount}
                                            type="number"
                                            fluid
                                        />
                                    </Grid.Column>
                                    <Grid.Column width={4}>
                                        <Button
                                            primary
                                            onClick={handleDeposit}
                                            fluid
                                            disabled={loadingButton === "withdraw"}
                                            loading={loadingButton === "deposit"}
                                        >
                                            {loadingButton === "deposit" ? "Depositando..." : "Depositar"}
                                        </Button>
                                    </Grid.Column>
                                </Grid.Row>
                            </Grid>
                        </Form.Field>
                        {depositErrorMessage && (
                            <Message error header="Oops!" content={depositErrorMessage} />
                        )}
                        <Form.Field>
                            <label>Retirar Ether</label>
                            <Grid>
                                <Grid.Row>
                                    <Grid.Column width={12}>
                                        <Input
                                            label="Ether"
                                            labelPosition="right"
                                            placeholder=".01"
                                            onChange={(event) => setWithdrawAmount(event.target.value)}
                                            value={withdrawAmount}
                                            type="number"
                                            fluid
                                        />
                                    </Grid.Column>
                                    <Grid.Column width={4}>
                                        <Button
                                            onClick={handleWithdraw}
                                            fluid
                                            color="red"
                                            disabled={loadingButton === "deposit"}
                                            loading={loadingButton === "withdraw"}
                                        >
                                            {loadingButton === "withdraw" ? "Retirando..." : "Retirar"}
                                        </Button>
                                    </Grid.Column>
                                </Grid.Row>
                            </Grid>
                        </Form.Field>
                        {withdrawErrorMessage && (
                            <Message error header="Oops!" content={withdrawErrorMessage} />
                        )}
                    </Form>
                </Card.Description>
            </Card.Content>
        </Card>
    );
};

export default DepositWithdrawEther;
