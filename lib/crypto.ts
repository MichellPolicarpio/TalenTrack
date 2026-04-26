import { SecretClient } from "@azure/keyvault-secrets";
import { ClientSecretCredential, DefaultAzureCredential } from "@azure/identity";
import * as crypto from "crypto";

// ==========================================
// CONFIGURACIÓN DE AZURE KEY VAULT
// ==========================================
// 1. Debes añadir AZURE_KEYVAULT_URL en tu portal de Azure y en tu .env local. 
// Ejemplo: AZURE_KEYVAULT_URL="https://tu-boveda.vault.azure.net/"
// 2. Tienes que ir a "Secrets" en Key Vault y crear un Secreto llamado "app-encryption-key".
// El valor de ese secreto debe ser un texto Base64 de 32 bytes (o texto libre de 32 caracteres).
// ==========================================

const algorithm = "aes-256-gcm";
let cachedMasterKey: Buffer | null = null;

/**
 * Obtiene la llave maestra (semilla criptográfica) desde tu Azure Key Vault.
 * Implementa un caché en memoria para no saturar a Azure con peticiones REST.
 */
async function fetchMasterKey(): Promise<Buffer> {
  if (cachedMasterKey) return cachedMasterKey;

  const keyVaultUrl = process.env.AZURE_KEYVAULT_URL?.trim();
  const secretName = process.env.AZURE_KEYVAULT_SECRET_NAME?.trim() || "app-encryption-key";

  if (!keyVaultUrl) {
    throw new Error("SAFESHIELD: Missing AZURE_KEYVAULT_URL in environment.");
  }

  // Si tenemos clientId/clientSecret explícito (recomendado para AAD SP):
  const clientId = process.env.AZURE_CLIENT_ID?.trim();
  const clientSecret = process.env.AZURE_CLIENT_SECRET?.trim();
  const tenantId = process.env.AZURE_TENANT_ID?.trim();

  let credential;
  if (clientId && clientSecret && tenantId) {
     credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
  } else {
     // Si corre en Container Apps de Azure, esta función usará su identidad automáticamente
     credential = new DefaultAzureCredential();
  }

  const client = new SecretClient(keyVaultUrl, credential);
  
  const secret = await client.getSecret(secretName);
  const secretValue = secret.value;
  
  if (!secretValue) {
    throw new Error(`SAFESHIELD: No value found for the secret "${secretName}" in Key Vault.`);
  }

  // Asegurar que la clave tiene exactamente 32 bytes (req. para AES-256). 
  // Convertimos la cadena de texto a un Hash final de 256bits con SHA-256
  cachedMasterKey = crypto.createHash("sha256").update(String(secretValue)).digest();

  return cachedMasterKey;
}

/**
 * Encripta un texto usando AES-256-GCM. 
 * Devuelve un string codificado en hex que guarda el vector, el authtag y los datos encriptados.
 */
export async function encryptData(text: string | null | undefined): Promise<string | null> {
  if (!text) return null;

  const masterKey = await fetchMasterKey();
  
  // Vector de inicialización (IV) Determinístico de 16 bytes (obligatorio para búsquedas WHERE y llaves UNIQUE)
  const iv = crypto.createHash("md5").update(text + masterKey.toString("hex")).digest();
  const cipher = crypto.createCipheriv(algorithm, masterKey, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag().toString("hex");

  // Formato: iv:authTag:encryptedData
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Desencripta un string en formato estructurado (iv:authTag:encryptedData) 
 * convirtiéndolo de vuelta a texto plano.
 */
export async function decryptData(cipherText: string | null | undefined): Promise<string | null> {
  if (!cipherText || typeof cipherText !== "string") return cipherText ?? null;

  // Verificamos si realmente viene encriptado en el formato esperado
  if (!cipherText.includes(":")) {
     // Posiblemente no esté encriptado (si quitamos el Always Encrypted pero el dato seguía crudo)
     return cipherText;
  }

  const parts = cipherText.split(":");
  if (parts.length !== 3) {
    return cipherText; // Formato incorrecto, se retorna intacto por seguridad anti-crashes.
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  
  if (ivHex.length !== 32 || authTagHex.length !== 32) {
      return cipherText; 
  }

  try {
      const masterKey = await fetchMasterKey();
      const iv = Buffer.from(ivHex, "hex");
      const authTag = Buffer.from(authTagHex, "hex");

      const decipher = crypto.createDecipheriv(algorithm, masterKey, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedHex, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
  } catch (err) {
      console.warn("Application-Level Crypto Warning: No se pudo desencriptar el valor.", err);
      // Fallback: se regresa la cadena chatarra antes que romper la UI.
      return cipherText;
  }
}
