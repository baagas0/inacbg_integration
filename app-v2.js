require('dotenv').config();
const express = require('express');
const { callInacbgApi } = require('./services/inacbgService');
const { default: axios } = require('axios');
const { inacbg_encrypt, inacbg_decrypt } = require('./services/inacbgCrypto');

const key = process.env.INACBG_ENCRYPTION_KEY || '';
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// --- Routes ---
app.get('/bridging', async (req, res) => {
  // const { data, key } = req.param;
  try {
    const inacbgResponse = await c({
      metadata: {
        method: 'search_diagnosis_inagrouper',
      },
      data: {
        keyword: 'A00'
      }
    }, key);
    console.log('===> app-v2.js:32 ~ inacbgResponse', inacbgResponse);
    res.status(200).json(inacbgResponse);
  } catch (error) {
    console.log('===> app-v2.js:42 ~ error', error);
    res.status(500).json({ message: 'Encryption failed 123', error: error.message });
  }
});

app.post('/encrypt', async (req, res) => {
  const { data, key } = req.body;
  try {
    const encryptedData = await inacbg_encrypt(data, key);
    res.status(200).json({ encrypted: encryptedData });
  } catch (error) {
    console.log('===> app-v2.js:42 ~ error', error);
    res.status(500).json({ message: 'Encryption failed 123', error: error.message });
  }
});

app.post('/decrypt', async (req, res) => {
  const { data, key } = req.body;
  try {
    const decryptedData = await inacbg_decrypt(data, key);
    res.status(200).json({ decrypted: decryptedData });
  } catch (error) {
    console.log('===> app-v2.js:60 ~ error', error);
    res.status(500).json({ message: 'Decryption failed', error: error.message });
  }
});

app.get('/check', async (req, res) => {
  try {
    const response = await callInacbgApi({
      metadata: {
        method: 'check',
      },
      data: {
        key
      }
    });
    res.status(200).json({ message: 'API is running', data: response });
  } catch (error) {
    console.log('===> app-v2.js:60 ~ error', error);
    res.status(500).json({ message: 'API is not running', error: error.message });
  }
});

console.log(`While start on port ${PORT}...`);
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});