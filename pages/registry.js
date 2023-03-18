import React, { useState } from "react";
import Layout from "../components/Layout";
import { Grid, Segment, Button, Input, Popup, Icon, Form, Message } from "semantic-ui-react";
import web3 from "../ethereum/web3";
import InheritanceFactory from "../ethereum/factory";
import { useRouter } from "next/router";

const ERROR_MESSAGES = {
  INSUFFICIENT_FUNDS: "Insufficient funds in account.",
  USER_DENIED: "Transaction cancelled by user.",
  NETWORK_NOT_SYNCED: "Ethereum client not synced with network.",
  NOT_A_NUMBER: "No letters or words, must be a number.",
  TRANSACTION_FAILED: "Transaction failed.",
};

const RegistryPage = () => {
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [ownerErrorMessage, setOwnerErrorMessage] = useState("");
  const [heirLoading, setHeirLoading] = useState(false);
  const [heirErrorMessage, setHeirErrorMessage] = useState("");
  const [aliveTimeOut, setAliveTimeOut] = useState(0);
  const [inheritanceAddress, setInheritanceAddress] = useState("");
  const router = useRouter();

  const registerOwner = async (event) => {
    event.preventDefault();
    setOwnerLoading(true);
    setOwnerErrorMessage("");

    try {
      const accounts = await web3.eth.getAccounts();
      await InheritanceFactory.methods.createInheritance(aliveTimeOut, process.env.NEXT_PUBLIC_USDC_GOERLI_ADDRESS).send({ from: accounts[0] }).then(async () => {
        await InheritanceFactory.methods.inheritances(accounts[0]).call().then(async (address) => {
          setInheritanceAddress(address);
        });
      });

      router.push({
        pathname: "/owner",
        query: { inheritanceAddress: inheritanceAddress },
      });
    } catch (error) {
      const errorMessage = error.message;
      switch (errorMessage) {
        case ERROR_MESSAGES.USER_DENIED:
        case ERROR_MESSAGES.NETWORK_NOT_SYNCED:
        case ERROR_MESSAGES.INSUFFICIENT_FUNDS:
        case ERROR_MESSAGES.NOT_A_NUMBER:
          setOwnerErrorMessage(ERROR_MESSAGES[errorMessage]);
          break;
        default:
          setOwnerErrorMessage(`${ERROR_MESSAGES.TRANSACTION_FAILED} ${error.message}`);
      }
    } finally {
      setOwnerLoading(false);
    }
  };

  const registerHeir = async (event) => {
    event.preventDefault();
    setHeirLoading(true);
    setHeirErrorMessage("");

    try {
      router.push("/heir");
    } catch (error) {
      setHeirErrorMessage(`${ERROR_MESSAGES.TRANSACTION_FAILED} ${error.message}`);
    } finally {
      setHeirLoading(false);
    }
  };


  return (
    <Layout>
      <Grid>
        <Grid.Row>
          <Grid.Column>
            <Segment>
              <Form onSubmit={registerOwner} error={!!ownerErrorMessage}>
                <Form.Field>
                  <h1>Registrarme como Dueño</h1>
                  <p>Si sos dueño, podes registrarte en la plataforma para cargar tu dinero, inmuebles, y titulos de propiedad para que tus herederos puedan acceder a él.</p>
                  <h3>
                    <Popup
                      trigger={<Icon name="info circle" />}
                      content="Tiempo durante el cual das fe de que estas vivo, una vez pasado este tiempo deberas volver a confirmar que estas vivo. Caso contrario tus herederos podran acceder a tus bienes."
                    />
                    Tiempo de vida
                  </h3>
                  <div style={{ marginBottom: "20px" }}>
                    <Input
                      label="segs"
                      labelPosition="right"
                      placeholder="600"
                      type="number"
                      onChange={(event) => setAliveTimeOut(event.target.value)}
                    />
                  </div>
                </Form.Field>
                <Message error header="Oops!" content={ownerErrorMessage} />
                <Button loading={ownerLoading} primary style={{ marginBottom: "10px", width: "400px", padding: "13px" }} disabled={heirLoading}>
                  <Icon name="add circle" />
                  Crear Herencia
                </Button>
              </Form>

            </Segment>
          </Grid.Column>
        </Grid.Row>

        <Grid.Row>
          <Grid.Column>
            <Segment>
              <h1>Registrarme como Heredero</h1>
              <p>Si sos heredero, podes registrarte en la plataforma para que puedas acceder a todos los bienes heredados.</p>
              <Form onSubmit={registerHeir} error={!!heirErrorMessage}>
                <Message error header="Oops!" content={heirErrorMessage} />
                <Button
                  loading={heirLoading}
                  primary
                  style={{ marginBottom: "10px", width: "400px", padding: "13px" }}
                  disabled={ownerLoading}
                >
                  Registrarme como Heredero
                </Button>
              </Form>
            </Segment>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </Layout>
  );
};

export default RegistryPage;
