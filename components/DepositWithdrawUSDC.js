import React, { useState, useEffect } from "react";
import { Card, Form, Input, Button, Message, Grid } from "semantic-ui-react";
import web3 from "../ethereum/web3";
import usdcAbi from "../ethereum/usdc_compiled_contract/FiatTokenV2_1.json";

const INSUFFICIENT_FUNDS_ERROR = "Insufficient funds in account.";
const USER_DENIED_ERROR = "Transaction cancelled by user.";
const NETWORK_NOT_SYNCED_ERROR = "Ethereum client not synced with network.";
const NOT_A_NUMBER_ERROR = "No letters or words, must be a number.";
const TRANSACTION_FAILED_ERROR = "Transaction failed.";

const DepositWithdrawUSDC = ({ inheritanceContract, accounts }) => {
    const [usdcContract, setUsdcContract] = useState(null);
    const [usdcBalance, setUsdcBalance] = useState("");
    const [depositErrorMessage, setDepositErrorMessage] = useState("");
    const [withdrawErrorMessage, setWithdrawErrorMessage] = useState("");
    const [depositAmount, setDepositAmount] = useState("");
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [loadingButton, setLoadingButton] = useState(null);

    useEffect(() => {
        const loadUSDCContract = async () => {
            const contract = await new web3.eth.Contract(
                usdcAbi,
                process.env.NEXT_PUBLIC_USDC_GOERLI_ADDRESS
            );
            setUsdcContract(contract);
        };

        const loadUSDCBalance = async () => {
            if (inheritanceContract) {
                const balance = await inheritanceContract.methods.getUSDCBalance().call();
                setUsdcBalance(balance);
            }
        };

        loadUSDCContract();
        if (inheritanceContract) {
            loadUSDCBalance();
        }
    }, [inheritanceContract]);

    const formatUSDCBalance = () => {
        const length = usdcBalance.length;
        if (length < 6) return usdcBalance;

        const firstPart = usdcBalance.slice(0, length - 6);
        const secondPart = usdcBalance.slice(length - 6, length - 4);
        return `${firstPart}.${secondPart}`;
    };

    const handleTransaction = async (method, amount, setErrorMessage) => {
        setDepositErrorMessage("");
        setWithdrawErrorMessage("");
        try {
            if (method === usdcContract.methods.transfer) {
                await method(inheritanceContract.options.address, amount * 10 ** 6).send({ from: accounts[0] });
                setUsdcBalance(await inheritanceContract.methods.getUSDCBalance().call());
            } else {
                await method(amount * 10 ** 6).send({ from: accounts[0] });
                setUsdcBalance(await inheritanceContract.methods.getUSDCBalance().call());
            }
        } catch (error) {
            const errorHandlers = { // the way it works is that if the error message is equal to the key, it will execute the function and pass the error as an argument
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

    const handleDepositUSDC = async () => {
        setLoadingButton("deposit");
        await handleTransaction(
            usdcContract.methods.transfer,
            depositAmount,
            setDepositErrorMessage
        );
    };

    const handleWithdrawUSDC = async () => {
        setLoadingButton("withdraw");
        await handleTransaction(
            inheritanceContract.methods.withdrawUSDC,
            withdrawAmount,
            setWithdrawErrorMessage
        );
    };

    return (
        <Card fluid>
            <Card.Content>
                <Card.Header align="center">USDC</Card.Header>
                <Card.Meta>Balance: {formatUSDCBalance(usdcBalance)} USDC</Card.Meta>
                <Card.Description>
                    <Form error={!!depositErrorMessage || !!withdrawErrorMessage}>
                        <Form.Field>
                            <label>Depositar USDC</label>
                            <Grid>
                                <Grid.Row>
                                    <Grid.Column width={12}>
                                        <Input
                                            label="USDC"
                                            labelPosition="right"
                                            type="number"
                                            value={depositAmount}
                                            placeholder="50"
                                            onChange={(event) => setDepositAmount(event.target.value)}
                                        />
                                    </Grid.Column>
                                    <Grid.Column width={4}>
                                        <Button
                                            primary
                                            onClick={handleDepositUSDC}
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
                            <label>Retirar USDC</label>
                            <Grid>
                                <Grid.Row>
                                    <Grid.Column width={12}>
                                        <Input
                                            label="USDC"
                                            labelPosition="right"
                                            type="number"
                                            value={withdrawAmount}
                                            placeholder="50"
                                            onChange={(event) => setWithdrawAmount(event.target.value)}
                                        />
                                    </Grid.Column>
                                    <Grid.Column width={4}>
                                        <Button
                                            onClick={handleWithdrawUSDC}
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

export default DepositWithdrawUSDC;
