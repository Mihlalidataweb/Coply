/**
 * IPFS Utility Functions
 * Helper functions for IPFS operations and content management
 */

const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://dweb.link/ipfs/',
];

/**
 * Validate and format IPFS CID
 * @param {string} cid - IPFS CID to validate
 * @returns {boolean} - True if valid CID
 */
function isValidCID(cid) {
  if (!cid || typeof cid !== 'string') return false;

  // Basic CID validation for CIDv0 and CIDv1
  const cidv0Regex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
  const cidv1Regex = /^[1-9A-HJ-NP-Za-km-z]{46,}$/;

  return cidv0Regex.test(cid) || cidv1Regex.test(cid);
}

/**
 * Generate gateway URL for a CID
 * @param {string} cid - IPFS CID
 * @param {number} gatewayIndex - Gateway index to use (default: 0)
 * @returns {string} - Gateway URL
 */
function getGatewayURL(cid, gatewayIndex = 0) {
  if (!isValidCID(cid)) {
    throw new Error('Invalid CID provided');
  }

  const gateway = IPFS_GATEWAYS[gatewayIndex % IPFS_GATEWAYS.length];
  return `${gateway}${cid}`;
}

/**
 * Get all possible gateway URLs for a CID
 * @param {string} cid - IPFS CID
 * @returns {string[]} - Array of gateway URLs
 */
function getAllGatewayURLs(cid) {
  if (!isValidCID(cid)) {
    throw new Error('Invalid CID provided');
  }

  return IPFS_GATEWAYS.map(gateway => `${gateway}${cid}`);
}

/**
 * Extract CID from IPFS URL
 * @param {string} url - IPFS URL
 * @returns {string|null} - CID or null if not found
 */
function extractCIDFromURL(url) {
  if (!url || typeof url !== 'string') return null;

  // Handle various IPFS URL formats
  const patterns = [
    /ipfs\/([a-zA-Z0-9]+)/,
    /\/ipfs\/([a-zA-Z0-9]+)/,
    /^([a-zA-Z0-9]+)$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Create IPFS folder structure for mosaic
 * @param {string} mosaicId - Unique mosaic identifier
 * @returns {object} - Folder structure object
 */
function createMosaicFolderStructure(mosaicId) {
  return {
    path: `mosaics/${mosaicId}`,
    structure: {
      original: `mosaics/${mosaicId}/original/`,
      generated: `mosaics/${mosaicId}/generated/`,
      metadata: `mosaics/${mosaicId}/metadata.json`,
    },
  };
}

/**
 * Generate metadata for IPFS upload
 * @param {object} mosaicData - Mosaic data
 * @returns {object} - Formatted metadata
 */
function generateMetadata(mosaicData) {
  const {
    name,
    description,
    imageCID,
    imageCIDs,
    pattern,
    creator,
    royaltyPercentage,
    attributes = {},
  } = mosaicData;

  return {
    name,
    description,
    image: `ipfs://${imageCID}`,
    external_url: `https://mosaicapp.com/mosaic/${mosaicData.tokenId || 'unknown'}`,
    attributes: [
      {
        trait_type: 'Pattern',
        value: pattern,
      },
      {
        trait_type: 'Image Count',
        value: imageCIDs.length,
      },
      {
        trait_type: 'Created Date',
        value: new Date().toISOString().split('T')[0],
      },
      {
        trait_type: 'Royalty Percentage',
        value: `${(royaltyPercentage / 100).toFixed(1)}%`,
      },
      ...Object.entries(attributes).map(([key, value]) => ({
        trait_type: key,
        value,
      })),
    ],
    source_images: imageCIDs.map(cid => `ipfs://${cid}`),
    creator,
    version: '1.0',
    created_at: new Date().toISOString(),
  };
}

/**
 * Batch process image uploads with progress tracking
 * @param {File[]} files - Array of image files
 * @param {Function} uploadFunction - Upload function (ipfs.add or pinata.upload)
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Array>} - Array of upload results
 */
async function batchUploadImages(files, uploadFunction, onProgress) {
  const results = [];
  const totalFiles = files.length;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    try {
      const result = await uploadFunction(file);
      results.push({
        file: file.name,
        cid: result.cid || result.path,
        size: result.size || file.size,
        success: true,
      });

      // Report progress
      if (onProgress) {
        onProgress({
          completed: i + 1,
          total: totalFiles,
          percentage: Math.round(((i + 1) / totalFiles) * 100),
          currentFile: file.name,
        });
      }
    } catch (error) {
      results.push({
        file: file.name,
        error: error.message,
        success: false,
      });

      console.error(`Failed to upload ${file.name}:`, error);
    }
  }

  return results;
}

/**
 * Check if content is accessible via gateway
 * @param {string} cid - IPFS CID
 * @param {number} timeout - Request timeout in milliseconds
 * @returns {Promise<boolean>} - True if accessible
 */
async function checkContentAvailability(cid, timeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    for (let i = 0; i < IPFS_GATEWAYS.length; i++) {
      const url = getGatewayURL(cid, i);

      try {
        const response = await fetch(url, {
          method: 'HEAD',
          signal: controller.signal,
        });

        if (response.ok) {
          clearTimeout(timeoutId);
          return true;
        }
      } catch (error) {
        // Try next gateway
        continue;
      }
    }

    clearTimeout(timeoutId);
    return false;
  } catch (error) {
    clearTimeout(timeoutId);
    return false;
  }
}

/**
 * Pin content to multiple services for redundancy
 * @param {string} cid - IPFS CID to pin
 * @param {object} services - Pinning service configurations
 * @returns {Promise<object>} - Pinning results
 */
async function pinToMultipleServices(cid, services = {}) {
  const results = {};

  // Pinata
  if (services.pinata) {
    try {
      const response = await fetch('https://api.pinata.cloud/pinning/pinByHash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          pinata_api_key: services.pinata.apiKey,
          pinata_secret_api_key: services.pinata.secretApiKey,
        },
        body: JSON.stringify({
          hashToPin: cid,
        }),
      });

      if (response.ok) {
        results.pinata = { success: true, data: await response.json() };
      } else {
        results.pinata = { success: false, error: await response.text() };
      }
    } catch (error) {
      results.pinata = { success: false, error: error.message };
    }
  }

  return results;
}

/**
 * Convert image file to appropriate format for IPFS
 * @param {File} file - Original image file
 * @param {object} options - Conversion options
 * @returns {Promise<File>} - Processed file
 */
async function processImageForIPFS(file, options = {}) {
  const {
    maxWidth = 2048,
    maxHeight = 2048,
    quality = 0.9,
    format = 'image/webp',
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;

      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }

      if (height > maxHeight) {
        width = (maxHeight / height) * width;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress image
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const processedFile = new File([blob], file.name, {
              type: blob.type,
              lastModified: Date.now(),
            });
            resolve(processedFile);
          } else {
            reject(new Error('Failed to process image'));
          }
        },
        format,
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

module.exports = {
  isValidCID,
  getGatewayURL,
  getAllGatewayURLs,
  extractCIDFromURL,
  createMosaicFolderStructure,
  generateMetadata,
  batchUploadImages,
  checkContentAvailability,
  pinToMultipleServices,
  processImageForIPFS,
  IPFS_GATEWAYS,
};