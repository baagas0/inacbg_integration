const axios = require('axios');
const db = require('../models');
const crypto = require('crypto');
const moment = require('moment');

// Placeholder for the actual encryption/decryption logic.
// The real implementation would use the specific symmetric encryption algorithm
// (e.g., AES-256-CBC) and padding scheme required by INACBG.
// For this example, we will use a simple Base64 encoding as a placeholder.

/**
 * Placeholder for INACBG-specific encryption.
 * In a real scenario, this would be the actual symmetric encryption (e.g., AES)
 * using the encryption_key from the database.
 * @param {string} data - The JSON string to encrypt.
 * @param {string} key - The encryption key.
 * @returns {string} The encrypted data.
 */
const encryptData = (data, key) => {
  // NOTE: This is a placeholder. The actual INACBG encryption logic must be implemented here.
  // Example: AES-256-CBC encryption with specific IV and padding.
  console.log('WARNING: Using Base64 placeholder for encryption. Replace with actual INACBG crypto logic.');
  return Buffer.from(data).toString('base64');
};

/**
 * Placeholder for INACBG-specific decryption.
 * @param {string} encryptedData - The encrypted string to decrypt.
 * @param {string} key - The encryption key.
 * @returns {object} The decrypted JSON object.
 */
const decryptData = (encryptedData, key) => {
  // NOTE: This is a placeholder. The actual INACBG decryption logic must be implemented here.
  try {
    const decryptedString = Buffer.from(encryptedData, 'base64').toString('utf8');
    return JSON.parse(decryptedString);
  } catch (error) {
    console.error('Decryption/Parsing Error:', error);
    return { metadata: { code: 500, message: 'Decryption or JSON parsing failed' } };
  }
};

/**
 * Get the current encryption key from the database.
 * @returns {string} The encryption key.
 */
const getEncryptionKey = async () => {
  const token = await db.AuthToken.findOne({
    where: { key_name: 'INACBG_ENCRYPTION_KEY' },
    order: [['generated_at', 'DESC']],
  });
  if (!token) {
    throw new Error('Encryption key not found. Please set the key first.');
  }
  console.log('===> inacbgService.js:53 ~ token', token);
  return token.encryption_key;
};

/**
 * Call the INACBG Web Service API.
 * @param {string} method - The INACBG API method to call (e.g., 'new_claim').
 * @param {object} data - The payload data for the method.
 * @returns {object} The decrypted response data.
 */
const callInacbgApi = async (method, data) => {
  const key = await getEncryptionKey();
  const api_url = process.env.INACBG_API_URL;
  console.log('===> inacbgService.js:66 ~ api_url', api_url);

  // 1. Prepare the request payload
  const requestData = JSON.stringify(data);
  const encryptedData = encryptData(requestData, key);

  // const requestPayload = {
  //   metadata: { method },
  //   data: encryptedData,
  // };
  const requestPayload = encryptData({
    metadata: { method },
    data: encryptedData,
  }, key)
  console.log('===> inacbgService.js:74 ~ requestPayload', requestPayload);

  let response;
  let responseStatus = 0;
  let responseBody = {};
  let isSuccess = false;

  try {
    // 2. Send the request
    response = await axios.post(api_url, requestPayload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    responseStatus = response.status;
    responseBody = response.data;
    console.log('===> inacbgService.js:93 ~ responseBody', responseBody);

    // 3. Decrypt the response data
    const decryptedResponse = decryptData(responseBody, key);
    console.log('===> inacbgService.js:97 ~ decryptedResponse', decryptedResponse);
    isSuccess = decryptedResponse.metadata && decryptedResponse.metadata.code === 200;

    // 4. Log the transaction
    await db.ResponseLog.create({
      method,
      request_payload: JSON.stringify(requestPayload),
      response_status: responseStatus,
      response_body: JSON.stringify(responseBody),
      is_success: isSuccess,
    });

    return decryptedResponse;

  } catch (error) {
    // Log error response
    responseStatus = error.response ? error.response.status : 500;
    responseBody = error.response ? error.response.data : { error: error.message };

    await db.ResponseLog.create({
      method,
      request_payload: JSON.stringify(requestPayload),
      response_status: responseStatus,
      response_body: JSON.stringify(responseBody),
      is_success: false,
    });

    throw new Error(`INACBG API call failed: ${error.message}`);
  }
};

module.exports = {
  encryptData,
  decryptData,
  getEncryptionKey,
  callInacbgApi,
};
