require('dotenv').config();
const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const db = require('./models');
const {
  newClaim,
  updateClaim,
  deleteClaim,
  setClaimFinal,
  unsetClaimFinal,
  getClaimData,
  getPatientData,
  getSepData
} = require('./services/inacbgCompleteService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Swagger Configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'INACBG Integration API',
      version: '1.0.0',
      description: 'API documentation for INACBP (Indonesia Case Base Groups) integration system',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server'
      }
    ],
    components: {
      schemas: {
        AuthToken: {
          type: 'object',
          required: ['encryption_key'],
          properties: {
            encryption_key: {
              type: 'string',
              description: 'Encryption key provided by INACBG'
            }
          }
        },
        ClaimData: {
          type: 'object',
          required: ['nomor_sep', 'nomor_rm', 'nama_pasien', 'tanggal_lahir', 'nomor_kartu', 'kode_provider', 'tanggal_masuk', 'jenis_rawat', 'kelas_rawat', 'cara_bayar'],
          properties: {
            nomor_sep: {
              type: 'string',
              description: 'Nomor SEP (Surat Eligibilitas Peserta)',
              example: '0001R0011123000001'
            },
            nomor_rm: {
              type: 'string',
              description: 'Nomor Rekam Medis',
              example: 'RM001234'
            },
            nama_pasien: {
              type: 'string',
              description: 'Nama lengkap pasien',
              example: 'John Doe'
            },
            tanggal_lahir: {
              type: 'string',
              format: 'date',
              description: 'Tanggal lahir pasien (YYYY-MM-DD)',
              example: '1980-01-01'
            },
            nomor_kartu: {
              type: 'string',
              description: 'Nomor kartu BPJS Kesehatan',
              example: '0001234567890'
            },
            kode_provider: {
              type: 'string',
              description: 'Kode provider/fasyankes',
              example: 'P0012345'
            },
            nama_provider: {
              type: 'string',
              description: 'Nama provider/fasyankes',
              example: 'RS Sehat Indonesia'
            },
            tanggal_masuk: {
              type: 'string',
              format: 'date',
              description: 'Tanggal masuk rumah sakit (YYYY-MM-DD)',
              example: '2024-01-15'
            },
            tanggal_keluar: {
              type: 'string',
              format: 'date',
              description: 'Tanggal keluar rumah sakit (YYYY-MM-DD)',
              example: '2024-01-20'
            },
            jenis_rawat: {
              type: 'string',
              enum: ['1', '2'],
              description: 'Jenis rawat: 1=Rawat Inap, 2=Rawat Jalan'
            },
            kelas_rawat: {
              type: 'string',
              enum: ['1', '2', '3'],
              description: 'Kelas rawat: 1=Kelas 1, 2=Kelas 2, 3=Kelas 3'
            },
            cara_bayar: {
              type: 'string',
              enum: ['1', '2'],
              description: 'Cara bayar: 1=Perorangan, 2=Perusahaan'
            },
            dpjp: {
              type: 'string',
              description: 'Dokter Penanggung Jawab Pelayanan',
              example: 'Dr. Smith'
            },
            diagnosa: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  kode: { type: 'string' },
                  nama: { type: 'string' }
                }
              },
              description: 'Daftar diagnosa'
            },
            procedure: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  kode: { type: 'string' },
                  nama: { type: 'string' }
                }
              },
              description: 'Daftar prosedur'
            },
            tarif: {
              type: 'object',
              properties: {
                tarif_pelayanan: { type: 'number' },
                tarif_obat: { type: 'number' },
                tarif_alkes: { type: 'number' },
                total_tarif: { type: 'number' }
              }
            }
          }
        },
        InquiryQuery: {
          type: 'object',
          properties: {
            nomor_sep: {
              type: 'string',
              description: 'Nomor SEP untuk pencarian'
            },
            nomor_rm: {
              type: 'string',
              description: 'Nomor Rekam Medis untuk pencarian'
            },
            nomor_kartu: {
              type: 'string',
              description: 'Nomor kartu BPJS untuk pencarian'
            }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            metadata: {
              type: 'object',
              properties: {
                code: { type: 'number' },
                message: { type: 'string' }
              }
            },
            data: {
              type: 'object'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            error: { type: 'string' }
          }
        }
      }
    }
  },
  apis: ['./app-complete.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI Route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'INACBG Integration API Documentation'
}));

