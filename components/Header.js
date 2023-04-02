import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button, Menu, Dropdown, Icon } from "semantic-ui-react";
import web3 from "../ethereum/web3";
import InheritanceFactory from "../ethereum/factory";
import HeirAdministration from "../ethereum/heirAdministration";
import { useRouter } from "next/router";
import metamaskIcon from "../public/metamask.svg";
import Image from "next/image";


const Header = () => {
    const [address, setAddress] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);
    const [isHeir, setIsHeir] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        async function loadWeb3Data() {
            const accounts = await web3.eth.getAccounts();
            await updateRoleAndAddress(accounts[0]);
        }
        loadWeb3Data();

        window.ethereum.on("accountsChanged", function (accounts) { // This event is emitted when the user changes the account in MetaMask.
            updateRoleAndAddress(accounts[0] || "");
        });
    }, []);

    async function updateRoleAndAddress(account) {
        setAddress(account);

        const adminStatus = await InheritanceFactory.methods.isAdmin().call({ from: account });
        const hasPendingRequests = await HeirAdministration.methods.hasPendingInheritances().call({ from: account });
        const hasRejectedInheritances = await HeirAdministration.methods.hasRejectedInheritances().call({ from: account });
        const hasApprovedInheritances = await HeirAdministration.methods.getApprovedInheritances().call({ from: account });

        setIsAdmin(adminStatus);
        setIsHeir(hasPendingRequests || hasRejectedInheritances || hasApprovedInheritances.length > 0);
    }

    async function connectWallet() {
        try {
            setLoading(true);
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
            setAddress(accounts[0]);

            const adminStatus = await InheritanceFactory.methods.isAdmin().call({ from: accounts[0] });
            const hasPendingRequests = await HeirAdministration.methods.hasPendingInheritances().call({ from: accounts[0] });
            const hasRejectedInheritances = await HeirAdministration.methods.hasRejectedInheritances().call({ from: accounts[0] });

            setIsAdmin(adminStatus);
            setIsHeir(hasPendingRequests || hasRejectedInheritances);

            if (!adminStatus && !hasPendingRequests && !hasRejectedInheritances) {
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
        <Menu size="large" style={{ marginBottom: "2rem", marginTop: "2px" }}>
            <Menu.Item header>
                <Link href="/" legacyBehavior>
                    <a style={{ color: "black" }}>
                        <Icon name="chain" />
                        InheritChain
                    </a>
                </Link>
            </Menu.Item>

            <Menu.Menu position="right">
                {/* {isHeir && isAdmin && (
                    <div
                        style={{
                            borderLeft: "1px solid rgba(34,36,38,.15)",
                            height: "100%",
                            margin: "0 0.3rem",
                        }}
                    />
                )} */}

                {isHeir && (
                    <>
                        <Menu.Item>
                            <Link href="/heir/request-inheritance" legacyBehavior>
                                <a>
                                    <Icon name="legal" />
                                    Solicitar Herencia
                                </a>
                            </Link>
                        </Menu.Item>
                        <Menu.Item>
                            <Link href="/heir" legacyBehavior>
                                <a>
                                    <Icon name="file alternate" />
                                    Herencias
                                </a>
                            </Link>
                        </Menu.Item>
                    </>
                )}

                {/* {isHeir && isAdmin && (
                    <div
                        style={{
                            borderLeft: "1px solid rgba(34,36,38,.15)",
                            height: "100%",
                            margin: "0 0.3rem",
                        }}
                    />
                )} */}

                {isAdmin && (
                    <>
                        <Menu.Item>
                            <Link href="/owner/NFTs" legacyBehavior>
                                <a>
                                    <Icon name="cube" />
                                    NFTs
                                </a>
                            </Link>
                        </Menu.Item>
                        <Menu.Item>
                            <Link href="/owner/heir-management" legacyBehavior>
                                <a>
                                    <Icon name="users" />
                                    Herederos
                                </a>
                            </Link>
                        </Menu.Item>
                        <Menu.Item>
                            <Link href="/owner" legacyBehavior>
                                <a>
                                    <Icon name="settings" />
                                    Panel
                                </a>
                            </Link>
                        </Menu.Item>
                    </>
                )}

                {address ? (
                    <Dropdown className="floating button positive" icon={null} trigger={
                        <span
                            style={{
                                display: "inline-flex",
                                marginTop: "0.4rem",
                            }}
                        >
                            <Image
                                src={metamaskIcon}
                                alt="MetaMask"
                                width={24}
                                height={24}
                                style={{
                                    marginTop: "-0.40rem",
                                    marginRight: "0.7rem",
                                    marginLeft: "-0.5rem",
                                }}
                            />
                            {formatAddress(address)}
                        </span>
                    } pointing="top right" style={{ marginRight: "0px" }}>
                        <Dropdown.Menu>
                            <Dropdown.Item text="Disconnect" icon="log out" onClick={disconnectWallet} />
                        </Dropdown.Menu>
                    </Dropdown>
                ) : (
                    <Menu.Item style={{ padding: "0" }}>
                        <Button
                            onClick={connectWallet}
                            loading={loading}
                            primary
                            size="large"
                            style={{
                                paddingTop: "0.75rem",
                                paddingBottom: "0.75rem",
                                height: "100%",
                                paddingLeft: "0.5rem",
                                paddingRight: "0.5rem",
                            }}
                        >
                            <Icon name="plug" size="big" style={{ marginRight: "0rem" }} />
                            Connect Wallet
                        </Button>
                    </Menu.Item>
                )}
            </Menu.Menu>
        </Menu >
    );
};

export default Header;
