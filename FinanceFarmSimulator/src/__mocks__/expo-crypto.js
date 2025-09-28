module.exports = {
  digestStringAsync: jest.fn(() => Promise.resolve('mock-encryption-key')),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA256',
  },
  CryptoEncoding: {
    HEX: 'HEX',
  },
};