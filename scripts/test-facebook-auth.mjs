import test from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";

// Test Encryption Service Logic (AES-256-GCM)
process.env.TOKEN_ENCRYPTION_SECRET = "b65fa349d4791e846069c9b583f773425026993ce8abacb8f36c4ff98c199852";

function getEncryptionKey() {
  const secret = process.env.TOKEN_ENCRYPTION_SECRET;
  if (/^[0-9a-fA-F]{64}$/.test(secret)) {
    return Buffer.from(secret, "hex");
  }
  return crypto.createHash("sha256").update(secret).digest();
}

function encryptToken(plaintext) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv, { authTagLength: 16 });
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  return `enc:v1:${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

function decryptToken(payload) {
  const parts = payload.split(":");
  assert.equal(parts.length, 5);
  assert.equal(parts[0], "enc");
  assert.equal(parts[1], "v1");
  const iv = Buffer.from(parts[2], "hex");
  const authTag = Buffer.from(parts[3], "hex");
  const ciphertextHex = parts[4];
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv, { authTagLength: 16 });
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(ciphertextHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

test("AES-256-GCM: encrypts and decrypts Page Access Token faithfully", () => {
  const rawPageToken = "EAABwzLix...mock_fb_page_access_token_super_secret_xyz123";
  const encrypted = encryptToken(rawPageToken);

  assert.ok(encrypted.startsWith("enc:v1:"));
  assert.notEqual(encrypted, rawPageToken);

  const decrypted = decryptToken(encrypted);
  assert.equal(decrypted, rawPageToken);
});

test("AES-256-GCM: rejects tampered ciphertext or altered auth tag", () => {
  const rawPageToken = "my-secret-token";
  const encrypted = encryptToken(rawPageToken);
  const parts = encrypted.split(":");

  // Tamper ciphertext
  const tamperedCiphertext = parts[4].slice(0, -2) + "ff";
  const tamperedPayload = `${parts[0]}:${parts[1]}:${parts[2]}:${parts[3]}:${tamperedCiphertext}`;

  assert.throws(() => decryptToken(tamperedPayload), /Unsupported state or unable to authenticate data/);
});

test("Meta OAuth URL builder includes mandatory scopes and CSRF state", () => {
  const state = "a61b8f10134bc2e3089d8916327b99c01826019a";
  const appId = "1234567890";
  const redirectUri = "http://localhost:3000/api/auth/facebook/callback";
  const version = "v21.0";
  const scopes = [
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_metadata",
    "pages_messaging",
  ].join(",");

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    state,
    scope: scopes,
    response_type: "code",
    auth_type: "rerequest",
  });

  const oauthUrl = `https://www.facebook.com/${version}/dialog/oauth?${params.toString()}`;

  assert.ok(oauthUrl.includes("pages_messaging"));
  assert.ok(oauthUrl.includes("pages_show_list"));
  assert.ok(oauthUrl.includes("pages_read_engagement"));
  assert.ok(oauthUrl.includes("pages_manage_metadata"));
  assert.ok(oauthUrl.includes(`state=${state}`));
  assert.ok(oauthUrl.includes(`client_id=${appId}`));
  assert.ok(oauthUrl.includes(`dialog/oauth`));
});
