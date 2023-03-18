import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import OwnerAddress from "../../components/ownerAddress";
import { uploadFileToIPFS, uploadJSONToIPFS } from "../../components/js/pinata";
import { Button, Input, Icon, Form, Message, Card, Container, Loader, Image, Segment } from "semantic-ui-react";
import TitleDeed from "../../ethereum/titleDeed";
import web3 from "../../ethereum/web3";

const NFTs = () => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [fileURL, setFileURL] = useState(null);
    const [uploadNFTErrorMessage, setUploadNFTErrorMessage] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [uploadingNFT, setUploadingNFT] = useState(false);
    const [userNFTs, setUserNFTs] = useState([]);
    const [fileInputKey, setFileInputKey] = useState(0);
    const [pdfFiles, setPdfFiles] = useState({});
    const [pdfToLoad, setPdfToLoad] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            await getUserNFTs();
        };
        fetchData();
    }, []);

    const getUserNFTs = async () => {
        try {
            const accounts = await web3.eth.getAccounts();
            console.log("accounts", accounts);
            const tokens = await TitleDeed.methods.getAdministratorNFTs().call({ from: accounts[0] });
            console.log("tokens", tokens);

            const nfts = await Promise.all(
                tokens.map(async (token) => {
                    const tokenId = token.tokenId;
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
            setUserNFTs(nfts);
        } catch (error) {
            console.error("Error fetching user NFTs:", error);
        }
    };

    const uploadFileToPinata = async (event) => {
        let file = event.target.files[0];
        let fileName = file.name;
        setUploading(true);
        setUploadNFTErrorMessage("");

        try {
            const response = await uploadFileToIPFS(file, fileName);
            if (response.success === true) {
                console.log("Uploaded image to Pinata: ", response.pinataURL);
                setFileURL(response.pinataURL);
                setUploading(false);
                setUploadSuccess(true);
            } else {
                console.log("Error uploading image to Pinata: ", response);
                setUploading(false);
                setUploadSuccess(false);
                setUploadNFTErrorMessage("Error uploading file to Pinata. Please try again.");
            }
        } catch (error) {
            console.log("Error during file upload", error);
            setUploading(false);
            setUploadSuccess(false);
            setUploadNFTErrorMessage("Error uploading file to Pinata. Please try again.");
        }
    };

    const uploadMetadataToIPFS = async () => {
        if (!name || !description || !fileURL)
            return;

        const NFTjson = {
            name, description, image: fileURL
        }

        try {
            //upload the metadata JSON to IPFS
            const response = await uploadJSONToIPFS(NFTjson, name);
            if (response.success === true) {
                console.log("Uploaded JSON to Pinata: ", response)
                return response.pinataURL;
            }
        }
        catch (e) {
            console.log("error uploading JSON metadata:", e)
            setUploadNFTErrorMessage("Error uploading metadata to Pinata. Please try again.");
        }
    }

    const uploadNFT = async (event) => {
        event.preventDefault();

        setUploadingNFT(true);
        setUploadNFTErrorMessage('');

        try {
            const metadataURL = await uploadMetadataToIPFS();

            if (metadataURL) {
                //upload the NFT to the ethereum blockchain
                const accounts = await web3.eth.getAccounts();
                const result = await TitleDeed.methods.safeMint(metadataURL).send({ from: accounts[0] });
                console.log("NFT uploaded to ethereum blockchain: ", result);

                //reset the form
                setName('');
                setDescription('');
                setFileURL(null);
                setFileInputKey(fileInputKey + 1);
                await getUserNFTs();
            } else {
                console.log("Error uploading JSON to Pinata: ", response)
                setUploadNFTErrorMessage("Error uploading metadata to Pinata. Please try again.");
            }

        } catch (error) {
            console.log("error uploading NFT in ethereum blockchain:", e)
            setUploadNFTErrorMessage("Error uploading the NFT. Please try again.");
        } finally {
            setUploadingNFT(false);
        }
    }

    return (
        <>
            <Layout>
                <Container style={{ maxWidth: '100px', paddingTop: '2rem' }}>
                    <div style={{ maxWidth: '600px', margin: '0 auto' }}>

                        <Card fluid>
                            <Card.Content>
                                <Card.Header textAlign="center">Cargar documento</Card.Header>
                                <Card.Description>
                                    <Form onSubmit={uploadNFT} error={!!uploadNFTErrorMessage}>
                                        <Form.Field>
                                            <label>Nombre del documento</label>
                                            <Input
                                                placeholder="Ej. Titulo de propiedad de mi casa"
                                                onChange={(event) => setName(event.target.value)}
                                                value={name}
                                                type="text"
                                                fluid
                                            />
                                        </Form.Field>
                                        <Form.Field>
                                            <label>Descripción del documento</label>
                                            <Form.TextArea
                                                placeholder="Ej. Se encuentra ubicada en Palermo, Buenos Aires, Argentina, en la calle Suipacha 567. La casa es amplia y cuenta con todas las comodidades necesarias para vivir cómodamente. Dispone de 3 habitaciones, 2 baños, una amplia cocina con comedor diario, un espacioso living-comedor y un patio trasero con parrilla. La superficie total del terreno es de 200 m2, mientras que la superficie cubierta es de 150 m2. Además, cuenta con un garaje con espacio para un automóvil. La ubicación es excelente, con acceso cercano al subte, colegios, shopping y plazas. Espero que disfruten de esta propiedad tanto como yo lo he hecho, y que la conviertan en su hogar."
                                                onChange={(event) => setDescription(event.target.value)}
                                                value={description}
                                                style={{ minHeight: '12em' }}
                                            />
                                        </Form.Field>
                                        <Form.Field>
                                            <label>Archivo del documento</label>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <Input
                                                    key={fileInputKey}
                                                    type="file"
                                                    onChange={uploadFileToPinata}
                                                    style={{ marginRight: '1rem' }}
                                                />
                                                {uploading && <Loader active inline />}
                                                {!uploading && fileURL !== null && uploadSuccess && <Icon name="checkmark" color="green" />}
                                                {!uploading && fileURL !== null && uploadSuccess === false && <Icon name="times" color="red" />}
                                            </div>
                                        </Form.Field>
                                        <Button type="submit" primary fluid disabled={!name || !description || !fileURL || uploadingNFT} loading={uploadingNFT}>
                                            {uploadingNFT ? "Subiendo..." : "Subir NFT"}
                                        </Button>
                                        {uploadNFTErrorMessage && (
                                            <Message error header="Oops!" content={uploadNFTErrorMessage} />
                                        )}
                                    </Form>
                                </Card.Description>
                            </Card.Content>
                        </Card>
                    </div>
                </Container>

            </Layout>
            <div style={{ maxWidth: '110rem', margin: '0 auto', paddingTop: '2rem', paddingBottom: '2rem' }}>
                <Segment style={{ marginTop: '2rem' }} raised>
                    <Card.Group itemsPerRow={3}>
                        {userNFTs.map((nft) => (
                            <Card key={nft.tokenId}>
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
                </Segment>
            </div>
        </>
    );
};

export default NFTs;