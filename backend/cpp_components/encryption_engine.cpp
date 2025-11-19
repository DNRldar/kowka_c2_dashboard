/*
 * High-performance encryption engine
 * C++ component for cryptographic operations
 */

#include <iostream>
#include <wincrypt.h>
#include <vector>
#include <stdexcept>

#pragma comment(lib, "advapi32.lib")

class EncryptionEngine {
private:
    HCRYPTPROV crypto_provider;
    
public:
    EncryptionEngine() : crypto_provider(0) {
        if (!CryptAcquireContext(&crypto_provider, nullptr, nullptr, PROV_RSA_AES, CRYPT_VERIFYCONTEXT)) {
            throw std::runtime_error("Failed to acquire cryptographic context");
        }
    }
    
    ~EncryptionEngine() {
        if (crypto_provider) {
            CryptReleaseContext(crypto_provider, 0);
        }
    }
    
    std::vector<BYTE> encrypt_data(const std::vector<BYTE>& plaintext, const std::vector<BYTE>& key) {
        HCRYPTKEY crypto_key;
        if (!CryptImportKey(crypto_provider, key.data(), key.size(), 0, 0, &crypto_key)) {
            throw std::runtime_error("Failed to import encryption key");
        }
        
        DWORD ciphertext_len = plaintext.size() + 256; // Room for padding
        std::vector<BYTE> ciphertext(ciphertext_len);
        
        memcpy(ciphertext.data(), plaintext.data(), plaintext.size());
        
        if (!CryptEncrypt(crypto_key, 0, TRUE, 0, ciphertext.data(), &ciphertext_len, ciphertext.capacity())) {
            CryptDestroyKey(crypto_key);
            throw std::runtime_error("Encryption failed");
        }
        
        ciphertext.resize(ciphertext_len);
        CryptDestroyKey(crypto_key);
        
        return ciphertext;
    }
    
    std::vector<BYTE> decrypt_data(const std::vector<BYTE>& ciphertext, const std::vector<BYTE>& key) {
        HCRYPTKEY crypto_key;
        if (!CryptImportKey(crypto_provider, key.data(), key.size(), 0, 0, &crypto_key)) {
            throw std::runtime_error("Failed to import decryption key");
        }
        
        std::vector<BYTE> plaintext(ciphertext.size());
        memcpy(plaintext.data(), ciphertext.data(), ciphertext.size());
        
        DWORD plaintext_len = ciphertext.size();
        if (!CryptDecrypt(crypto_key, 0, TRUE, 0, plaintext.data(), &plaintext_len)) {
            CryptDestroyKey(crypto_key);
            throw std::runtime_error("Decryption failed");
        }
        
        plaintext.resize(plaintext_len);
        CryptDestroyKey(crypto_key);
        
        return plaintext;
    }
    
    std::vector<BYTE> generate_random_bytes(size_t length) {
        std::vector<BYTE> random_bytes(length);
        if (!CryptGenRandom(crypto_provider, length, random_bytes.data())) {
            throw std::runtime_error("Failed to generate random bytes");
        }
        return random_bytes;
    }
};

// Export functions
extern "C" {
    __declspec(dllexport) void* create_encryption_engine() {
        try {
            return new EncryptionEngine();
        } catch (...) {
            return nullptr;
        }
    }
    
    __declspec(dllexport) void destroy_encryption_engine(void* engine) {
        delete static_cast<EncryptionEngine*>(engine);
    }
    
    __declspec(dllexport) int encrypt_data(void* engine, const unsigned char* input, int input_len, 
                                          const unsigned char* key, int key_len,
                                          unsigned char* output, int output_len) {
        try {
            auto enc_engine = static_cast<EncryptionEngine*>(engine);
            std::vector<BYTE> plaintext(input, input + input_len);
            std::vector<BYTE> key_vec(key, key + key_len);
            
            auto ciphertext = enc_engine->encrypt_data(plaintext, key_vec);
            
            if (output_len >= ciphertext.size()) {
                memcpy(output, ciphertext.data(), ciphertext.size());
                return ciphertext.size();
            }
            return -1; // Output buffer too small
        } catch (...) {
            return -1;
        }
    }
}
