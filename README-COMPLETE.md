# 🏥 INACBG Complete Bridging System

Sistem integrasi lengkap untuk INACBG (Indonesia Case Base Groups) BPJS Kesehatan dengan dokumentasi API yang komprehensif menggunakan Swagger/OpenAPI.

## 📋 Fitur Lengkap

### 🔐 **Autentikasi**
- Enkripsi data dengan AES-256-CBC
- Manajemen encryption key yang aman
- Status checking untuk validasi autentikasi

### 📋 **Manajemen Klaim**
- **New Claim** - Pengajuan klaim baru
- **Update Claim** - Update data klaim
- **Delete Claim** - Hapus klaim
- **Set/Unset Final** - Finalisasi dan pembatalan finalisasi klaim

### 🔍 **Inquiry Data**
- **Claim Data** - Pencarian data klaim
- **Patient Data** - Pencarian data pasien
- **SEP Data** - Pencarian data SEP

### 📊 **Monitoring & Logging**
- Real-time API response logging
- Database claim tracking
- Status monitoring
- Error tracking

### 📚 **API Documentation**
- Swagger/OpenAPI 3.0 documentation
- Interactive API explorer
- Comprehensive endpoint documentation
- Request/response examples

## 🚀 Quick Start

### 1. **Install Dependencies**
```bash
npm install
```

### 2. **Environment Setup**
Buat file `.env` dengan konfigurasi berikut:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=inacbg_integration
DB_USER=postgres
DB_PASSWORD=password

# INACBG API Configuration
INACBG_API_URL=https://new-api.inacbg.my.id/

# Server Configuration
PORT=3000
```

### 3. **Database Setup**
Pastikan PostgreSQL sudah berjalan dan database sudah dibuat:
```sql
CREATE DATABASE inacbg_integration;
```

### 4. **Jalankan Aplikasi**
```bash
# Mode Lengkap (dengan semua endpoint)
node app-complete.js

# Mode Simple (hanya basic endpoints)
node app.js
```

### 5. **Akses Aplikasi**
- **Frontend Complete**: http://localhost:3000/index-complete.html
- **Frontend Simple**: http://localhost:3000/
- **API Documentation**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health

## 📚 API Documentation

### Authentication Endpoints

#### **Set Encryption Key**
```http
POST /api/auth/set-key
Content-Type: application/json

{
  "encryption_key": "your_inacbg_encryption_key"
}
```

#### **Check Auth Status**
```http
GET /api/auth/status
```

### Claim Management Endpoints

#### **New Claim**
```http
POST /api/inacbg/new-claim
Content-Type: application/json

{
  "nomor_sep": "0001R0011123000001",
  "nomor_rm": "RM001234",
  "nama_pasien": "John Doe",
  "tanggal_lahir": "1980-01-01",
  "nomor_kartu": "0001234567890",
  "kode_provider": "P0012345",
  "nama_provider": "RS Sehat Indonesia",
  "kelas_rawat": "1",
  "dpjp": "Dr. Smith",
  "tanggal_masuk": "2024-01-15",
  "tanggal_keluar": "2024-01-20",
  "jenis_rawat": "1",
  "cara_bayar": "1",
  "diagnosa": [
    {"kode": "A00", "nama": "Kolera"}
  ],
  "procedure": [
    {"kode": "81.51", "nama": "Operasi Usus Buntu"}
  ],
  "tarif": {
    "tarif_pelayanan": 5000000,
    "tarif_obat": 1000000,
    "total_tarif": 6000000
  }
}
```

#### **Update Claim**
```http
PUT /api/inacbg/update-claim
Content-Type: application/json

{
  "nomor_sep": "0001R0011123000001",
  "nama_pasien": "Updated Name",
  "tanggal_keluar": "2024-01-25"
}
```

#### **Delete Claim**
```http
DELETE /api/inacbg/delete-claim
Content-Type: application/json

{
  "nomor_sep": "0001R0011123000001"
}
```

#### **Set Claim Final**
```http
POST /api/inacbg/set-claim-final
Content-Type: application/json

{
  "nomor_sep": "0001R0011123000001"
}
```

#### **Unset Claim Final**
```http
POST /api/inacbg/unset-claim-final
Content-Type: application/json

{
  "nomor_sep": "0001R0011123000001"
}
```

### Inquiry Endpoints

#### **Claim Data Inquiry**
```http
POST /api/inacbg/inquiry/claim-data
Content-Type: application/json

{
  "nomor_sep": "0001R0011123000001"
}
```

#### **Patient Data Inquiry**
```http
POST /api/inacbg/inquiry/patient-data
Content-Type: application/json

{
  "nomor_kartu": "0001234567890"
}
```

#### **SEP Data Inquiry**
```http
POST /api/inacbg/inquiry/sep-data
Content-Type: application/json

