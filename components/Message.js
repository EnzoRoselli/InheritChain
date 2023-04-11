import React, { useState, useEffect } from "react";
import { Button, Form, Message, Card, Dropdown, Checkbox, List, Segment, Label, Icon } from "semantic-ui-react";
import { saveMessage, getMessagesByAddressAndInheritanceContractAddress, updateHeirAddresses, deleteById } from "../components/js/message";

const MessageComponent = ({ inheritanceContract, accounts }) => {
    const [message, setMessage] = useState("");
    const [description, setDescription] = useState("");
    const [uploadMessageErrorMessage, setUploadMessageErrorMessage] = useState("");
    const [uploadingMessage, setUploadingMessage] = useState(false);
    const [heirAddresses, setHeirAddresses] = useState([]);
    const [selectedHeirs, setSelectedHeirs] = useState([]);
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        const fetchHeirs = async () => {
            try {
                const fetchedHeirs = await inheritanceContract.methods.getHeirsAddresses().call();
                setHeirAddresses(fetchedHeirs);
            } catch (error) {
                console.log(error);
            }
        };
        if (inheritanceContract) {
            fetchHeirs();
        }
    }, [inheritanceContract]);

    useEffect(() => {
        if (accounts[0] && inheritanceContract) {
            fetchMessages();
        }
    }, [accounts, inheritanceContract]);

    const fetchMessages = async () => {
        try {
            const response = await getMessagesByAddressAndInheritanceContractAddress(accounts[0], inheritanceContract.options.address);
            if (response.success) {
                setMessages(Array.isArray(response.message) ? response.message : []);
            }
        } catch (error) {
            console.log(error);
        }
    };

    const uploadMessage = async (event) => {
        event.preventDefault();
        setUploadingMessage(true);
        setUploadMessageErrorMessage("");
        try {
            const MessageObject = {
                adminAddress: accounts[0],
                inheritanceContractAddress: inheritanceContract.options.address,
                messageText: description,
                heirAddresses: selectedHeirs.map((heirAddress) => ({ heirAddress })),
            }
            const response = await saveMessage(MessageObject);
            setMessage(response.message);
            setDescription("");
            await fetchMessages();
        } catch (error) {
            console.log(error);
            setUploadMessageErrorMessage(error.response.data);
        }
        setUploadingMessage(false);
    };

    const handleHeirSelect = (e, { value }) => {
        setSelectedHeirs(value);
    };

    const heirOptions = heirAddresses.map((address, index) => ({
        key: index,
        text: address,
        value: address,
        content: <Checkbox label={address} />,
    }));

    const handleHeirUpdate = async (messageId, value) => {
        try {
            const response = await updateHeirAddresses(messageId, value);
            if (response.success) {
                fetchMessages();
            }
        } catch (error) {
            console.log(error);
        }
    };

    const handleRemoveMessage = async (messageId) => {
        try {
            const response = await deleteById(messageId);
            if (response.success) {
                fetchMessages();
            }
        } catch (error) {
            console.log(error);
        }
    };

    const renderMessages = () => {
        return messages.map((msg) => {
            const truncatedMessage = msg.messageText.length > 100 ? msg.messageText.substring(0, 240) + '...' : msg.messageText;
            return (
                <List.Item key={msg.id}>
                    <Segment padded raised>
                        <Label attached="top right" color="blue">
                            <Icon name="user secret" /> Herederos
                        </Label>
                        <List.Content>
                            <List.Header as="h3">{truncatedMessage}</List.Header>
                            <List.Description>
                                <Dropdown
                                    placeholder='Selecciona los herederos que deseas que reciban el mensaje.'
                                    fluid
                                    multiple
                                    selection
                                    closeOnChange
                                    options={heirOptions}
                                    value={msg.heirAddresses.map((heir) => heir.heirAddress)}
                                    onChange={(e, { value }) => handleHeirUpdate(msg.id, value)}
                                />
                                <Button color="red" style={{ marginTop: '0.5em', marginLeft: '68.4em' }} onClick={() => handleRemoveMessage(msg.id)}>
                                    Remover
                                </Button>
                            </List.Description>
                        </List.Content>
                    </Segment>
                </List.Item>
            );
        });
    };

    return (
        <Card fluid color="blue">
            <Card.Content>
                <Card.Header textAlign="center">Cargar Mensaje</Card.Header>
                <Card.Description>
                    <Form onSubmit={uploadMessage} error={!!uploadMessageErrorMessage}>
                        <Form.Field>
                            <Form.TextArea
                                placeholder="Mensaje para sus herederos."
                                onChange={(event) => setDescription(event.target.value)}
                                value={description}
                                style={{ minHeight: '12em' }}
                            />
                        </Form.Field>
                        <Form.Field>
                            <label>Direccion de los herederos</label>
                            <Dropdown
                                placeholder='Selecciona los herederos que deseas que reciban el mensaje.'
                                fluid
                                multiple
                                selection
                                closeOnChange
                                options={heirOptions}
                                onChange={handleHeirSelect}
                            />
                        </Form.Field>
                        <Button type="submit" primary fluid disabled={!description} loading={uploadingMessage}>
                            {uploadingMessage ? "Subiendo..." : "Subir Mensaje"}
                        </Button>
                        {uploadMessageErrorMessage && (
                            <Message error header="Oops!" content={uploadMessageErrorMessage} />
                        )}
                    </Form>
                </Card.Description>
            </Card.Content>
            <Card.Content>
                <Card.Header textAlign="center">Lista de Mensajes</Card.Header>
                <Card.Description>
                    <List relaxed>
                        {renderMessages()}
                    </List>
                </Card.Description>
            </Card.Content>
        </Card>
    );
}

export default MessageComponent;
