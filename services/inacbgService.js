const axios = require('axios');
const db = require('../models');
const { inacbg_encrypt, inacbg_decrypt } = require('./inacbgCrypto');

const baseUrl = process.env.INACBG_API_URL || '';

const getEncryptionKey = async () => {
  const token = await db.AuthToken.findOne({
    where: { key_name: 'INACBG_ENCRYPTION_KEY' },
    order: [['generated_at', 'DESC']],
  });

  if (!token) {
    throw new Error('Encryption key not found. Please set the key first.');
  }

  console.log('===> inacbgService.js:75 ~ encryption key found and validated');
  return token.encryption_key;
};

/**
 * Call the INACBG Web Service API.
 * @param {string} method - The INACBG API method to call (e.g., 'new_claim').
 * @param {object} data - The payload data for the method.
 * @returns {object} The decrypted response data.
 */
const callInacbgApi = async (data) => {
  const key = await getEncryptionKey();
  const api_url = process.env.INACBG_API_URL;

  if (!api_url) {
    throw new Error('INACBG_API_URL not configured in environment variables');
  }


  try {
    const requestPayload = inacbg_encrypt(data, key);

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
    console.log('===> inacbgService.js:52 ~ decrypt', decrypt);

    // 4. Determine success status
    const isSuccess = (decrypt.metadata && decrypt.metadata.code === 200) || false;
    console.log('===> inacbgService.js:55 ~ isSuccess', isSuccess);

    // 5. Log the transaction
    await db.ResponseLog.create({
      method: data.metadata ? data.metadata.method : 'unknown',
      request_payload: JSON.stringify(requestPayload),
      response_status: response.status,
      response_body: JSON.stringify(response.data),
      is_success: isSuccess,
      response_data: decrypt // Store parsed response
    });

    return JSON.parse(decrypt);

  } catch (error) {
    // Handle different types of errors
    let responseStatus = 500;
    let responseBody = { error: error.message };

    if (error.response) {
      // The server responded with an error status
      responseStatus = error.response.status;
      responseBody = error.response.data;
      console.error(`===> INACBG API Error ${responseStatus}:`, responseBody);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('===> INACBG API No Response:', error.message);
      responseBody = { error: 'No response from INACBG server' };
    } else {
      // Something happened in setting up the request
      console.error('===> INACBG API Request Error:', error.message);
    }

    // Log the error transaction
    await db.ResponseLog.create({
      method: data.metadata ? data.metadata.method : 'unknown',
      request_payload: JSON.stringify({ error: 'Request failed before encryption' }),
      response_status: responseStatus,
      response_body: JSON.stringify(responseBody),
      is_success: false
    });

    throw new Error(`INACBG API call failed: ${error.message}`);
  }
};

module.exports = {
  getEncryptionKey,
  callInacbgApi,
};