/**
 * @swagger
 * /api/auth/set-key:
 *   post:
 *     summary: Set encryption key for INACBG API
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthToken'
 *     responses:
 *       200:
 *         description: Encryption key stored successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 key: { type: string }
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.post('/api/auth/set-key', async (req, res) => {
  const { encryption_key } = req.body;

  if (!encryption_key) {
    return res.status(400).json({ message: 'encryption_key is required' });
  }

  try {
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

/**
 * @swagger
 * /api/auth/status:
 *   get:
 *     summary: Check authentication status
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Authentication status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 has_key: { type: boolean }
 *                 key_set_at: { type: string }
 */
app.get('/api/auth/status', async (req, res) => {
  try {
    const token = await db.AuthToken.findOne({
      where: { key_name: 'INACBG_ENCRYPTION_KEY' },
      order: [['generated_at', 'DESC']],
    });

    res.status(200).json({
      has_key: !!token,
      key_set_at: token ? token.generated_at : null
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to check auth status', error: error.message });
  }
});

/**
 * @swagger
 * /api/inacbg/new-claim:
 *   post:
 *     summary: Create new claim in INACBG
 *     tags: [INACBG Claims]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClaimData'
 *     responses:
 *       200:
 *         description: Claim created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 local_claim_id: { type: number }
 *                 inacbg_response:
 *                   $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.post('/api/inacbg/new-claim', async (req, res) => {
  try {
    const claimData = req.body;

    // Create claim record
    const claim = await db.Claim.create({
      nomor_sep: claimData.nomor_sep,
      nomor_kartu: claimData.nomor_kartu,
      nama_pasien: claimData.nama_pasien,
      status_klaim: 'PENDING_INACBG',
      last_inacbg_method: 'new_claim',
    });

    // Call INACBG API
    const inacbgResponse = await newClaim(claimData);

    // Update claim status
    if (inacbgResponse.metadata && inacbgResponse.metadata.code === 200) {
      claim.status_klaim = 'CLAIM_CREATED';
      claim.inacbg_response = inacbgResponse;
    } else {
      claim.status_klaim = 'CLAIM_FAILED';
      claim.error_message = inacbgResponse.metadata?.message || 'Unknown error';
    }
    await claim.save();

    res.status(200).json({
      message: 'New claim processed',
      local_claim_id: claim.id,
      inacbg_response: inacbgResponse,
    });

  } catch (error) {
    console.error('Error processing new claim:', error);
    res.status(500).json({ message: 'Failed to process new claim', error: error.message });
  }
});

/**
 * @swagger
 * /api/inacbg/update-claim:
 *   put:
 *     summary: Update existing claim in INACBG
 *     tags: [INACBG Claims]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClaimData'
 *     responses:
 *       200:
 *         description: Claim updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 inacbg_response:
 *                   $ref: '#/components/schemas/ApiResponse'
 */
app.put('/api/inacbg/update-claim', async (req, res) => {
  try {
    const claimData = req.body;

    // Update existing claim
    const claim = await db.Claim.findOne({
      where: { nomor_sep: claimData.nomor_sep }
    });

    if (claim) {
      claim.status_klaim = 'PENDING_UPDATE';
      claim.last_inacbg_method = 'update_claim';
      await claim.save();
    }

    // Call INACBG API
    const inacbgResponse = await updateClaim(claimData);

    // Update claim status
    if (claim) {
      if (inacbgResponse.metadata && inacbgResponse.metadata.code === 200) {
        claim.status_klaim = 'CLAIM_UPDATED';
      } else {
        claim.status_klaim = 'UPDATE_FAILED';
        claim.error_message = inacbgResponse.metadata?.message || 'Unknown error';
      }
      await claim.save();
    }

    res.status(200).json({
      message: 'Claim update processed',
      inacbg_response: inacbgResponse,
    });

  } catch (error) {
    console.error('Error updating claim:', error);
    res.status(500).json({ message: 'Failed to update claim', error: error.message });
  }
});

/**
 * @swagger
 * /api/inacbg/delete-claim:
 *   delete:
 *     summary: Delete claim from INACBG
 *     tags: [INACBG Claims]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nomor_sep]
 *             properties:
 *               nomor_sep:
 *                 type: string
 *                 example: '0001R0011123000001'
 *     responses:
 *       200:
 *         description: Claim deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 inacbg_response:
 *                   $ref: '#/components/schemas/ApiResponse'
 */
app.delete('/api/inacbg/delete-claim', async (req, res) => {
  try {
    const { nomor_sep } = req.body;

    if (!nomor_sep) {
      return res.status(400).json({ message: 'nomor_sep is required' });
    }

    // Update claim status
    const claim = await db.Claim.findOne({
      where: { nomor_sep }
    });

    if (claim) {
      claim.status_klaim = 'PENDING_DELETE';
      claim.last_inacbg_method = 'delete_claim';
      await claim.save();
    }

    // Call INACBG API
    const inacbgResponse = await deleteClaim(nomor_sep);

    // Update claim status
    if (claim) {
      if (inacbgResponse.metadata && inacbgResponse.metadata.code === 200) {
        claim.status_klaim = 'CLAIM_DELETED';
      } else {
        claim.status_klaim = 'DELETE_FAILED';
        claim.error_message = inacbgResponse.metadata?.message || 'Unknown error';
      }
      await claim.save();
    }

    res.status(200).json({
      message: 'Claim deletion processed',
      inacbg_response: inacbgResponse,
    });

  } catch (error) {
    console.error('Error deleting claim:', error);
    res.status(500).json({ message: 'Failed to delete claim', error: error.message });
  }
});

/**
 * @swagger
 * /api/inacbg/set-claim-final:
 *   post:
 *     summary: Set claim as final in INACBG
 *     tags: [INACBG Claims]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nomor_sep]
 *             properties:
 *               nomor_sep:
 *                 type: string
 *                 example: '0001R0011123000001'
 *     responses:
 *       200:
 *         description: Claim set as final successfully
 */
app.post('/api/inacbg/set-claim-final', async (req, res) => {
  try {
    const { nomor_sep } = req.body;

    if (!nomor_sep) {
      return res.status(400).json({ message: 'nomor_sep is required' });
    }

    const inacbgResponse = await setClaimFinal(nomor_sep);

    // Update claim status
    const claim = await db.Claim.findOne({
      where: { nomor_sep }
    });

    if (claim) {
      if (inacbgResponse.metadata && inacbgResponse.metadata.code === 200) {
        claim.status_klaim = 'CLAIM_FINAL';
      } else {
        claim.status_klaim = 'FINAL_FAILED';
        claim.error_message = inacbgResponse.metadata?.message || 'Unknown error';
      }
      await claim.save();
    }

    res.status(200).json({
      message: 'Claim finalization processed',
      inacbg_response: inacbgResponse,
    });

  } catch (error) {
    console.error('Error setting claim final:', error);
    res.status(500).json({ message: 'Failed to set claim final', error: error.message });
  }
});

/**
 * @swagger
 * /api/inacbg/unset-claim-final:
 *   post:
 *     summary: Unset claim final status in INACBG
 *     tags: [INACBG Claims]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nomor_sep]
 *             properties:
 *               nomor_sep:
 *                 type: string
 *                 example: '0001R0011123000001'
 *     responses:
 *       200:
 *         description: Claim final status unset successfully
 */
app.post('/api/inacbg/unset-claim-final', async (req, res) => {
  try {
    const { nomor_sep } = req.body;

    if (!nomor_sep) {
      return res.status(400).json({ message: 'nomor_sep is required' });
    }

    const inacbgResponse = await unsetClaimFinal(nomor_sep);

    // Update claim status
    const claim = await db.Claim.findOne({
      where: { nomor_sep }
    });

    if (claim) {
      if (inacbgResponse.metadata && inacbgResponse.metadata.code === 200) {
        claim.status_klaim = 'CLAIM_DRAFT';
      } else {
        claim.status_klaim = 'UNFINAL_FAILED';
        claim.error_message = inacbgResponse.metadata?.message || 'Unknown error';
      }
      await claim.save();
    }

    res.status(200).json({
      message: 'Claim unfinalization processed',
      inacbg_response: inacbgResponse,
    });

  } catch (error) {
    console.error('Error unsetting claim final:', error);
    res.status(500).json({ message: 'Failed to unset claim final', error: error.message });
  }
});

/**
 * @swagger
 * /api/inacbg/inquiry/claim-data:
 *   post:
 *     summary: Get claim data from INACBG
 *     tags: [INACBG Inquiry]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InquiryQuery'
 *     responses:
 *       200:
 *         description: Claim data retrieved successfully
 */
app.post('/api/inacbg/inquiry/claim-data', async (req, res) => {
  try {
    const query = req.body;

    if (!query.nomor_sep && !query.nomor_rm && !query.nomor_kartu) {
      return res.status(400).json({
        message: 'At least one of nomor_sep, nomor_rm, or nomor_kartu is required'
      });
    }

    const inacbgResponse = await getClaimData(query);

    res.status(200).json({
      message: 'Claim data retrieved',
      inacbg_response: inacbgResponse,
    });

  } catch (error) {
    console.error('Error getting claim data:', error);
    res.status(500).json({ message: 'Failed to get claim data', error: error.message });
  }
});

/**
 * @swagger
 * /api/inacbg/inquiry/patient-data:
 *   post:
 *     summary: Get patient data from INACBG
 *     tags: [INACBG Inquiry]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InquiryQuery'
 *     responses:
 *       200:
 *         description: Patient data retrieved successfully
 */
app.post('/api/inacbg/inquiry/patient-data', async (req, res) => {
  try {
    const query = req.body;

    if (!query.nomor_sep && !query.nomor_rm && !query.nomor_kartu) {
      return res.status(400).json({
        message: 'At least one of nomor_sep, nomor_rm, or nomor_kartu is required'
      });
    }

    const inacbgResponse = await getPatientData(query);

    res.status(200).json({
      message: 'Patient data retrieved',
      inacbg_response: inacbgResponse,
    });

  } catch (error) {
    console.error('Error getting patient data:', error);
    res.status(500).json({ message: 'Failed to get patient data', error: error.message });
  }
});

/**
 * @swagger
 * /api/inacbg/inquiry/sep-data:
 *   post:
 *     summary: Get SEP data from INACBG
 *     tags: [INACBG Inquiry]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InquiryQuery'
 *     responses:
 *       200:
 *         description: SEP data retrieved successfully
 */
app.post('/api/inacbg/inquiry/sep-data', async (req, res) => {
  try {
    const query = req.body;

    if (!query.nomor_sep && !query.nomor_rm && !query.nomor_kartu) {
      return res.status(400).json({
        message: 'At least one of nomor_sep, nomor_rm, or nomor_kartu is required'
      });
    }

    const inacbgResponse = await getSepData(query);

    res.status(200).json({
      message: 'SEP data retrieved',
      inacbg_response: inacbgResponse,
    });

  } catch (error) {
    console.error('Error getting SEP data:', error);
    res.status(500).json({ message: 'Failed to get SEP data', error: error.message });
  }
});

/**
 * @swagger
 * /api/logs:
 *   get:
 *     summary: Get all API response logs
 *     tags: [Monitoring]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of logs to return
 *       - in: query
 *         name: method
 *         schema:
 *           type: string
 *         description: Filter by INACBG method
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [success, error]
 *         description: Filter by success status
 *     responses:
 *       200:
 *         description: Logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id: { type: integer }
 *                   method: { type: string }
 *                   request_payload: { type: string }
 *                   response_status: { type: integer }
 *                   response_body: { type: string }
 *                   is_success: { type: boolean }
 *                   logged_at: { type: string }
 *                   response_data: { type: object }
 */
app.get('/api/logs', async (req, res) => {
  try {
    const { limit = 100, method, status } = req.query;

    const whereClause = {};
    if (method) whereClause.method = method;
    if (status) whereClause.is_success = status === 'success';

    const logs = await db.ResponseLog.findAll({
      where: whereClause,
      order: [['logged_at', 'DESC']],
      limit: parseInt(limit),
    });

    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve logs', error: error.message });
  }
});

/**
 * @swagger
 * /api/claims:
 *   get:
 *     summary: Get all claims
 *     tags: [Claims Management]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by claim status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of claims to return
 *     responses:
 *       200:
 *         description: Claims retrieved successfully
 */
app.get('/api/claims', async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;

    const whereClause = {};
    if (status) whereClause.status_klaim = status;

    const claims = await db.Claim.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
    });

    res.status(200).json(claims);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve claims', error: error.message });
  }
});

/**
 * @swagger
 * /api/claims/{id}:
 *   get:
 *     summary: Get specific claim by ID
 *     tags: [Claims Management]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Claim ID
 *     responses:
 *       200:
 *         description: Claim retrieved successfully
 *       404:
 *         description: Claim not found
 */
app.get('/api/claims/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const claim = await db.Claim.findByPk(id);
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    res.status(200).json(claim);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve claim', error: error.message });
  }
});

// Health check endpoint
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [System]
 *     responses:
 *       200:
 *         description: System is healthy
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'INACBG Integration API',
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      auth: '/api/auth',
      claims: '/api/inacbg',
      inquiry: '/api/inacbg/inquiry',
      logs: '/api/logs',
      health: '/health'
    }
  });
});

// Server startup
db.sequelize.authenticate()
  .then(() => {
    console.log('Database connection has been established successfully.');
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`Frontend: http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });