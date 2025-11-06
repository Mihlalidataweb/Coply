# Mosaic NFT Creator

Transform your photos into stunning mosaic NFTs on the blockchain. Upload 30 images, let AI create unique compositions, and mint them as tradable NFTs.

## 🎨 Features

- **30-Image Mosaic Creation**: Upload exactly 30 photos to create unique composite artwork
- **AI-Powered Patterns**: Choose from artistic, grid, circular, or random arrangement patterns
- **On-Chain NFT Minting**: Securely mint your mosaics as ERC-721 NFTs
- **IPFS Storage**: Decentralized storage for original images and generated mosaics
- **Multi-Chain Support**: Deploy on Ethereum, Polygon, and Arbitrum
- **Draft Management**: Save and resume your work locally
- **Gallery & Marketplace**: Browse and collect mosaic NFTs
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm/yarn
- MetaMask or compatible Web3 wallet
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd coply
```

2. **Install dependencies**
```bash
# Install all dependencies for the entire project
npm install
```

3. **Set up environment variables**
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your configuration
# Add your private key, API keys, and RPC URLs
```

4. **Deploy smart contracts (optional for development)**
```bash
# Start local Hardhat node
npm run node

# Deploy contracts to localhost
npm run compile-contracts
npm run deploy-contracts
```

5. **Start the development server**
```bash
npm run dev
```

6. **Open your browser**
Navigate to `http://localhost:3000`

## 📁 Project Structure

```
Coply/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # Reusable React components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── pages/           # Page components
│   │   ├── types/           # TypeScript type definitions
│   │   ├── config/          # Configuration files
│   │   └── styles/          # CSS and styling
│   ├── index.html           # Main HTML file
│   └── package.json         # Frontend dependencies
├── contracts/               # Solidity smart contracts
│   ├── MosaicNFT.sol        # ERC-721 NFT contract
│   └── MosaicFactory.sol    # Factory contract for collections
├── scripts/                 # Deployment and utility scripts
│   └── deploy.js            # Contract deployment script
├── ipfs/                    # IPFS utilities and tools
│   └── utils/               # IPFS helper functions
├── hardhat.config.js        # Hardhat configuration
├── package.json             # Root dependencies and scripts
└── README.md               # This file
```

## 🎯 How It Works

### Step 1: Upload Images
- Drag and drop exactly 30 images
- Supported formats: JPEG, PNG, WebP
- Maximum file size: 5MB per image
- Individual image controls (rotate, crop, resize, reorder)

### Step 2: Choose Pattern
- **AI Artistic**: Intelligent composition based on color analysis
- **Grid**: Traditional rectangular grid layout
- **Circular**: Images arranged in circular formation
- **Random**: Artistic scattered arrangement

### Step 3: Generate Mosaic
- Real-time preview with Canvas API
- Adjustable tile size, spacing, and opacity
- Color correction and enhancement options

### Step 4: Add Metadata
- Name and description
- Category and tags
- Royalty configuration for secondary sales

### Step 5: Mint NFT
- Upload to IPFS for decentralized storage
- Mint as ERC-721 token on chosen blockchain
- Pay gas fees and creation fee
- Receive NFT in your wallet

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Network Configuration
HARDHAT_NETWORK=localhost
PRIVATE_KEY=your_private_key_here

# RPC URLs
SEPOLIA_URL=https://sepolia.infura.io/v3/your_infura_project_id
POLYGON_URL=https://polygon-mainnet.infura.io/v3/your_infura_project_id
ARBITRUM_URL=https://arb-mainnet.infura.io/v3/your_infura_project_id

# IPFS Configuration (Pinata)
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_API_KEY=your_pinata_secret_api_key

# Frontend Configuration
REACT_APP_PINATA_API_KEY=your_pinata_api_key
REACT_APP_PINATA_SECRET_API_KEY=your_pinata_secret_api_key
```

### Smart Contract Deployment

#### Local Development
```bash
# Start local Hardhat node
npm run node

# Deploy contracts
npm run compile-contracts
npm run deploy-contracts
```

#### Testnet Deployment
```bash
# Deploy to Sepolia (Ethereum testnet)
HARDHAT_NETWORK=sepolia npm run compile-contracts
HARDHAT_NETWORK=sepolia npm run deploy-contracts
```

#### Mainnet Deployment
```bash
# Deploy to Polygon mainnet
HARDHAT_NETWORK=polygon npm run compile-contracts
HARDHAT_NETWORK=polygon npm run deploy-contracts
```

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev              # Start frontend development server
npm run node             # Start local Hardhat node
npm run compile          # Compile TypeScript
npm run build            # Build for production
npm run preview          # Preview production build

# Smart Contracts
npm run compile-contracts    # Compile Solidity contracts
npm run deploy-contracts     # Deploy contracts
npm run node                 # Start local blockchain

# Utilities
npm run lint             # Run ESLint
npm run typecheck        # Run TypeScript type checking
```

### Smart Contract Development

The smart contracts are located in the `contracts/` directory:

- **MosaicNFT.sol**: Main ERC-721 contract for individual mosaics
- **MosaicFactory.sol**: Factory contract for managing collections

Key features:
- ERC-721 compliant NFTs
- On-chain metadata storage
- Royalty enforcement
- Multi-signature security
- Gas-optimized operations

### Frontend Development

The frontend is built with React, TypeScript, and Material-UI:

- **Components**: Reusable UI components in `src/components/`
- **Hooks**: Custom hooks for Web3, IPFS, and storage in `src/hooks/`
- **Pages**: Main application pages in `src/pages/`
- **Types**: TypeScript definitions in `src/types/`

Key technologies:
- React 18 with TypeScript
- Material-UI for UI components
- Ethers.js for Web3 integration
- IPFS for decentralized storage
- Canvas API for image processing

## 📚 API Reference

### Smart Contract Methods

#### MosaicNFT
```solidity
function createMosaic(
    string memory name,
    string memory description,
    string[] memory imageCIDs,
    string memory mosaicCID,
    MosaicPattern pattern,
    uint256 royaltyPercentage
) external payable returns (uint256);
```

#### MosaicFactory
```solidity
function createCollection(
    string memory name,
    string memory description
) external returns (uint256);

function batchMintToCollection(
    uint256 collectionId,
    string[] memory names,
    string[] memory descriptions,
    string[][] memory imageCIDsArray,
    string[] memory mosaicCIDs,
    MosaicPattern[] memory patterns,
    uint256[] memory royaltyPercentages
) external payable;
```

### Frontend Hooks

#### useWeb3
```typescript
const {
  account,
  isConnected,
  connectWallet,
  disconnectWallet,
  sendTransaction,
  getContract
} = useWeb3();
```

#### useIPFS
```typescript
const {
  uploadFile,
  uploadBatch,
  uploadJSON,
  retrieveFile
} = useIPFS();
```

#### useDraftStorage
```typescript
const {
  drafts,
  saveDraft,
  loadDraft,
  deleteDraft,
  exportDraft,
  importDraft
} = useDraftStorage();
```

## 🧪 Testing

### Smart Contract Testing
```bash
# Run contract tests
npx hardhat test
```

### Frontend Testing
```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration
```

### Manual Testing Checklist

- [ ] Wallet connection and disconnection
- [ ] Image upload (30 images)
- [ ] Pattern selection and generation
- [ ] Metadata input and validation
- [ ] IPFS upload functionality
- [ ] Transaction signing and execution
- [ ] NFT minting and verification
- [ ] Draft saving and loading
- [ ] Mobile responsiveness
- [ ] Error handling and edge cases

## 🔒 Security Considerations

### Smart Contract Security
- OpenZeppelin libraries for standard patterns
- Reentrancy protection on critical functions
- Access control with owner roles
- Input validation and overflow protection
- Emergency pause functionality

### Frontend Security
- Environment variable protection
- Input sanitization and validation
- Secure IPFS pinning with authentication
- Rate limiting for uploads
- XSS protection with React's built-in safeguards

### User Security
- Never share private keys
- Use hardware wallets for mainnet
- Verify transactions before signing
- Keep software updated
- Use official wallet extensions

## 🚀 Deployment

### Frontend Deployment

#### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Netlify
```bash
# Build
npm run build

# Deploy dist/ folder to Netlify
```

### Smart Contract Deployment

See the configuration section above for deployment instructions to different networks.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use conventional commit messages
- Add tests for new features
- Update documentation
- Ensure mobile responsiveness
- Test on multiple networks

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 [Documentation](https://docs.mosaicapp.com)
- 💬 [Discord Community](https://discord.gg/mosaicapp)
- 🐛 [Bug Reports](https://github.com/mosaicapp/issues)
- 📧 [Email Support](mailto:support@mosaicapp.com)

## 🙏 Acknowledgments

- [OpenZeppelin](https://openzeppelin.com/) for secure smart contract libraries
- [Ethers.js](https://ethers.org/) for Web3 interaction
- [Material-UI](https://mui.com/) for React components
- [IPFS](https://ipfs.io/) for decentralized storage
- [Hardhat](https://hardhat.org/) for development framework

---

Built with ❤️ by the Mosaic Team