{
  "nomor_sep": "0001R0011123000001"
}
```

### Monitoring Endpoints

#### **Get Logs**
```http
GET /api/logs?method=new_claim&status=success&limit=50
```

#### **Get Claims**
```http
GET /api/claims?status=CLAIM_CREATED&limit=50
```

## 🗄️ Database Schema

### **AuthToken**
- `id` (Primary Key)
- `key_name` (String) - Nama key (INACBG_ENCRYPTION_KEY)
- `encryption_key` (String) - Key enkripsi
- `generated_at` (DateTime) - Timestamp pembuatan

### **Claim**
- `id` (Primary Key)
- `nomor_sep` (String) - Nomor SEP
- `nomor_kartu` (String) - Nomor kartu BPJS
- `nama_pasien` (String) - Nama pasien
- `status_klaim` (String) - Status klaim
- `last_inacbg_method` (String) - Method terakhir dipanggil
- `inacbg_response` (JSON) - Response dari INACBG
- `error_message` (String) - Pesan error
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### **ResponseLog**
- `id` (Primary Key)
- `method` (String) - Method yang dipanggil
- `request_payload` (Text) - Payload request
- `response_status` (Integer) - HTTP status
- `response_body` (Text) - Response body
- `is_success` (Boolean) - Status success
- `response_data` (JSON) - Parsed response data
- `logged_at` (DateTime) - Timestamp

## 🔒 Keamanan

### **Enkripsi Data**
- Menggunakan AES-256-CBC untuk enkripsi request/response
- IV (Initialization Vector) random untuk setiap request
- Key management yang aman di database

### **Validasi Input**
- Server-side validation untuk semua input
- Format validation untuk nomor SEP dan kartu BPJS
- JSON validation untuk data kompleks

### **Error Handling**
- Comprehensive error logging
- Graceful error responses
- Retry mechanism untuk network issues

## 🛠️ Development

### **Project Structure**
```
inacbg_integration/
├── config/
│   └── database.js          # Database configuration
├── models/
│   ├── index.js             # Database models
│   ├── AuthToken.js         # AuthToken model
│   ├── Claim.js             # Claim model
│   └── ResponseLog.js       # ResponseLog model
├── services/
│   ├── inacbgService.js     # Basic INACBG service
│   └── inacbgCompleteService.js # Complete INACBG service
├── public/
│   ├── index.html           # Simple frontend
│   ├── index-complete.html  # Complete frontend
│   ├── styles.css           # Simple styles
│   ├── styles-complete.css  # Complete styles
│   ├── script.js            # Simple script
│   └── script-complete.js   # Complete script
├── app.js                   # Simple Express app
├── app-complete.js          # Complete Express app with Swagger
├── .env                     # Environment variables
├── package.json             # Dependencies
└── README-COMPLETE.md       # This documentation
```

### **API Testing dengan Swagger**
1. Buka http://localhost:3000/api-docs
2. Explore available endpoints
3. Test API directly from browser
4. View request/response examples

### **Frontend Features**
- **Tab Navigation** - Organized interface
- **Form Validation** - Real-time validation
- **JSON Formatting** - Auto-format with Ctrl+Enter
- **Confirmation Modals** - Prevent accidental actions
- **Loading Indicators** - Visual feedback
- **Error Handling** - User-friendly error messages
- **Monitoring Dashboard** - Real-time logs and claims

## 📝 Logging & Monitoring

### **Log Levels**
- **Info** - General information
- **Success** - Successful operations
- **Warning** - Warning messages
- **Error** - Error messages

### **Monitoring Metrics**
- API response times
- Success/failure rates
- Error patterns
- Usage statistics

## 🔧 Configuration

### **Environment Variables**
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=inacbg_integration
DB_USER=postgres
DB_PASSWORD=password

# INACBG API
INACBG_API_URL=https://new-api.inacbg.my.id/

# Server
PORT=3000
NODE_ENV=development
```

### **INACBG Service Configuration**
```javascript
// inacbgCompleteService.js
const INACBG_CONFIG = {
  BASE_URL: process.env.INACBG_API_URL,
  TIMEOUT: 30000,        // 30 seconds
  RETRY_ATTEMPTS: 3,     // Retry attempts
  RETRY_DELAY: 1000      // Delay between retries
};
```

## 🚨 Error Handling

### **Common Error Codes**
- **400** - Bad Request (Validation errors)
- **401** - Unauthorized (Missing/invalid encryption key)
- **404** - Not Found (Resource doesn't exist)
- **500** - Internal Server Error

### **Error Response Format**
```json
{
  "message": "Error description",
  "error": "Detailed error message"
}
```

## 📞 Support

### **Troubleshooting**
1. **Database Connection**: Check PostgreSQL status and credentials
2. **INACBG API**: Verify encryption key and network connectivity
3. **Frontend**: Check browser console for JavaScript errors
4. **Logs**: Review application logs for detailed errors

### **API Reference**
- Complete API documentation available at `/api-docs`
- Interactive testing interface
- Request/response examples
- Schema definitions

---

## 📄 License

MIT License - feel free to use and modify for your INACBG integration needs.

---

**Version**: 2.0 Complete
**Last Updated**: 2024
**Compatible**: INACBG Web Service v2.0