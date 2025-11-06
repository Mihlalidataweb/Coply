import { useState, useCallback } from 'react';
import { create } from 'ipfs-http-client';
import axios from 'axios';
import { IPFSUploadResult } from '@/types';

interface UseIPFSOptions {
  gateway?: string;
  apiKey?: string;
  secretApiKey?: string;
}

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';
const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';

export const useIPFS = (options: UseIPFSOptions = {}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize IPFS client (fallback to local node)
  const ipfs = options.apiKey && options.secretApiKey
    ? create({
        url: 'https://api.pinata.cloud/pinning/pinFileToIPFS',
        headers: {
          pinata_api_key: options.apiKey,
          pinata_secret_api_key: options.secretApiKey,
        },
      })
    : create({ url: 'http://localhost:5001/api/v0' });

  // Upload a single file to IPFS
  const uploadFile = useCallback(async (
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<IPFSUploadResult> => {
    setIsUploading(true);
    setError(null);
    setUploadProgress(null);

    try {
      // Try Pinata first if API keys are available
      if (options.apiKey && options.secretApiKey) {
        return await uploadToPinata(file, onProgress);
      } else {
        return await uploadToLocalNode(file, onProgress);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  }, [options.apiKey, options.secretApiKey]);

  // Upload to Pinata
  const uploadToPinata = async (
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<IPFSUploadResult> => {
    const formData = new FormData();
    formData.append('file', file);

    const metadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        uploadedAt: Date.now().toString(),
        fileSize: file.size.toString(),
        fileType: file.type,
      },
    });
    formData.append('pinataMetadata', metadata);

    try {
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          maxBodyLength: Infinity,
          headers: {
            'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`,
            pinata_api_key: options.apiKey,
            pinata_secret_api_key: options.secretApiKey,
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total && onProgress) {
              const progress: UploadProgress = {
                loaded: progressEvent.loaded,
                total: progressEvent.total,
                percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total),
              };
              setUploadProgress(progress);
              onProgress(progress);
            }
          },
        }
      );

      const { IpfsHash } = response.data;

      return {
        cid: IpfsHash,
        url: `${PINATA_GATEWAY}${IpfsHash}`,
        size: file.size,
      };
    } catch (error) {
      console.error('Pinata upload error:', error);
      throw new Error('Failed to upload to Pinata');
    }
  };

  // Upload to local IPFS node
  const uploadToLocalNode = async (
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<IPFSUploadResult> => {
    try {
      const result = await ipfs.add(file, {
        progress: (bytes) => {
          if (onProgress) {
            const progress: UploadProgress = {
              loaded: bytes,
              total: file.size,
              percentage: Math.round((bytes * 100) / file.size),
            };
            setUploadProgress(progress);
            onProgress(progress);
          }
        },
      });

      return {
        cid: result.cid.toString(),
        url: `${IPFS_GATEWAY}${result.cid}`,
        size: file.size,
      };
    } catch (error) {
      console.error('Local IPFS upload error:', error);
      throw new Error('Failed to upload to local IPFS node');
    }
  };

  // Upload multiple files (batch upload)
  const uploadBatch = useCallback(async (
    files: File[],
    onProgress?: (progress: UploadProgress, currentFile: string) => void
  ): Promise<IPFSUploadResult[]> => {
    setIsUploading(true);
    setError(null);
    setUploadProgress(null);

    const results: IPFSUploadResult[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const result = await uploadFile(file, (progress) => {
          if (onProgress) {
            onProgress(progress, file.name);
          }
        });
        results.push(result);
      }

      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Batch upload failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  }, [uploadFile]);

  // Upload JSON metadata
  const uploadJSON = useCallback(async (
    data: any,
    name?: string
  ): Promise<IPFSUploadResult> => {
    setIsUploading(true);
    setError(null);

    try {
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const file = new File([blob], name || 'metadata.json', { type: 'application/json' });

      if (options.apiKey && options.secretApiKey) {
        const formData = new FormData();
        formData.append('file', file);

        const metadata = JSON.stringify({
          name: name || 'metadata.json',
          keyvalues: {
            type: 'metadata',
            uploadedAt: Date.now().toString(),
          },
        });
        formData.append('pinataMetadata', metadata);

        const response = await axios.post(
          'https://api.pinata.cloud/pinning/pinFileToIPFS',
          formData,
          {
            headers: {
              'Content-Type': `multipart/form-data`,
              pinata_api_key: options.apiKey,
              pinata_secret_api_key: options.secretApiKey,
            },
          }
        );

        const { IpfsHash } = response.data;

        return {
          cid: IpfsHash,
          url: `${PINATA_GATEWAY}${IpfsHash}`,
          size: file.size,
        };
      } else {
        const result = await ipfs.add(file);
        return {
          cid: result.cid.toString(),
          url: `${IPFS_GATEWAY}${result.cid}`,
          size: file.size,
        };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'JSON upload failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, [options.apiKey, options.secretApiKey, ipfs]);

  // Upload data URL (e.g., generated mosaic image)
  const uploadDataURL = useCallback(async (
    dataUrl: string,
    filename: string
  ): Promise<IPFSUploadResult> => {
    // Convert data URL to Blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const file = new File([blob], filename, { type: 'image/png' });

    return uploadFile(file);
  }, [uploadFile]);

  // Retrieve file from IPFS
  const retrieveFile = useCallback(async (cid: string): Promise<string> => {
    try {
      const url = `${options.gateway || IPFS_GATEWAY}${cid}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to retrieve file: ${response.statusText}`);
      }

      return response.url;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Retrieval failed';
      setError(errorMessage);
      throw err;
    }
  }, [options.gateway]);

  // Retrieve JSON metadata from IPFS
  const retrieveJSON = useCallback(async (cid: string): Promise<any> => {
    try {
      const url = `${options.gateway || IPFS_GATEWAY}${cid}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to retrieve JSON: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'JSON retrieval failed';
      setError(errorMessage);
      throw err;
    }
  }, [options.gateway]);

  // Pin file (for persistence)
  const pinFile = useCallback(async (cid: string): Promise<void> => {
    if (!options.apiKey || !options.secretApiKey) {
      console.warn('Pinata API keys not available, skipping pin operation');
      return;
    }

    try {
      await axios.post(
        'https://api.pinata.cloud/pinning/pinByHash',
        {
          hashToPin: cid,
        },
        {
          headers: {
            pinata_api_key: options.apiKey,
            pinata_secret_api_key: options.secretApiKey,
          },
        }
      );
    } catch (err) {
      console.error('Pin operation failed:', err);
      // Don't throw error here as pinning is not critical for basic functionality
    }
  }, [options.apiKey, options.secretApiKey]);

  // Generate gateway URL
  const getGatewayURL = useCallback((cid: string, gateway?: string): string => {
    const selectedGateway = gateway || options.gateway || IPFS_GATEWAY;
    return `${selectedGateway}${cid}`;
  }, [options.gateway]);

  // Validate CID
  const isValidCID = useCallback((cid: string): boolean => {
    // Basic CID validation - checks for valid CID format
    const cidRegex = /^[Qm1-9A-HJ-NP-Za-km-z]{44,}|b[A-Za-z2-7]{58,}|z[A-Za-z2-9]{58,}$/;
    return cidRegex.test(cid);
  }, []);

  return {
    // Upload functions
    uploadFile,
    uploadBatch,
    uploadJSON,
    uploadDataURL,

    // Retrieve functions
    retrieveFile,
    retrieveJSON,

    // Utility functions
    pinFile,
    getGatewayURL,
    isValidCID,

    // State
    isUploading,
    uploadProgress,
    error,

    // Clear error
    clearError: () => setError(null),
  };
};