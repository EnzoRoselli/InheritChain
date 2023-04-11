const axios = require('axios');

const BASE_URL = 'http://localhost:8080/messages';

export const saveMessage = async (message) => {
    return await axios
        .post(BASE_URL, message, {
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(function (response) {
            return {
                success: true,
                message: response.data.message
            };
        })
        .catch(function (error) {
            console.log(error)
            return {
                success: false,
                message: error.message
            }
        });
}

export const getMessagesByAddressAndInheritanceContractAddress = async (address, inheritanceContractAddress) => {
    return await axios
        .get(BASE_URL, {
            params: { adminAddress: address, inheritanceContractAddress: inheritanceContractAddress },
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(function (response) {
            return {
                success: true,
                message: response.data
            };
        })
        .catch(function (error) {
            console.log(error)
            return {
                success: false,
                message: error.message
            }
        });
}

export const updateHeirAddresses = async (messageId, heirAddresses) => {
    const url = `${BASE_URL}/${messageId}/heir-addresses`;
    return await axios
        .put(url, heirAddresses, {
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(function (response) {
            return {
                success: true,
                message: response.data.message
            };
        })
        .catch(function (error) {
            console.log(error)
            return {
                success: false,
                message: error.message
            }
        });
}

export const deleteById = async (messageId) => {
    const url = `${BASE_URL}/${messageId}`;
    return await axios
        .delete(url, {
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(function (response) {
            return {
                success: true,
                message: response.data.message
            };
        })
        .catch(function (error) {
            console.log(error)
            return {
                success: false,
                message: error.message
            }
        });
}

export const getMessagesByHeirAddress = async (heirAddress, inheritanceContractAddress) => {
    const url = `${BASE_URL}/heir-addresses`;
    return await axios
        .get(url, {
            params: { heirAddress: heirAddress, inheritanceContractAddress: inheritanceContractAddress },
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(function (response) {
            return {
                success: true,
                message: response.data
            };
        })
        .catch(function (error) {
            console.log(error)
            return {
                success: false,
                message: error.message
            }
        });
}