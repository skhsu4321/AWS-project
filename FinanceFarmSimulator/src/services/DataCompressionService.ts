import * as Crypto from 'expo-crypto';

export interface CompressionResult {
  compressedData: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  checksum: string;
}

export interface DecompressionResult {
  data: any;
  isValid: boolean;
  originalSize: number;
}

export class DataCompressionService {
  private static instance: DataCompressionService;

  private constructor() {}

  public static getInstance(): DataCompressionService {
    if (!DataCompressionService.instance) {
      DataCompressionService.instance = new DataCompressionService();
    }
    return DataCompressionService.instance;
  }

  public async compressData(data: any): Promise<CompressionResult> {
    try {
      // Convert data to JSON string
      const jsonString = JSON.stringify(data);
      const originalSize = new Blob([jsonString]).size;

      // Simple compression using base64 encoding with run-length encoding
      const compressed = this.runLengthEncode(jsonString);
      const compressedBase64 = btoa(compressed);
      const compressedSize = new Blob([compressedBase64]).size;

      // Calculate checksum for integrity verification
      const checksum = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        jsonString,
        { encoding: Crypto.CryptoEncoding.HEX }
      );

      return {
        compressedData: compressedBase64,
        originalSize,
        compressedSize,
        compressionRatio: originalSize > 0 ? compressedSize / originalSize : 1,
        checksum,
      };
    } catch (error) {
      console.error('Data compression failed:', error);
      throw new Error('Failed to compress data');
    }
  }

  public async decompressData(compressedData: string, expectedChecksum?: string): Promise<DecompressionResult> {
    try {
      // Decode from base64
      const compressed = atob(compressedData);
      
      // Decompress using run-length decoding
      const jsonString = this.runLengthDecode(compressed);
      
      // Parse JSON
      const data = JSON.parse(jsonString);
      
      // Verify integrity if checksum provided
      let isValid = true;
      if (expectedChecksum) {
        const checksum = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          jsonString,
          { encoding: Crypto.CryptoEncoding.HEX }
        );
        isValid = checksum === expectedChecksum;
      }

      return {
        data,
        isValid,
        originalSize: new Blob([jsonString]).size,
      };
    } catch (error) {
      console.error('Data decompression failed:', error);
      return {
        data: null,
        isValid: false,
        originalSize: 0,
      };
    }
  }

  private runLengthEncode(input: string): string {
    if (!input) return '';
    
    let encoded = '';
    let count = 1;
    let currentChar = input[0];

    for (let i = 1; i < input.length; i++) {
      if (input[i] === currentChar && count < 255) {
        count++;
      } else {
        // Add the count and character to encoded string
        if (count > 3 || currentChar === '~') {
          // Use run-length encoding for repeated characters
          encoded += `~${String.fromCharCode(count)}${currentChar}`;
        } else {
          // For short runs, just repeat the character
          encoded += currentChar.repeat(count);
        }
        
        currentChar = input[i];
        count = 1;
      }
    }

    // Handle the last sequence
    if (count > 3 || currentChar === '~') {
      encoded += `~${String.fromCharCode(count)}${currentChar}`;
    } else {
      encoded += currentChar.repeat(count);
    }

    return encoded;
  }

  private runLengthDecode(encoded: string): string {
    if (!encoded) return '';
    
    let decoded = '';
    let i = 0;

    while (i < encoded.length) {
      if (encoded[i] === '~' && i + 2 < encoded.length) {
        // This is a run-length encoded sequence
        const count = encoded.charCodeAt(i + 1);
        const char = encoded[i + 2];
        decoded += char.repeat(count);
        i += 3;
      } else {
        // Regular character
        decoded += encoded[i];
        i++;
      }
    }

    return decoded;
  }

  public async compressBatch(dataArray: any[]): Promise<CompressionResult[]> {
    const results: CompressionResult[] = [];
    
    for (const data of dataArray) {
      try {
        const result = await this.compressData(data);
        results.push(result);
      } catch (error) {
        console.error('Failed to compress item in batch:', error);
        // Add a failed result to maintain array alignment
        results.push({
          compressedData: '',
          originalSize: 0,
          compressedSize: 0,
          compressionRatio: 1,
          checksum: '',
        });
      }
    }

    return results;
  }

  public async decompressBatch(
    compressedDataArray: string[],
    checksums?: string[]
  ): Promise<DecompressionResult[]> {
    const results: DecompressionResult[] = [];
    
    for (let i = 0; i < compressedDataArray.length; i++) {
      try {
        const expectedChecksum = checksums?.[i];
        const result = await this.decompressData(compressedDataArray[i], expectedChecksum);
        results.push(result);
      } catch (error) {
        console.error('Failed to decompress item in batch:', error);
        results.push({
          data: null,
          isValid: false,
          originalSize: 0,
        });
      }
    }

    return results;
  }

  public optimizeForSync(data: any): any {
    // Remove unnecessary fields for sync to reduce payload size
    const optimized = { ...data };
    
    // Remove computed fields that can be recalculated
    delete optimized.createdAt;
    delete optimized.updatedAt;
    
    // Remove UI-specific fields
    delete optimized.isSelected;
    delete optimized.isExpanded;
    delete optimized.tempId;
    
    // Compress arrays by removing duplicates and empty values
    Object.keys(optimized).forEach(key => {
      const value = optimized[key];
      
      if (Array.isArray(value)) {
        // Remove duplicates and empty values
        optimized[key] = [...new Set(value.filter(item => 
          item !== null && item !== undefined && item !== ''
        ))];
      }
      
      // Remove empty strings and null values
      if (value === '' || value === null) {
        delete optimized[key];
      }
    });

    return optimized;
  }

  public calculateCompressionStats(results: CompressionResult[]): {
    totalOriginalSize: number;
    totalCompressedSize: number;
    averageCompressionRatio: number;
    totalSavings: number;
    savingsPercentage: number;
  } {
    const totalOriginalSize = results.reduce((sum, r) => sum + r.originalSize, 0);
    const totalCompressedSize = results.reduce((sum, r) => sum + r.compressedSize, 0);
    const averageCompressionRatio = results.length > 0 
      ? results.reduce((sum, r) => sum + r.compressionRatio, 0) / results.length 
      : 1;
    const totalSavings = totalOriginalSize - totalCompressedSize;
    const savingsPercentage = totalOriginalSize > 0 
      ? (totalSavings / totalOriginalSize) * 100 
      : 0;

    return {
      totalOriginalSize,
      totalCompressedSize,
      averageCompressionRatio,
      totalSavings,
      savingsPercentage,
    };
  }

  public async compressForStorage(data: any, useAdvancedCompression: boolean = false): Promise<string> {
    if (useAdvancedCompression) {
      // For larger datasets, use more sophisticated compression
      const optimized = this.optimizeForSync(data);
      const result = await this.compressData(optimized);
      return result.compressedData;
    } else {
      // Simple compression for smaller datasets
      const jsonString = JSON.stringify(data);
      return btoa(jsonString);
    }
  }

  public async decompressFromStorage(
    compressedData: string, 
    useAdvancedCompression: boolean = false
  ): Promise<any> {
    if (useAdvancedCompression) {
      const result = await this.decompressData(compressedData);
      return result.data;
    } else {
      const jsonString = atob(compressedData);
      return JSON.parse(jsonString);
    }
  }
}