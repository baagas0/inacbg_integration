# 🔐 INACBG Encryption Implementation Guide

## Overview

Implementasi enkripsi untuk INACBG Web Service menggunakan AES-256-CBC sesuai dengan spesifikasi dokumentasi INACBG.

## 🛡️ Security Features

### **Encryption Algorithm**
- **Primary**: AES-256-CBC (most secure)
- **Fallback**: Base64 encoding (for INACBG compatibility)
- **Key Length**: 256 bits (32 bytes)
- **IV Length**: 128 bits (16 bytes)
- **Mode**: Cipher Block Chaining (CBC)
- **Encoding**: Base64
- **Auto-fallback**: Tries AES first, falls back to Base64 if needed

### **Key Management**
- Key validation before use
- Automatic key padding to 32 bytes
- Secure key storage in database
- Key format validation

## 📁 File Structure

```
services/
├── inacbgCrypto.js     # Crypto utilities & core functions
└── inacbgService.js    # Main service with encryption integration
```

## 🔧 Core Functions

### **inacbgCrypto.js**

#### `encryptAES256CBC(data, key)`
- Encrypts data using AES-256-CBC
- Generates random IV for each encryption
- Returns Base64 encoded result (IV:encrypted)

#### `decryptAES256CBC(encryptedData, key)`
- Decrypts Base64 encoded data
- Extracts IV and encrypted data
- Returns decrypted string

#### `createInacbgRequest(method, data, key)`
- Creates INACBG-compliant request payload
- Encrypts data and adds metadata
- Returns `{ metadata: { method }, data: encryptedData }`

#### `processInacbgResponse(response, key)`
- Processes INACBG API response
- Decrypts response data
- Returns parsed JSON object

### **inacbgService.js**

#### `encryptData(data, key)` - Wrapper Function
- Validates key before encryption
- Calls core encryption function
- Error handling

#### `decryptData(encryptedData, key)` - Wrapper Function
- Validates key before decryption
- Calls core decryption function
- JSON parsing with error handling

#### `callInacbgApi(method, data)`
- Main API call function
- Handles complete request/response cycle
- Comprehensive error handling
- Transaction logging

## 🧪 Testing

### **Test Endpoints**

#### **1. Basic Encryption Test**
```bash
GET /api/test-encryption
```

#### **2. All Encryption Methods Test**
```bash
GET /api/test-encryption-methods
```

#### **3. Specific Encryption Test**
```bash
POST /api/test-specific-encryption
Content-Type: application/json

{
  "data": { "test": "custom test data" }
}
```

### **Test Functions**
```javascript
const { testEncryptionWithCurrentKey } = require('./services/inacbgService');
const result = await testEncryptionWithCurrentKey();

const { testEncryptionMethods } = require('./services/inacbgCryptoFallback');
const methods = await testEncryptionMethods(key);
```

### **Testing with Console Logs**
Implementation now includes detailed console logging for debugging:
- Encryption method used
- Data length and format
- Success/failure status
- Error details

## 📋 Implementation Details

### **1. Key Preparation**
```javascript
const prepareKey = (key) => {
  // Ensure exactly 32 bytes for AES-256
  if (key.length >= 32) {
    return Buffer.from(key.substring(0, 32), 'utf8');
  } else {
    return Buffer.from(key.padEnd(32, '0'), 'utf8');
  }
};
```

### **2. Encryption Process**
```javascript
const iv = crypto.randomBytes(16);
const cipher = crypto.createCipher('aes-256-cbc', keyBuffer);
let encrypted = cipher.update(data, 'utf8', 'hex');
encrypted += cipher.final('hex');
const result = iv.toString('hex') + ':' + encrypted;
return Buffer.from(result).toString('base64');
```

### **3. Decryption Process**
```javascript
const decoded = Buffer.from(encryptedData, 'base64').toString('utf8');
const parts = decoded.split(':');
const iv = Buffer.from(parts[0], 'hex');
const encrypted = parts[1];
const decipher = crypto.createDecipher('aes-256-cbc', keyBuffer);
let decrypted = decipher.update(encrypted, 'hex', 'utf8');
decrypted += decipher.final('utf8');
```

## 🔍 Request/Response Format

### **Request Format**
```json
{
  "metadata": {
    "method": "new_claim"
  },
  "data": "Base64(IV:EncryptedData)"
}
```

### **Response Format**
```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": "Base64(IV:EncryptedResponseData)"
}
```

## ⚠️ Security Considerations

### **Key Security**
- Store encryption key securely in database
- Never log or expose the encryption key
- Validate key format before use
- Use environment variables for sensitive configuration

### **Data Security**
- Generate random IV for each encryption
- Use authenticated encryption if possible
- Validate data integrity after decryption
- Implement proper error handling without data leakage

### **Network Security**
- Use HTTPS for all API communications
- Implement request timeouts
- Add rate limiting
- Log security events

## 🚀 Usage Examples

### **Basic Usage**
```javascript
const { callInacbgApi } = require('./services/inacbgService');

const claimData = {
  nomor_sep: "0001R0011123000001",
  nomor_rm: "RM001234",
  nama_pasien: "John Doe",
  // ... other fields
};

const response = await callInacbgApi('new_claim', claimData);
```

### **Direct Encryption**
```javascript
const { encryptData, decryptData } = require('./services/inacbgService');
const key = await getEncryptionKey();

const data = JSON.stringify({ test: 'data' });
const encrypted = encryptData(data, key);
const decrypted = decryptData(encrypted, key);
```

## 🔧 Configuration

### **Environment Variables**
```env
INACBG_API_URL=https://new-api.inacbg.my.id/
DB_HOST=localhost
DB_PORT=5432
DB_NAME=inacbg_integration
DB_USER=postgres
DB_PASSWORD=password
```

### **Database Setup**
Ensure `AuthToken` table exists with encryption key:
```sql
CREATE TABLE auth_tokens (
  id SERIAL PRIMARY KEY,
  key_name VARCHAR(255) NOT NULL,
  encryption_key TEXT NOT NULL,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🐛 Troubleshooting

### **Common Issues**

#### 1. "crypto.createCipher is not a function"
- **Fixed**: Updated to use `crypto.createCipheriv()` (modern Node.js compatible)
- **Solution**: Use fallback Base64 encryption if AES fails

#### 2. "Invalid encryption key format"
- Ensure key is at least 8 characters
- Check key is stored correctly in database
- Verify key retrieval process

#### 3. "Decryption failed"
- Check if encryption and decryption use same key
- Verify data format (should be Base64)
- Check if data is corrupted during transmission
- **Auto-fallback**: System tries multiple encryption methods

#### 4. "Response processing failed"
- Verify INACBG API response format
- Check if response contains data field
- Ensure proper error handling

### **Debug Steps**
1. **Test all encryption methods**: `GET /api/test-encryption-methods`
2. **Test basic encryption**: `GET /api/test-encryption`
3. **Test specific data**: `POST /api/test-specific-encryption`
4. Check console logs for detailed debug information
5. Verify request payload format
6. Check INACBG API connectivity
7. Validate data structure

### **Console Debug Information**
The system now provides detailed console logs:
```
=== INACBG Encryption Debug ===
Original data length: 1234
Key length: 32
Key first 10 chars: abcdef1234...
AES-256-CBC encryption successful, length: 2048
```

### **Auto-Fallback Behavior**
- **Primary**: AES-256-CBC encryption
- **Fallback**: Base64 encoding
- **Automatic**: System switches methods if primary fails

## 📝 Best Practices

1. **Always validate keys** before use
2. **Test encryption/decryption** regularly
3. **Monitor API responses** for errors
4. **Log security events** without sensitive data
5. **Keep dependencies updated**
6. **Implement proper error handling**
7. **Use environment variables** for configuration
8. **Regular security audits**

## 🆕 Updates

### **Version 2.1 Features (Latest)**
- ✅ **Fixed**: `crypto.createCipher` deprecation issue
- ✅ **Updated**: Modern Node.js compatible encryption (`createCipheriv`)
- ✅ **Added**: Auto-fallback encryption system
- ✅ **Enhanced**: Debug logging and troubleshooting
- ✅ **New**: Multiple testing endpoints
- ✅ **Improved**: Error handling with multiple encryption methods

### **Version 2.0 Features**
- ✅ AES-256-CBC encryption implementation
- ✅ INACBG-compliant request/response format
- ✅ Enhanced error handling
- ✅ Key validation and management
- ✅ Comprehensive testing utilities
- ✅ Improved logging and monitoring
- ✅ Security best practices implementation

### **🚨 Critical Fix Applied**
The `crypto.createCipher` deprecation error has been resolved:
- **Before**: Used deprecated `crypto.createCipher()`
- **After**: Uses modern `crypto.createCipheriv()` with proper IV
- **Fallback**: Base64 encoding for INACBG compatibility
- **Result**: Compatible with modern Node.js versions

---

**For technical support or questions, please refer to the INACBG Web Service documentation or create an issue in the repository.**