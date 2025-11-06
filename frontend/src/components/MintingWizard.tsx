import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Check as CheckIcon,
  CloudUpload as UploadIcon,
  AccountBalanceWallet as WalletIcon,
  SwapHoriz as TransactionIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useWeb3 } from '@/hooks/useWeb3';
import { useIPFS } from '@/hooks/useIPFS';
import { UploadedImage, MosaicMetadata, MosaicPattern } from '@/types';

// Contract ABI (simplified version)
const MOSAIC_NFT_ABI = [
  {
    "inputs": [],
    "name": "createMosaic",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "payable",
    "type": "function"
  }
];

// Contract addresses (would be deployed and configured)
const CONTRACT_ADDRESSES = {
  ethereum: '0x...', // Would be filled after deployment
  polygon: '0x...',
  arbitrum: '0x...',
};

interface MintingWizardProps {
  images: UploadedImage[];
  mosaicDataUrl: string;
  metadata: MosaicMetadata;
  pattern: MosaicPattern;
  onMintComplete: (tokenId: string, transactionHash: string) => void;
  onBack: () => void;
}

const MintingWizard: React.FC<MintingWizardProps> = ({
  images,
  mosaicDataUrl,
  metadata,
  pattern,
  onMintComplete,
  onBack,
}) => {
  const { account, network, estimateGas, sendTransaction, getGasPrice } = useWeb3();
  const { uploadBatch, uploadDataURL, isUploading, uploadProgress } = useIPFS();

  const [activeStep, setActiveStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedMosaic, setUploadedMosaic] = useState<string>('');
  const [gasEstimate, setGasEstimate] = useState<any>(null);
  const [transactionHash, setTransactionHash] = useState<string>('');
  const [tokenId, setTokenId] = useState<string>('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const mintingSteps = [
    {
      label: 'Upload to IPFS',
      description: 'Upload your images and mosaic to decentralized storage',
      icon: <UploadIcon />,
    },
    {
      label: 'Prepare Transaction',
      description: 'Review details and estimate gas fees',
      icon: <WalletIcon />,
    },
    {
      label: 'Execute Transaction',
      description: 'Send transaction to mint your NFT',
      icon: <TransactionIcon />,
    },
    {
      label: 'Complete',
      description: 'Your mosaic NFT has been successfully minted',
      icon: <SuccessIcon />,
    },
  ];

  useEffect(() => {
    if (activeStep === 1) {
      estimateTransactionGas();
    }
  }, [activeStep]);

  const uploadToIPFS = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Upload original images
      const imageFiles = images.map(img => {
        // Convert blob URL to File
        const fetchPromise = fetch(img.preview);
        return fetchPromise.then(response => response.blob()).then(blob => {
          return new File([blob], img.name, { type: img.type });
        });
      });

      const imageFilesArray = await Promise.all(imageFiles);
      const imageResults = await uploadBatch(imageFilesArray);

      const imageCIDs = imageResults.map(result => result.cid);
      setUploadedImages(imageCIDs);

      // Upload generated mosaic
      const mosaicFileName = `mosaic-${Date.now()}.png`;
      const mosaicResult = await uploadDataURL(mosaicDataUrl, mosaicFileName);
      setUploadedMosaic(mosaicResult.cid);

      setActiveStep(1);
    } catch (err: any) {
      setError(err.message || 'Failed to upload to IPFS');
    } finally {
      setIsProcessing(false);
    }
  };

  const estimateTransactionGas = async () => {
    try {
      const contractAddress = CONTRACT_ADDRESSES[network as keyof typeof CONTRACT_ADDRESSES];
      if (!contractAddress || contractAddress === '0x...') {
        throw new Error('Smart contract not deployed on this network');
      }

      const gasPrice = await getGasPrice();
      const estimatedGas = {
        gasLimit: '300000', // Estimated gas limit
        gasPrice: gasPrice.gasPrice,
        maxFeePerGas: gasPrice.maxFeePerGas,
        maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas,
      };

      setGasEstimate(estimatedGas);
    } catch (err: any) {
      setError(err.message || 'Failed to estimate gas fees');
    }
  };

  const executeTransaction = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const contractAddress = CONTRACT_ADDRESSES[network as keyof typeof CONTRACT_ADDRESSES];
      if (!contractAddress || contractAddress === '0x...') {
        throw new Error('Smart contract not deployed on this network');
      }

      // Convert pattern to enum value
      const patternEnum = ['GRID', 'CIRCULAR', 'RANDOM', 'ARTISTIC'].indexOf(pattern.id.toUpperCase());

      const tx = await sendTransaction(
        {
          address: contractAddress,
          abi: MOSAIC_NFT_ABI,
        },
        'createMosaic',
        [
          metadata.name,
          metadata.description || '',
          uploadedImages,
          uploadedMosaic,
          patternEnum,
          metadata.royaltyPercentage || 250,
        ],
        {
          value: '1000000000000000', // 0.001 ETH creation fee
        }
      );

      setTransactionHash(tx.hash);

      // Wait for transaction to be mined
      const receipt = await tx.wait();

      // Extract token ID from events (simplified)
      if (receipt.events && receipt.events.length > 0) {
        const mintEvent = receipt.events.find((e: any) => e.event === 'MosaicCreated');
        if (mintEvent && mintEvent.args) {
          setTokenId(mintEvent.args.tokenId.toString());
        }
      }

      setActiveStep(3);
      onMintComplete(tokenId, tx.hash);
    } catch (err: any) {
      setError(err.message || 'Transaction failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNext = () => {
    if (activeStep === 0) {
      uploadToIPFS();
    } else if (activeStep === 2) {
      setShowConfirmDialog(true);
    }
  };

  const confirmTransaction = () => {
    setShowConfirmDialog(false);
    executeTransaction();
  };

  const resetWizard = () => {
    setActiveStep(0);
    setUploadedImages([]);
    setUploadedMosaic('');
    setGasEstimate(null);
    setTransactionHash('');
    setTokenId('');
    setError(null);
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              We'll upload your 30 original images and the generated mosaic to IPFS for permanent,
              decentralized storage.
            </Alert>
            {isUploading && (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <CircularProgress sx={{ mb: 2 }} />
                <Typography variant="body1" gutterBottom>
                  Uploading to IPFS...
                </Typography>
                {uploadProgress && (
                  <Typography variant="body2" color="text.secondary">
                    {uploadProgress.percentage}% complete
                  </Typography>
                )}
              </Box>
            )}
            {uploadedImages.length > 0 && (
              <Alert severity="success">
                Successfully uploaded {uploadedImages.length} images and mosaic to IPFS
              </Alert>
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Transaction Details
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Network"
                  secondary={network.toUpperCase()}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="From Account"
                  secondary={account?.slice(0, 6)}...{account?.slice(-4)}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Creation Fee"
                  secondary="0.001 ETH"
                />
              </ListItem>
              {gasEstimate && (
                <>
                  <ListItem>
                    <ListItemText
                      primary="Estimated Gas Limit"
                      secondary={gasEstimate.gasLimit?.toString()}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Estimated Gas Price"
                      secondary={`${parseFloat(gasEstimate.gasPrice || 0) / 1e9} Gwei`}
                    />
                  </ListItem>
                </>
              )}
            </List>

            <Paper sx={{ p: 2, mt: 2, backgroundColor: '#f5f5f5' }}>
              <Typography variant="subtitle2" gutterBottom>
                Mosaic Details
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Name: {metadata.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pattern: {pattern.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Images: {images.length}
              </Typography>
              {metadata.royaltyPercentage && (
                <Typography variant="body2" color="text.secondary">
                  Royalty: {(metadata.royaltyPercentage / 100).toFixed(1)}%
                </Typography>
              )}
            </Paper>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            {isProcessing ? (
              <>
                <CircularProgress sx={{ mb: 3, size: 60 }} />
                <Typography variant="h6" gutterBottom>
                  Processing Transaction...
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Please confirm the transaction in your wallet and wait for it to be processed.
                </Typography>
              </>
            ) : (
              <>
                <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 3 }} />
                <Typography variant="h6" gutterBottom>
                  Ready to Mint
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Click "Execute Transaction" to mint your mosaic NFT
                </Typography>
              </>
            )}
            {transactionHash && (
              <Alert severity="success" sx={{ mt: 3 }}>
                Transaction submitted: {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
              </Alert>
            )}
          </Box>
        );

      case 3:
        return (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <SuccessIcon sx={{ fontSize: 60, color: 'success.main', mb: 3 }} />
            <Typography variant="h6" gutterBottom>
              NFT Successfully Minted!
            </Typography>
            <Typography variant="body1" gutterBottom>
              Token ID: {tokenId}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Transaction: {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
            </Typography>
            <Box sx={{ mt: 3 }}>
              <Chip label="Minted Successfully" color="success" />
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} orientation="vertical">
          {mintingSteps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel StepIconComponent={() => {
                if (index < activeStep) {
                  return <CheckIcon color="success" />;
                }
                if (index === activeStep) {
                  return isProcessing ? <CircularProgress size={24} /> : step.icon;
                }
                return step.icon;
              }}>
                {step.label}
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {step.description}
                </Typography>
                {renderStepContent(index)}
                <Box sx={{ mt: 2 }}>
                  {index < 2 && (
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      disabled={isProcessing || (index === 0 && !uploadedMosaic)}
                      sx={{ mr: 1 }}
                    >
                      {isProcessing ? 'Processing...' : 'Continue'}
                    </Button>
                  )}
                  {index === 2 && !isProcessing && !transactionHash && (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleNext}
                      sx={{ mr: 1 }}
                    >
                      Execute Transaction
                    </Button>
                  )}
                  {index > 0 && (
                    <Button
                      onClick={resetWizard}
                      disabled={isProcessing}
                    >
                      Reset
                    </Button>
                  )}
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }} action={
          <Button size="small" onClick={() => setError(null)}>
            Dismiss
          </Button>
        }>
          {error}
        </Alert>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Transaction</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            You are about to mint your mosaic as an NFT. This action requires:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="Creation Fee: 0.001 ETH" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Gas Fees: Variable based on network congestion" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Network: {network.toUpperCase()}" />
            </ListItem>
          </List>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Transaction fees are paid to the network and are non-refundable.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
          <Button onClick={confirmTransaction} variant="contained">
            Confirm & Mint
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MintingWizard;