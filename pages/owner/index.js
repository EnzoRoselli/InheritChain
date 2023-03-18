import React, { useState, useEffect } from "react";
import { Grid } from "semantic-ui-react";
import Layout from "../../components/Layout";
import web3 from "../../ethereum/web3";
import Inheritance from "../../ethereum/build/Inheritance.json";
import DepositWithdrawEther from "../../components/DepositWithdrawEther";
import DepositWithdrawUSDC from "../../components/DepositWithdrawUSDC";
import AliveSignal from "../../components/AliveSignal";
import OwnerAddress from "../../components/ownerAddress";
import { useRouter } from "next/router";

const OwnerPage = () => {
    const [inheritanceContract, setInheritanceContract] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const router = useRouter();
    const { inheritanceAddress } = router.query;

    useEffect(() => {
        const getInheritanceContract = async () => {
            try {
                if (!inheritanceAddress) {
                    return;
                }
                const accounts = await web3.eth.getAccounts();
                setAccounts(accounts);
                const inheritanceContract = await new web3.eth.Contract(Inheritance.abi, inheritanceAddress);
                setInheritanceContract(inheritanceContract);
            } catch (error) {
                console.log(error);
            }
        };
        getInheritanceContract();
    }, [inheritanceAddress]);

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
            </Grid>
        </Layout>
    );
};

export default OwnerPage;
