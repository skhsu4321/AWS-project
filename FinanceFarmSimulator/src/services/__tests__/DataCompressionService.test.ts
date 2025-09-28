import { DataCompressionService } from '../DataCompressionService';
import * as Crypto from 'expo-crypto';

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn(),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA256',
  },
  CryptoEncoding: {
    HEX: 'HEX',
  },
}));

describe('DataCompressionService', () => {
  let compressionService: DataCompressionService;
  const mockCrypto = Crypto as jest.Mocked<typeof Crypto>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset singleton instance
    (DataCompressionService as any).instance = undefined;
    compressionService = DataCompressionService.getInstance();
    
    // Mock crypto hash function
    mockCrypto.digestStringAsync.mockResolvedValue('mock-hash-value');
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = DataCompressionService.getInstance();
      const instance2 = DataCompressionService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('compressData', () => {
    it('should compress simple data successfully', async () => {
      const testData = { id: '1', name: 'Test Goal', amount: 100 };
      
      const result = await compressionService.compressData(testData);
      
      expect(result).toHaveProperty('compressedData');
      expect(result).toHaveProperty('originalSize');
      expect(result).toHaveProperty('compressedSize');
      expect(result).toHaveProperty('compressionRatio');
      expect(result).toHaveProperty('checksum');
      expect(result.checksum).toBe('mock-hash-value');
      expect(result.originalSize).toBeGreaterThan(0);
      expect(result.compressedSize).toBeGreaterThan(0);
    });

    it('should handle empty data', async () => {
      const testData = {};
      
      const result = await compressionService.compressData(testData);
      
      expect(result.compressedData).toBeDefined();
      expect(result.originalSize).toBeGreaterThan(0);
    });

    it('should handle arrays', async () => {
      const testData = [
        { id: '1', name: 'Goal 1' },
        { id: '2', name: 'Goal 2' },
      ];
      
      const result = await compressionService.compressData(testData);
      
      expect(result.compressedData).toBeDefined();
      expect(result.originalSize).toBeGreaterThan(0);
    });

    it('should handle large data sets', async () => {
      const largeData = {
        goals: Array.from({ length: 100 }, (_, i) => ({
          id: `goal-${i}`,
          title: `Goal ${i}`,
          description: 'A'.repeat(100), // Repeated characters for better compression
          amount: i * 100,
        })),
      };
      
      const result = await compressionService.compressData(largeData);
      
      expect(result.compressedData).toBeDefined();
      expect(result.compressionRatio).toBeLessThan(1); // Should achieve some compression
    });
  });

  describe('decompressData', () => {
    it('should decompress data successfully', async () => {
      const testData = { id: '1', name: 'Test Goal', amount: 100 };
      
      const compressed = await compressionService.compressData(testData);
      const decompressed = await compressionService.decompressData(
        compressed.compressedData,
        compressed.checksum
      );
      
      expect(decompressed.isValid).toBe(true);
      expect(decompressed.data).toEqual(testData);
      expect(decompressed.originalSize).toBe(compressed.originalSize);
    });

    it('should detect corrupted data', async () => {
      const testData = { id: '1', name: 'Test Goal' };
      
      const compressed = await compressionService.compressData(testData);
      
      // Corrupt the compressed data
      const corruptedData = compressed.compressedData.slice(0, -5) + 'XXXXX';
      
      const decompressed = await compressionService.decompressData(
        corruptedData,
        compressed.checksum
      );
      
      expect(decompressed.isValid).toBe(false);
      expect(decompressed.data).toBeNull();
    });

    it('should work without checksum validation', async () => {
      const testData = { id: '1', name: 'Test Goal' };
      
      const compressed = await compressionService.compressData(testData);
      const decompressed = await compressionService.decompressData(compressed.compressedData);
      
      expect(decompressed.isValid).toBe(true);
      expect(decompressed.data).toEqual(testData);
    });

    it('should handle invalid base64 data', async () => {
      const invalidData = 'invalid-base64-data!!!';
      
      const decompressed = await compressionService.decompressData(invalidData);
      
      expect(decompressed.isValid).toBe(false);
      expect(decompressed.data).toBeNull();
    });
  });

  describe('run-length encoding', () => {
    it('should encode repeated characters', () => {
      const input = 'aaabbbcccdddd';
      const encoded = (compressionService as any).runLengthEncode(input);
      
      expect(encoded).toContain('~'); // Should use run-length encoding
    });

    it('should handle short runs efficiently', () => {
      const input = 'abcdef';
      const encoded = (compressionService as any).runLengthEncode(input);
      
      expect(encoded).toBe(input); // Should not use run-length encoding for short runs
    });

    it('should handle empty string', () => {
      const input = '';
      const encoded = (compressionService as any).runLengthEncode(input);
      
      expect(encoded).toBe('');
    });

    it('should decode correctly', () => {
      const original = 'aaabbbcccdddd';
      const encoded = (compressionService as any).runLengthEncode(original);
      const decoded = (compressionService as any).runLengthDecode(encoded);
      
      expect(decoded).toBe(original);
    });
  });

  describe('compressBatch', () => {
    it('should compress multiple items', async () => {
      const testData = [
        { id: '1', name: 'Goal 1' },
        { id: '2', name: 'Goal 2' },
        { id: '3', name: 'Goal 3' },
      ];
      
      const results = await compressionService.compressBatch(testData);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.compressedData).toBeDefined();
        expect(result.originalSize).toBeGreaterThan(0);
        expect(result.checksum).toBe('mock-hash-value');
      });
    });

    it('should handle errors in batch compression', async () => {
      const testData = [
        { id: '1', name: 'Valid Goal' },
        null, // This might cause an error
        { id: '3', name: 'Another Valid Goal' },
      ];
      
      const results = await compressionService.compressBatch(testData);
      
      expect(results).toHaveLength(3);
      // Should have some failed results but maintain array alignment
      expect(results[0].compressedData).toBeDefined();
      expect(results[2].compressedData).toBeDefined();
    });
  });

  describe('decompressBatch', () => {
    it('should decompress multiple items', async () => {
      const testData = [
        { id: '1', name: 'Goal 1' },
        { id: '2', name: 'Goal 2' },
      ];
      
      const compressed = await compressionService.compressBatch(testData);
      const compressedData = compressed.map(c => c.compressedData);
      const checksums = compressed.map(c => c.checksum);
      
      const decompressed = await compressionService.decompressBatch(compressedData, checksums);
      
      expect(decompressed).toHaveLength(2);
      expect(decompressed[0].data).toEqual(testData[0]);
      expect(decompressed[1].data).toEqual(testData[1]);
      expect(decompressed[0].isValid).toBe(true);
      expect(decompressed[1].isValid).toBe(true);
    });
  });

  describe('optimizeForSync', () => {
    it('should remove unnecessary fields', () => {
      const data = {
        id: '1',
        name: 'Test Goal',
        amount: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        isSelected: true,
        tempId: 'temp-123',
        emptyField: '',
        nullField: null,
      };
      
      const optimized = compressionService.optimizeForSync(data);
      
      expect(optimized).not.toHaveProperty('createdAt');
      expect(optimized).not.toHaveProperty('updatedAt');
      expect(optimized).not.toHaveProperty('isSelected');
      expect(optimized).not.toHaveProperty('tempId');
      expect(optimized).not.toHaveProperty('emptyField');
      expect(optimized).not.toHaveProperty('nullField');
      expect(optimized).toHaveProperty('id');
      expect(optimized).toHaveProperty('name');
      expect(optimized).toHaveProperty('amount');
    });

    it('should optimize arrays', () => {
      const data = {
        tags: ['tag1', 'tag2', 'tag1', '', null, 'tag3'],
        categories: [],
      };
      
      const optimized = compressionService.optimizeForSync(data);
      
      expect(optimized.tags).toEqual(['tag1', 'tag2', 'tag3']); // Duplicates and empty values removed
      expect(optimized.categories).toEqual([]);
    });
  });

  describe('calculateCompressionStats', () => {
    it('should calculate statistics correctly', async () => {
      const testData = [
        { id: '1', name: 'A'.repeat(100) },
        { id: '2', name: 'B'.repeat(100) },
      ];
      
      const results = await compressionService.compressBatch(testData);
      const stats = compressionService.calculateCompressionStats(results);
      
      expect(stats).toHaveProperty('totalOriginalSize');
      expect(stats).toHaveProperty('totalCompressedSize');
      expect(stats).toHaveProperty('averageCompressionRatio');
      expect(stats).toHaveProperty('totalSavings');
      expect(stats).toHaveProperty('savingsPercentage');
      
      expect(stats.totalOriginalSize).toBeGreaterThan(0);
      expect(stats.totalCompressedSize).toBeGreaterThan(0);
      expect(stats.averageCompressionRatio).toBeGreaterThan(0);
    });

    it('should handle empty results', () => {
      const stats = compressionService.calculateCompressionStats([]);
      
      expect(stats.totalOriginalSize).toBe(0);
      expect(stats.totalCompressedSize).toBe(0);
      expect(stats.averageCompressionRatio).toBe(1);
      expect(stats.totalSavings).toBe(0);
      expect(stats.savingsPercentage).toBe(0);
    });
  });

  describe('storage compression helpers', () => {
    it('should compress for storage with simple compression', async () => {
      const testData = { id: '1', name: 'Test' };
      
      const compressed = await compressionService.compressForStorage(testData, false);
      const decompressed = await compressionService.decompressFromStorage(compressed, false);
      
      expect(decompressed).toEqual(testData);
    });

    it('should compress for storage with advanced compression', async () => {
      const testData = { id: '1', name: 'Test', createdAt: new Date() };
      
      const compressed = await compressionService.compressForStorage(testData, true);
      const decompressed = await compressionService.decompressFromStorage(compressed, true);
      
      // Should have optimized the data (removed createdAt)
      expect(decompressed).not.toHaveProperty('createdAt');
      expect(decompressed.id).toBe('1');
      expect(decompressed.name).toBe('Test');
    });
  });
});