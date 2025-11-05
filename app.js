require('dotenv').config();
const express = require('express');
const db = require('./models');
const { callInacbgApi } = require('./services/inacbgService');
const { default: axios } = require('axios');
const { inacbg_encrypt, inacbg_decrypt } = require('./services/inacbgCrypto');

const keyInacbg = process.env.INACBG_ENCRYPTION_KEY || '';

const app = express();
const PORT = 3001;

app.use(express.json());
app.use(express.static('public'));

// --- Routes ---

// 1. Menyimpan token autentikasi
app.post('/api/auth/set-key', async (req, res) => {
  const { encryption_key } = req.body;

  if (!encryption_key) {
    return res.status(400).json({ message: 'encryption_key is required' });
  }

  try {
    // Upsert (Update or Insert) the key
    const [authToken, created] = await db.AuthToken.findOrCreate({
      where: { key_name: 'INACBG_ENCRYPTION_KEY' },
      defaults: { encryption_key },
    });

    if (!created) {
      authToken.encryption_key = encryption_key;
      authToken.generated_at = new Date();
      await authToken.save();
    }

    res.status(200).json({
      message: created ? 'Encryption key stored successfully' : 'Encryption key updated successfully',
      key: authToken.encryption_key,
    });
  } catch (error) {
    console.error('Error setting encryption key:', error);
    res.status(500).json({ message: 'Failed to store encryption key', error: error.message });
  }
});

// 2. Mengirim permintaan ke salah satu endpoint (Contoh: new_claim)
app.post('/api/inacbg/new-claim', async (req, res) => {
  const { nomor_sep, nomor_kartu, nama_pasien, data_klaim } = req.body;

  if (!nomor_sep || !data_klaim) {
    return res.status(400).json({ message: 'nomor_sep and data_klaim are required' });
  }

  try {
    // Create a new claim record in the local database
    const claim = await db.Claim.create({
      nomor_sep,
      nomor_kartu,
      nama_pasien,
      status_klaim: 'PENDING_INACBG',
      last_inacbg_method: 'new_claim',
    });

    // Prepare the data for INACBG API call
    const inacbgData = {
      ...data_klaim,
      nomor_sep,
    };

    // Call the INACBG API
    const inacbgResponse = await callInacbgApi('new_claim', inacbgData);

    // Update local claim status based on INACBG response (assuming success if no error thrown)
    claim.status_klaim = 'CLAIM_CREATED';
    await claim.save();

    // 3. Menyimpan hasil respons ke database (sudah dilakukan di callInacbgApi)

    res.status(200).json({
      message: 'New claim successfully sent to INACBG',
      local_claim_id: claim.id,
      inacbg_response: inacbgResponse,
    });

  } catch (error) {
    console.error('Error processing new claim:', error);
    res.status(500).json({ message: 'Failed to process new claim', error: error.message });
  }
});

app.get('/pencarian/idrg/diagnosa', async (req, res) => {
  const { q } = req.query;
  console.log('===> app.js:92 ~ q', q);

  if (!q) {
    return res.status(400).json({ message: 'Query parameter q is required' });
  }

  try {

    const inacbgResponse = await callInacbgApi({
      metadata: {
        method: 'search_diagnosis_inagrouper',
      },
      data: {
        keyword: q
      }
      // {"metadata":{"method":"new_claim"},"data":{"nomor_kartu":"0002368958174","nomor_sep":"0528R0011025K000393","nomor_rm":"02-14-53","nama_pasien":"WA ODE INDRI RAHMAWATI","tgl_lahir":"2012-08-22 07:00:00","gender":2}}
    }, keyInacbg);
    console.log('===> app.js:103 ~ inacbgResponse', inacbgResponse);

    res.status(200).json(inacbgResponse);
  } catch (error) {
    console.error('Error searching diagnoses:', error);
    res.status(500).json({ message: 'Failed to search diagnoses', error: error.message });
  }
});

// Route to test encryption
app.get('/api/test-encryption', async (req, res) => {
  try {
    const { testEncryptionWithCurrentKey } = require('./services/inacbgService');
    const result = await testEncryptionWithCurrentKey();

    res.status(200).json({
      success: result,
      message: result ? 'Encryption test PASSED' : 'Encryption test FAILED',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Encryption test failed',
      error: error.message
    });
  }
});

// Route to test all encryption methods
app.get('/api/test-encryption-methods', async (req, res) => {
  try {
    const { testEncryptionMethods } = require('./services/inacbgCryptoFallback');
    const { getEncryptionKey } = require('./services/inacbgService');

    const key = await getEncryptionKey();
    const results = await testEncryptionMethods(key);

    res.status(200).json({
      message: 'Encryption methods test results',
      key_length: key.length,
      results: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Encryption methods test failed',
      error: error.message
    });
  }
});

// Route to test specific encryption
app.post('/api/test-specific-encryption', async (req, res) => {
  try {
    const { encryptData, decryptData, getEncryptionKey } = require('./services/inacbgService');

    const key = await getEncryptionKey();
    const testData = req.body.data || { test: 'specific test', timestamp: new Date().toISOString() };
    const jsonString = JSON.stringify(testData);

    console.log('=== Testing Specific Encryption ===');
    const encrypted = encryptData(jsonString, key);
    console.log('Encrypted length:', encrypted.length);
    console.log('Encrypted sample:', encrypted.substring(0, 100) + '...');

    const decrypted = decryptData(encrypted, key);
    console.log('Decrypted successful');

    res.status(200).json({
      success: true,
      original_data: testData,
      encrypted_length: encrypted.length,
      encrypted_sample: encrypted.substring(0, 100) + '...',
      decrypted_result: typeof decrypted === 'object' ? decrypted : 'parsing_failed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Specific encryption test failed',
      error: error.message
    });
  }
});

// Route to get all response logs
app.get('/api/logs', async (req, res) => {
  try {
    const logs = await db.ResponseLog.findAll({
      order: [['logged_at', 'DESC']],
    });
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve logs', error: error.message });
  }
});

// --- Server Start ---
db.sequelize.authenticate()
  .then(() => {
    console.log('Database connection has been established successfully.');
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });
