const crypto = require("crypto");

const inacbg_decrypt = (data, key) => {
  try {
    if (typeof data === "string") {
      data = data.replace(
        /----BEGIN ENCRYPTED DATA----|----END ENCRYPTED DATA----/g,
        ""
      );
    } else {
      return "Should be String input";
    }
    let keys = Buffer.from(key, "hex");
    let data_decoded = Buffer.from(data, "base64");
    let iv = Buffer.from(data_decoded.slice(10, 26));
    let dec = crypto.createDecipheriv("aes-256-cbc", keys, iv);
    let encoded = Buffer.from(data_decoded.slice(26));
    let signature = data_decoded.slice(0, 10);
    if (!inacbg_compare(signature, encoded, key)) {
      return "SIGNATURE_NOT_MATCH"; ala
    }
    let decrypted = Buffer.concat([dec.update(encoded), dec.final()]);
    return decrypted.toString("utf8");
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error(`Decryption failed: ${error.message}`);
  }
};
const inacbg_encrypt = (data, key) => {
  const info = crypto.getCipherInfo('aes-256-cbc')
  if (typeof data === "object") {
    data = JSON.stringify(data);
  } 
  let data_encoded = Buffer.from(data);
  let keys = Buffer.from(key, "hex");
  let iv = crypto.randomBytes(16);
  let enc = crypto.createCipheriv("aes-256-cbc", keys, iv);
  let encrypt = Buffer.concat([enc.update(data_encoded), enc.final()]);
  let signature = crypto
    .createHmac("sha256", keys)
    .update(encrypt)
    .digest()
    .slice(0, 10);
  return Buffer.concat([signature, iv, encrypt]).toString("base64");
};
const inacbg_compare = (signature, encrypt, key) => {
  let keys = Buffer.from(key, "hex");
  let calc_signature = crypto
    .createHmac("sha256", keys)
    .update(encrypt)
    .digest()
    .slice(0, 10);
  if (signature.compare(calc_signature) === 0) {
    return true;
  }
  return false;
};

module.exports = {
    inacbg_decrypt,
    inacbg_encrypt,
    inacbg_compare
};