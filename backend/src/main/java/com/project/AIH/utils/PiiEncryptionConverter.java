package com.project.AIH.utils;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;

@Converter
public class PiiEncryptionConverter implements AttributeConverter<String, String> {

    private static final String ALGORITHM = "AES/CBC/PKCS5Padding";
    private static final byte[] KEY_BYTES = "AntigravitySecurePIIKey_256Bytes".getBytes(StandardCharsets.UTF_8); // 32 bytes for AES-256
    private static final SecretKeySpec SECRET_KEY = new SecretKeySpec(KEY_BYTES, "AES");
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int IV_SIZE = 16;

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null) {
            return null;
        }
        try {
            // Generate random IV
            byte[] iv = new byte[IV_SIZE];
            RANDOM.nextBytes(iv);
            IvParameterSpec ivSpec = new IvParameterSpec(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, SECRET_KEY, ivSpec);

            byte[] encryptedBytes = cipher.doFinal(attribute.getBytes(StandardCharsets.UTF_8));

            // Merge IV and encrypted bytes: [IV (16 bytes)][EncryptedBytes]
            byte[] combined = new byte[iv.length + encryptedBytes.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(encryptedBytes, 0, combined, iv.length, encryptedBytes.length);

            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new RuntimeException("Error encrypting PII attribute", e);
        }
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        try {
            byte[] combined = Base64.getDecoder().decode(dbData);
            if (combined.length < IV_SIZE) {
                throw new IllegalArgumentException("Invalid encrypted data size");
            }

            // Extract IV
            byte[] iv = new byte[IV_SIZE];
            System.arraycopy(combined, 0, iv, 0, IV_SIZE);
            IvParameterSpec ivSpec = new IvParameterSpec(iv);

            // Extract encrypted bytes
            int encryptedLength = combined.length - IV_SIZE;
            byte[] encryptedBytes = new byte[encryptedLength];
            System.arraycopy(combined, IV_SIZE, encryptedBytes, 0, encryptedLength);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, SECRET_KEY, ivSpec);

            byte[] decryptedBytes = cipher.doFinal(encryptedBytes);
            return new String(decryptedBytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Error decrypting PII attribute", e);
        }
    }
}
