import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button, Menu, Dropdown } from "semantic-ui-react";
import "semantic-ui-css/semantic.min.css";
import web3 from "../ethereum/web3";
// import Logo from "./images/logo.png";
import InheritanceFactory from "../ethereum/factory";
import HeirAdministration from "../ethereum/heirAdministration";
import { useRouter } from "next/router";


const Header = () => {
    const [address, setAddress] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        async function loadWeb3Data() {
          const accounts = await web3.eth.getAccounts();
          setAddress(accounts[0]);
        }
        loadWeb3Data();

        window.ethereum.on("accountsChanged", function (accounts) { // This event is emitted when the user changes the account in MetaMask.
            setAddress(accounts[0] || "");
        });
    }, []);

    async function connectWallet() {
        try {
            setLoading(true);
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
            setAddress(accounts[0]);

            const isAdmin = await InheritanceFactory.methods.isAdmin().call({from: accounts[0]});
            const hasPendingRequests = await HeirAdministration.methods.hasPendingInheritances().call({from: accounts[0]});
            const hasRejectedInheritances = await HeirAdministration.methods.hasRejectedInheritances().call({from: accounts[0]});

            if (!isAdmin && !hasPendingRequests && !hasRejectedInheritances) {
                router.push("/registry");
            } 
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function disconnectWallet() {
        try {
          setLoading(true);
          await window.ethereum.request({ method: "eth_accounts" });
          setAddress("");
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
    }

    function formatAddress(address) {
        if (!address) return null;
        const prefix = address.slice(0, 6);
        const suffix = address.slice(-4);
        return `${prefix}...${suffix}`;
    }

    return (
        <Menu style={{ marginTop: "10px" }}>
            <Link href="/" legacyBehavior>
                <a className="item">InheritChain</a>
            </Link>

            <Menu.Menu position="right" style={{ marginLeft: "10px"}}>
            <Link href="/admin" legacyBehavior>
                <a className="item">NFTs</a>
            </Link>

                {address ? (
                        <Dropdown  className="floating button positive" icon={null} trigger={formatAddress(address)} pointing="top right" style={{ marginRight: "-1px"}}>
                            <Dropdown.Menu>
                                <Dropdown.Item text="Disconnect" icon="log out" onClick={disconnectWallet} />
                            </Dropdown.Menu>
                        </Dropdown>
                    ) : (
                        <Button onClick={connectWallet} loading={loading} primary style={{ marginRight: "-1px"}}>
                            Connect Wallet
                        </Button>
                )}
            </Menu.Menu>
        </Menu>        
    );
};

export default Header;
