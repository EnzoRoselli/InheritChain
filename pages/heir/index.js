import React, { useState, useEffect } from "react";
import { Grid, Button, Icon, Segment, Card, Image, Popup, List, Divider, Statistic } from "semantic-ui-react";
import Layout from "../../components/Layout";
import web3 from "../../ethereum/web3";
import Inheritance from "../../ethereum/build/Inheritance.json";
import OwnerAddress from "../../components/ownerAddress";
import HeirsAdministration from "../../ethereum/heirAdministration";
import TitleDeed from "../../ethereum/titleDeed";
import { getMessagesByHeirAddress } from "../../components/js/message";

const HeirPage = () => {
    const [inheritanceContract, setInheritanceContract] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [approvedInheritances, setApprovedInheritances] = useState([]);
    const [inheritanceAddress, setInheritanceAddress] = useState("");
    const [updatingInheritances, setUpdatingInheritances] = useState(false);
    const [heirNFTs, setHeirNFTs] = useState([]);
    const [isAdministratorDead, setIsAdministratorDead] = useState(null);
    const [etherBalance, setEtherBalance] = useState("");
    const [usdcBalance, setUsdcBalance] = useState("");
    const [claimed, setClaimed] = useState({});
    const [claimingInheritance, setClaimingInheritance] = useState(false);
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        const getHeirInformation = async () => {
            try {
                await web3.eth.getAccounts().then(async (accounts) => {
                    setAccounts(accounts);
                    await fetchApprovedInheritances(accounts);
                });
            } catch (error) {
                console.log(error);
            }
        };
        getHeirInformation();
    }, []);

    useEffect(() => {
        if (!accounts.length || !inheritanceAddress) return;

        const updateInheritanceData = async () => {
            try {
                const address = inheritanceAddress;
                const inheritanceContract = await new web3.eth.Contract(Inheritance.abi, address);
                setInheritanceContract(inheritanceContract);
                await getHeirNFTs(inheritanceContract);
                await getBalanceToInherit(inheritanceContract);

                const result = await inheritanceContract.methods.isAdministratorDead().call();
                setIsAdministratorDead(result);

                const isClaimed = await inheritanceContract.methods.getIsInheritanceClaimed().call();
                setClaimed((prevState) => ({
                    ...prevState,
                    [inheritanceAddress]: isClaimed,
                }));
                if (result) {
                    await fetchMessages();
                }

            } catch (error) {
                console.log(error);
            }
        };
        updateInheritanceData();
    }, [approvedInheritances, accounts, inheritanceAddress]);

    useEffect(() => {
        if (inheritanceContract) {
            const checkAdministratorStatusInterval = setInterval(async () => {
                if (claimed[inheritanceAddress]) {
                    clearInterval(checkAdministratorStatusInterval);
                    return;
                }

                try {
                    const result = await inheritanceContract.methods.isAdministratorDead().call();
                    setIsAdministratorDead(result);
                } catch (error) {
                    console.error("Error checking administrator status:", error);
                }
            }, 60000);

            return () => {
                clearInterval(checkAdministratorStatusInterval);
            };
        }
    }, [inheritanceContract, claimed]);


    const fetchApprovedInheritances = async (accounts) => {
        let approvedInheritances = await HeirsAdministration.methods.getApprovedInheritances().call({ from: accounts[0] });
        setApprovedInheritances(approvedInheritances);
        setInheritanceAddress(approvedInheritances[0]);

        return approvedInheritances;
    };

    const getHeirNFTs = async (inheritanceContract) => {
        try {
            const accounts = await web3.eth.getAccounts();
            const heir = await inheritanceContract.methods.getHeirByAddress(accounts[0]).call({ from: accounts[0] });

            const nfts = await Promise.all(
                heir.NFTDeedIds.map(async (tokenId) => {
                    const tokenURI = await TitleDeed.methods.tokenURI(tokenId).call();
                    const metadata = await fetch(tokenURI).then(response => response.json());

                    const item = {
                        tokenId: tokenId,
                        name: metadata.name,
                        description: metadata.description,
                        image: metadata.image,
                    }

                    return item;
                }));
            setHeirNFTs(nfts);
        } catch (error) {
            console.error("Error fetching user NFTs:", error);
        }
    };

    const fetchMessages = async () => {
        try {
            const accounts = await web3.eth.getAccounts();
            const messages = await getMessagesByHeirAddress(accounts[0], inheritanceAddress);
            setMessages(messages.message);
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    };

    const updateInheritances = async () => {
        try {
            setUpdatingInheritances(true);
            await HeirsAdministration.methods.updatePendingInheritances().send({ from: accounts[0] });
            const inheritanceAddress = await fetchApprovedInheritances(accounts);
            setApprovedInheritances(inheritanceAddress);
        } catch (error) {
            console.error("Error updating inheritances:", error);
        } finally {
            setUpdatingInheritances(false);
        }
    };

    const getBalanceToInherit = async (inheritanceContract) => {
        try {
            const accounts = await web3.eth.getAccounts();
            const heir = await inheritanceContract.methods.getHeirByAddress(accounts[0]).call({ from: accounts[0] });

            let inheritanceUSDCBalance = 0;
            let inheritanceEtherBalance = 0;

            console.log("Heir:", claimed[inheritanceAddress]);

            if (claimed[inheritanceAddress] === undefined || !claimed[inheritanceAddress]) {
                inheritanceUSDCBalance = await inheritanceContract.methods.getUSDCBalance().call();
                inheritanceEtherBalance = await inheritanceContract.methods.getEtherBalance().call();
                console.log("Inheritance USDC balance:", inheritanceUSDCBalance);
                console.log("Inheritance Ether balance:", inheritanceEtherBalance);
            } else {
                inheritanceUSDCBalance = heir.usdcBalance;
                inheritanceEtherBalance = heir.etherBalance;
            }

            setUsdcBalance(inheritanceUSDCBalance * heir.share / 100);
            setEtherBalance(web3.utils.fromWei((inheritanceEtherBalance * heir.share / 100).toString(), "ether"));
        } catch (error) {
            console.error("Error fetching balance to inherit:", error);
        }
    };

    const formatUSDCBalance = () => {
        const usdcBalanceStr = usdcBalance.toString();
        const length = usdcBalanceStr.length;
        if (length < 6) return usdcBalanceStr;

        const firstPart = usdcBalanceStr.slice(0, length - 6);
        const secondPart = usdcBalanceStr.slice(length - 6, length - 4);
        return `${firstPart}.${secondPart}`;
    };

    const claimInheritance = async () => {
        if (!inheritanceContract) return;

        try {
            setClaimingInheritance(true);
            await inheritanceContract.methods.claimInheritance().send({ from: accounts[0] });
            await TitleDeed.methods.executeInheritance(inheritanceAddress).send({ from: accounts[0] });
            setClaimed((prevState) => ({
                ...prevState,
                [inheritanceAddress]: true,
            }));
        } catch (error) {
            console.error("Error claiming inheritance:", error);
        } finally {
            setClaimingInheritance(false);
        }
    };

    const cardStyle = {
        width: 'auto',
        minWidth: '400px',
        padding: '16px',
    };

    const segmentStyle = {
        display: 'flex',
        justifyContent: 'center'
    };

    const statisticStyle = {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '300px'
    };

    return (
        <Layout>
            <OwnerAddress
                inheritanceAddress={approvedInheritances}
                selectable
                onAddressSelected={(selectedAddress) => {
                    setInheritanceAddress(selectedAddress);
                }}
            />

            {claimed[inheritanceAddress] || (
                <Card color={approvedInheritances.length > 0 ? isAdministratorDead ? "red" : "green" : null} fluid>
                    <Card.Content>
                        <Card.Description>
                            <h1>
                                El dueño de la herencia esta:{" "}
                                {isAdministratorDead !== null && (
                                    isAdministratorDead ? (
                                        <span style={{ color: "red" }}>Muerto</span>
                                    ) : (
                                        <span style={{ color: "green" }}>Vivo</span>
                                    )
                                )}
                                {isAdministratorDead &&
                                    !claimed[inheritanceAddress] && (
                                        <Button
                                            color="red"
                                            floated="right"
                                            onClick={claimInheritance}
                                            disabled={
                                                !isAdministratorDead ||
                                                claimed[inheritanceAddress]
                                            }
                                            loading={claimingInheritance}
                                        >
                                            Reclamar Herencia
                                        </Button>
                                    )}
                            </h1>
                        </Card.Description>
                    </Card.Content>
                </Card>
            )}
            <Card style={cardStyle} raised>
                <Card.Content>

                    <Card.Header textAlign="center">
                        {claimed[inheritanceAddress]
                            ? "Balance heredado"
                            : "Balance a heredar"}
                    </Card.Header>
                    <Divider />
                    <Card.Description>
                        <Grid columns={2}>
                            <Grid.Row>
                                <Grid.Column>
                                    <Segment raised style={segmentStyle}>
                                        <Statistic size="tiny" style={statisticStyle}>
                                            <Statistic.Label style={{ textTransform: 'capitalize', fontSize: '0.95em' }}>
                                                Balance Ether
                                            </Statistic.Label>
                                            <Statistic.Value>
                                                <Icon size="small" name="ethereum" style={{ marginRight: '4px', position: 'relative', top: '-2px' }} color="blue" />
                                                {etherBalance}
                                            </Statistic.Value>
                                        </Statistic>
                                    </Segment>
                                </Grid.Column>
                                <Grid.Column>
                                    <Segment raised style={segmentStyle}>
                                        <Statistic size="tiny" style={statisticStyle}>
                                            <Statistic.Label style={{ textTransform: 'capitalize', fontSize: '0.95em' }}>
                                                Balance USDC
                                            </Statistic.Label>
                                            <Statistic.Value>
                                                <Icon color="teal" size="small" name="dollar sign" style={{ marginRight: '4px', position: 'relative', top: '-2px' }} />
                                                {formatUSDCBalance(usdcBalance)}
                                            </Statistic.Value>
                                        </Statistic>
                                    </Segment>
                                </Grid.Column>
                            </Grid.Row>
                        </Grid>
                    </Card.Description>
                </Card.Content>
            </Card>

            <div style={{ maxWidth: '110rem', margin: '0 auto', paddingTop: '2rem', paddingBottom: '2rem' }}>
                {/* <Segment style={{ marginTop: '-0.7rem' }} raised> */}
                    <Card.Group itemsPerRow={1}>
                        <Card>
                            <Card.Content>
                                <Card.Header textAlign="center">
                                    {claimed[inheritanceAddress]
                                        ? "NFTs heredados"
                                        : "NFTs a heredar"}
                                </Card.Header>
                                <Divider />
                                <Card.Description>
                                    {heirNFTs.length > 0 ? (
                                        <Card.Group itemsPerRow={3}>
                                            {heirNFTs.map((nft) => (
                                                <Card key={nft.tokenId} color="purple">
                                                    <Image
                                                        src={nft.image}
                                                        wrapped
                                                        ui={false}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            maxHeight: '300px',
                                                            overflow: 'hidden',
                                                        }}
                                                    />
                                                    <Card.Content>
                                                        <Card.Header>{nft.name}</Card.Header>
                                                        <Card.Meta>Token ID: {nft.tokenId}</Card.Meta>
                                                        <Card.Description
                                                            style={{ height: 'auto', overflow: 'hidden', maxHeight: '100rem' }}
                                                        >
                                                            {nft.description}
                                                        </Card.Description>
                                                    </Card.Content>
                                                </Card>
                                            ))}
                                        </Card.Group>
                                    ) : (
                                        <p>No hay NFTs disponibles.</p>
                                    )}
                                </Card.Description>
                            </Card.Content>
                        </Card>
                    </Card.Group>
                {/* </Segment> */}
            </div>

            {isAdministratorDead && (
                <Card style={{ ...cardStyle, marginTop: "2rem" }} raised>
                    <Card.Content>
                        <Card.Header textAlign="center">Mensajes</Card.Header>
                        <Divider />
                        <Card.Description>
                            {messages.length > 0 ? (
                                <List divided relaxed>
                                    {messages.map((message, index) => (
                                        <List.Item key={index}>
                                            <List.Icon name="envelope" size="large" verticalAlign="middle" />
                                            <List.Content>
                                                <List.Header as="a">Mensaje {index + 1}</List.Header>
                                                <List.Description as="a">{message.messageText}</List.Description>
                                            </List.Content>
                                        </List.Item>
                                    ))}
                                </List>
                            ) : (
                                <p>No hay mensajes disponibles.</p>
                            )}
                        </Card.Description>
                    </Card.Content>
                </Card>
            )}


            <div style={{ position: "fixed", bottom: "2rem", right: "2rem" }}>
                <Popup
                    content="En caso de que no vea todas sus herencias, presione el botón para actualizar la lista de herencias pendientes."
                    trigger={
                        <Button
                            color="yellow"
                            onClick={updateInheritances}
                            loading={updatingInheritances}
                        >
                            <Icon name="refresh" />
                            Actualizar
                        </Button>
                    }
                />
            </div>
        </Layout>
    );
};

export default HeirPage;
