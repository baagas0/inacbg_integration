require('dotenv').config();
const express = require('express');
const db = require('./models');
const { callInacbgApi } = require('./services/inacbgService');
const { default: axios } = require('axios');
const { inacbg_encrypt, inacbg_decrypt } = require('./services/inacbgCrypto');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

// --- Routes ---
app.post('/bridging', async (req, res) => {
  const { data, key } = req.body;
  try {
    const inacbgResponse = await callInacbgApi({
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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});