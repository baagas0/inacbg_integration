require('dotenv').config();
const express = require('express');
const db = require('./models');
const { callInacbgApi } = require('./services/inacbgService');

const app = express();
const PORT = 3000;

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

    const inacbgResponse = await callInacbgApi('search_diagnosis_inagroupercl', {
      keyword: q,
    });

    res.status(200).json({
      diagnoses: inacbgResponse.data || [],
    });
  } catch (error) {
    console.error('Error searching diagnoses:', error);
    res.status(500).json({ message: 'Failed to search diagnoses', error: error.message });
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
