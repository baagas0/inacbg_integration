const axios = require('axios');
const db = require('../models');
const crypto = require('crypto');
const moment = require('moment');

// INACBG API Configuration
const INACBG_CONFIG = {
  BASE_URL: process.env.INACBG_API_URL || 'https://new-api.inacbg.my.id/',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000 // 1 second
};

/**
 * INACBG-specific encryption using AES-256-CBC
 * Based on INACBG documentation requirements
 * @param {string} data - The JSON string to encrypt
 * @param {string} key - The encryption key
 * @returns {string} The encrypted data
 */
const encryptData = (data, key) => {
  try {
    // Convert key to 32 bytes for AES-256
    const keyBuffer = Buffer.from(key.padEnd(32, '0').substring(0, 32), 'utf8');

    // Generate random IV (16 bytes for AES)
    const iv = crypto.randomBytes(16);

    // Create cipher
    const cipher = crypto.createCipher('aes-256-cbc', keyBuffer);

    // Encrypt data
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Combine IV and encrypted data
    const result = iv.toString('hex') + ':' + encrypted;

    return Buffer.from(result).toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Encryption failed');
  }
};

/**
 * INACBG-specific decryption using AES-256-CBC
 * @param {string} encryptedData - The encrypted string to decrypt
 * @param {string} key - The encryption key
 * @returns {object} The decrypted JSON object
 */
const decryptData = (encryptedData, key) => {
  try {
    // Convert key to 32 bytes for AES-256
    const keyBuffer = Buffer.from(key.padEnd(32, '0').substring(0, 32), 'utf8');

    // Decode base64 and split IV and encrypted data
    const decoded = Buffer.from(encryptedData, 'base64').toString('utf8');
    const parts = decoded.split(':');

    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    // Create decipher
    const decipher = crypto.createDecipher('aes-256-cbc', keyBuffer);

    // Decrypt data
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Decryption/Parsing Error:', error);
    return {
      metadata: {
        code: 500,
        message: 'Decryption or JSON parsing failed'
      }
    };
  }
};

/**
 * Get encryption key from database
 */
const getEncryptionKey = async () => {
  const token = await db.AuthToken.findOne({
    where: { key_name: 'INACBG_ENCRYPTION_KEY' },
    order: [['generated_at', 'DESC']],
  });

  if (!token) {
    throw new Error('Encryption key not found. Please set the key first.');
  }

  return token.encryption_key;
};

/**
 * Validate required fields for INACBG API
 */
const validateInacbgData = (method, data) => {
  const errors = [];

  // Common validations
  if (method === 'new_claim' || method === 'update_claim') {
    const required = ['nomor_sep', 'nomor_rm', 'nama_pasien', 'tanggal_lahir', 'nomor_kartu'];
    required.forEach(field => {
      if (!data[field]) {
        errors.push(`${field} is required`);
      }
    });

    // Provider validations
    if (!data.kode_provider) errors.push('kode_provider is required');
    if (!data.tanggal_masuk) errors.push('tanggal_masuk is required');
    if (!data.jenis_rawat) errors.push('jenis_rawat is required');
    if (!data.kelas_rawat) errors.push('kelas_rawat is required');
    if (!data.cara_bayar) errors.push('cara_bayar is required');
  }

  // Method-specific validations
  switch (method) {
    case 'delete_claim':
      if (!data.nomor_sep) errors.push('nomor_sep is required for delete_claim');
      break;
    case 'set_claim_final':
    case 'unset_claim_final':
      if (!data.nomor_sep) errors.push('nomor_sep is required');
      break;
    case 'claim_data':
    case 'patient_data':
    case 'sep_data':
      if (!data.nomor_sep && !data.nomor_rm && !data.nomor_kartu) {
        errors.push('At least one of nomor_sep, nomor_rm, or nomor_kartu is required');
      }
      break;
  }

  return errors;
};

/**
 * Standardize date format for INACBG
 */
const formatInacbgDate = (date) => {
  return moment(date).format('DD-MM-YYYY');
};

/**
 * Prepare request data for INACBG API
 */
const prepareInacbgData = (method, data) => {
  const errors = validateInacbgData(method, data);
  if (errors.length > 0) {
    throw new Error(`Validation errors: ${errors.join(', ')}`);
  }

  // Format dates
  const formattedData = { ...data };
  if (formattedData.tanggal_lahir) {
    formattedData.tanggal_lahir = formatInacbgDate(formattedData.tanggal_lahir);
  }
  if (formattedData.tanggal_masuk) {
    formattedData.tanggal_masuk = formatInacbgDate(formattedData.tanggal_masuk);
  }
  if (formattedData.tanggal_keluar) {
    formattedData.tanggal_keluar = formatInacbgDate(formattedData.tanggal_keluar);
  }

  return formattedData;
};

/**
 * Make HTTP request with retry logic
 */
const makeHttpRequest = async (url, payload, attempts = INACBG_CONFIG.RETRY_ATTEMPTS) => {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'INACBG-Integration-NodeJS/1.0'
        },
        timeout: INACBG_CONFIG.TIMEOUT
      });

      return {
        status: response.status,
        data: response.data,
        headers: response.headers
      };
    } catch (error) {
      console.log(`Attempt ${attempt} failed:`, error.message);

      if (attempt === attempts) {
        throw error;
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, INACBG_CONFIG.RETRY_DELAY * attempt));
    }
  }
};

/**
 * Main INACBG API call function
 */
const callInacbgApi = async (method, data) => {
  const key = await getEncryptionKey();
  const api_url = INACBG_CONFIG.BASE_URL;

  try {
    // Prepare and validate data
    const preparedData = prepareInacbgData(method, data);

    // Encrypt request data
    const requestData = JSON.stringify(preparedData);
    const encryptedData = encryptData(requestData, key);

    // Prepare request payload
    const requestPayload = {
      metadata: { method },
      data: encryptedData
    };

    console.log(`Calling INACBG API: ${method}`);
    console.log('Request payload:', JSON.stringify(requestPayload, null, 2));

    // Make HTTP request
    const response = await makeHttpRequest(api_url, requestPayload);

    // Decrypt response
    const decryptedResponse = decryptData(response.data.data, key);
    const isSuccess = decryptedResponse.metadata && decryptedResponse.metadata.code === 200;

    // Log transaction
    await db.ResponseLog.create({
      method,
      request_payload: JSON.stringify(requestPayload),
      response_status: response.status,
      response_body: JSON.stringify(response.data),
      is_success: isSuccess,
      response_data: decryptedResponse
    });

    console.log(`INACBG API Response:`, JSON.stringify(decryptedResponse, null, 2));

    return decryptedResponse;

  } catch (error) {
    console.error('INACBG API Error:', error);

    // Log error
    await db.ResponseLog.create({
      method,
      request_payload: JSON.stringify({ metadata: { method }, data: 'encrypted' }),
      response_status: error.response ? error.response.status : 500,
      response_body: JSON.stringify(error.response ? error.response.data : { error: error.message }),
      is_success: false
    });

    throw new Error(`INACBG API call failed: ${error.message}`);
  }
};

/**
 * INACBG Service Methods
 */
const InacbgService = {
  /**
   * Create new claim
   */
  newClaim: async (claimData) => {
    return await callInacbgApi('new_claim', claimData);
  },

  /**
   * Update existing claim
   */
  updateClaim: async (claimData) => {
    return await callInacbgApi('update_claim', claimData);
  },

  /**
   * Delete claim
   */
  deleteClaim: async (nomor_sep) => {
    return await callInacbgApi('delete_claim', { nomor_sep });
  },

  /**
   * Set claim as final
   */
  setClaimFinal: async (nomor_sep) => {
    return await callInacbgApi('set_claim_final', { nomor_sep });
  },

  /**
   * Unset claim final status
   */
  unsetClaimFinal: async (nomor_sep) => {
    return await callInacbgApi('unset_claim_final', { nomor_sep });
  },

  /**
   * Get claim data
   */
  getClaimData: async (query) => {
    return await callInacbgApi('claim_data', query);
  },

  /**
   * Get patient data
   */
  getPatientData: async (query) => {
    return await callInacbgApi('patient_data', query);
  },

  /**
   * Get SEP data
   */
  getSepData: async (query) => {
    return await callInacbgApi('sep_data', query);
  }
};

module.exports = {
  ...InacbgService,
  encryptData,
  decryptData,
  getEncryptionKey,
  callInacbgApi,
  validateInacbgData,
  formatInacbgDate,
  INACBG_CONFIG
};