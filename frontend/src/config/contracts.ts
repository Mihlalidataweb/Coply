// Contract configuration for different networks
export const CONTRACT_ADDRESSES = {
  // Local development
  localhost: {
    MosaicNFT: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    MosaicFactory: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  },

  // Ethereum Testnet
  sepolia: {
    MosaicNFT: '0x...', // Will be filled after deployment
    MosaicFactory: '0x...', // Will be filled after deployment
  },

  // Ethereum Mainnet
  ethereum: {
    MosaicNFT: '0x...', // Will be filled after deployment
    MosaicFactory: '0x...', // Will be filled after deployment
  },

  // Polygon Testnet
  mumbai: {
    MosaicNFT: '0x...', // Will be filled after deployment
    MosaicFactory: '0x...', // Will be filled after deployment
  },

  // Polygon Mainnet
  polygon: {
    MosaicNFT: '0x...', // Will be filled after deployment
    MosaicFactory: '0x...', // Will be filled after deployment
  },

  // Arbitrum Testnet
  'arbitrum-sepolia': {
    MosaicNFT: '0x...', // Will be filled after deployment
    MosaicFactory: '0x...', // Will be filled after deployment
  },

  // Arbitrum Mainnet
  arbitrum: {
    MosaicNFT: '0x...', // Will be filled after deployment
    MosaicFactory: '0x...', // Will be filled after deployment
  },
};

// Default network to use
export const DEFAULT_NETWORK = 'localhost';

// Network display names
export const NETWORK_DISPLAY_NAMES = {
  localhost: 'Local Development',
  sepolia: 'Sepolia Testnet',
  ethereum: 'Ethereum Mainnet',
  mumbai: 'Mumbai Testnet',
  polygon: 'Polygon Mainnet',
  'arbitrum-sepolia': 'Arbitrum Sepolia',
  arbitrum: 'Arbitrum One',
};

// RPC URLs (fallbacks)
export const RPC_URLS = {
  ethereum: process.env.REACT_APP_ETHEREUM_RPC || 'https://mainnet.infura.io/v3/',
  polygon: process.env.REACT_APP_POLYGON_RPC || 'https://polygon-mainnet.infura.io/v3/',
  arbitrum: process.env.REACT_APP_ARBITRUM_RPC || 'https://arb1.arbitrum.io/rpc',
};

// Block Explorer URLs
export const BLOCK_EXPLORERS = {
  ethereum: 'https://etherscan.io',
  sepolia: 'https://sepolia.etherscan.io',
  polygon: 'https://polygonscan.com',
  mumbai: 'https://mumbai.polygonscan.com',
  arbitrum: 'https://arbiscan.io',
  'arbitrum-sepolia': 'https://sepolia.arbiscan.io',
};

// IPFS Configuration
export const IPFS_CONFIG = {
  gateways: [
    'https://ipfs.io/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://dweb.link/ipfs/',
  ],
  pinata: {
    apiKey: process.env.REACT_APP_PINATA_API_KEY || '',
    secretApiKey: process.env.REACT_APP_PINATA_SECRET_API_KEY || '',
  },
};