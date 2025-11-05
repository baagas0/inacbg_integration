const axios = require('axios');
const { inacbg_encrypt, inacbg_decrypt } = require('./inacbgCrypto');

const baseUrl = process.env.INACBG_API_URL || '';
const keyInacbg = process.env.INACBG_ENCRYPTION_KEY || '';
/**
 * Call the INACBG Web Service API.
 * @param {string} method - The INACBG API method to call (e.g., 'new_claim').
 * @param {object} data - The payload data for the method.
 * @returns {object} The decrypted response data.
 */
const callInacbgApi = async (data, key) => {
  try {
    const requestPayload = await inacbg_encrypt(data, key || keyInacbg);

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: baseUrl,
      headers: { 
        'Content-Type': 'application/json'
      },
      data : requestPayload
    };

    const response = await axios.request(config);

    const decrypt = inacbg_decrypt(response.data, key);
    console.log('===> inacbgService.js:29 ~ decrypt', decrypt);

    const isSuccess = (decrypt.metadata && decrypt.metadata.code === 200) || false;

    return JSON.parse(decrypt);
    // return {...JSON.parse(decrypt), request_payload: requestPayload, response_plain: response.data};

  } catch (error) {
    console.log('===> inacbgService.js:37 ~ error', error);
    throw new Error(error);
  }
};

module.exports = {
  callInacbgApi,
};
