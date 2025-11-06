import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  Paper,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  ArrowForward as NextIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useWeb3 } from '@/hooks/useWeb3';
import { useIPFS } from '@/hooks/useIPFS';
import { useDraftStorage } from '@/hooks/useDraftStorage';
import { UploadedImage, MosaicPattern, MosaicMetadata } from '@/types';

// Import components
import ImageUploader from '@/components/ImageUploader';
import MosaicGenerator from '@/components/MosaicGenerator';
import MosaicPreview from '@/components/MosaicPreview';
import MintingWizard from '@/components/MintingWizard';
import LoadingSpinner from '@/components/LoadingSpinner';

interface CreateMosaicProps {
  onShowNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  requireConnection?: boolean;
}

const MOSAIC_PATTERNS: MosaicPattern[] = [
  {
    id: 'artistic',
    name: 'AI Artistic',
    description: 'AI-enhanced composition based on color analysis',
    icon: 'palette',
  },
  {
    id: 'grid',
    name: 'Grid',
    description: 'Traditional rectangular grid layout',
    icon: 'grid_on',
  },
  {
    id: 'circular',
    name: 'Circular',
    description: 'Images arranged in circular formation',
    icon: 'radio_button_unchecked',
  },
  {
    id: 'random',
    name: 'Random',
    description: 'Artistic scattered arrangement',
    icon: 'shuffle',
  },
];

const CreateMosaic: React.FC<CreateMosaicProps> = ({
  onShowNotification,
  requireConnection = false,
}) => {
  const { isConnected, account, network, getContract, estimateGas, sendTransaction } = useWeb3();
  const { uploadBatch, uploadDataURL, isUploading } = useIPFS();
  const { saveDraft, autoSaveDraft } = useDraftStorage();

  const [activeStep, setActiveStep] = useState(0);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<MosaicPattern>(MOSAIC_PATTERNS[0]);
  const [generatedMosaic, setGeneratedMosaic] = useState<string>('');
  const [metadata, setMetadata] = useState<MosaicMetadata>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [draftName, setDraftName] = useState('');

  const steps = [
    'Upload Images',
    'Generate Mosaic',
    'Preview & Details',
    'Mint NFT',
  ];

  // Check wallet connection if required
  useEffect(() => {
    if (requireConnection && !isConnected) {
      onShowNotification('warning', 'Please connect your wallet to create mosaics');
    }
  }, [requireConnection, isConnected, onShowNotification]);

  // Auto-save draft periodically
  useEffect(() => {
    if (images.length > 0) {
      const interval = setInterval(() => {
        autoSaveDraft(
          `Auto-save ${new Date().toLocaleDateString()}`,
          images,
          selectedPattern,
          generatedMosaic
        );
      }, 60000); // Auto-save every minute

      return () => clearInterval(interval);
    }
  }, [images, selectedPattern, generatedMosaic, autoSaveDraft]);

  const handleNext = () => {
    if (activeStep === 0 && images.length !== 30) {
      onShowNotification('error', 'Please upload exactly 30 images to continue');
      return;
    }

    if (activeStep === 1 && !generatedMosaic) {
      onShowNotification('error', 'Please generate a mosaic to continue');
      return;
    }

    if (activeStep === 2 && !metadata.name) {
      onShowNotification('error', 'Please add a name for your mosaic');
      return;
    }

    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleImagesChange = (newImages: UploadedImage[]) => {
    setImages(newImages);
  };

  const handlePatternChange = (pattern: MosaicPattern) => {
    setSelectedPattern(pattern);
  };

  const handleMosaicGenerated = (dataUrl: string) => {
    setGeneratedMosaic(dataUrl);
  };

  const handleMetadataSubmit = (submittedMetadata: MosaicMetadata) => {
    setMetadata(submittedMetadata);
  };

  const handleSaveDraft = () => {
    if (!draftName.trim()) {
      onShowNotification('error', 'Please enter a name for your draft');
      return;
    }

    try {
      saveDraft(draftName, images, selectedPattern, generatedMosaic);
      setShowDraftDialog(false);
      setDraftName('');
      onShowNotification('success', 'Draft saved successfully!');
    } catch (error: any) {
      onShowNotification('error', error.message || 'Failed to save draft');
    }
  };

  const handleMintComplete = (tokenId: string, transactionHash: string) => {
    onShowNotification('success', `Mosaic NFT minted successfully! Token ID: ${tokenId}`);
    // Reset form or redirect to gallery
    setActiveStep(0);
    setImages([]);
    setGeneratedMosaic('');
    setMetadata({});
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return <ImageUploader images={images} onImagesChange={handleImagesChange} />;
      case 1:
        return (
          <MosaicGenerator
            images={images}
            pattern={selectedPattern}
            onPatternChange={handlePatternChange}
            onMosaicGenerated={handleMosaicGenerated}
          />
        );
      case 2:
        return (
          <MosaicPreview
            mosaicDataUrl={generatedMosaic}
            originalImages={images}
            pattern={selectedPattern}
            onNext={handleMetadataSubmit}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <MintingWizard
            images={images}
            mosaicDataUrl={generatedMosaic}
            metadata={metadata}
            pattern={selectedPattern}
            onMintComplete={handleMintComplete}
            onBack={handleBack}
          />
        );
      default:
        return 'Unknown step';
    }
  };

  if (requireConnection && !isConnected) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Please connect your wallet to create mosaics
        </Alert>
        <Typography variant="h6" gutterBottom>
          Wallet Connection Required
        </Typography>
        <Typography variant="body1" color="text.secondary">
          You need to connect your Web3 wallet to create and mint mosaic NFTs.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Create Mosaic
        </Typography>
        <Button
          variant="outlined"
          startIcon={<SaveIcon />}
          onClick={() => setShowDraftDialog(true)}
          disabled={images.length === 0}
        >
          Save Draft
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {isUploading && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Uploading images to IPFS... This may take a few moments.
        </Alert>
      )}

      {isConnected && (
        <Box sx={{ mb: 3 }}>
          <Alert severity="success">
            Connected: {account?.slice(0, 6)}...{account?.slice(-4)} • Network: {network.toUpperCase()}
          </Alert>
        </Box>
      )}

      <Box sx={{ mb: 4 }}>
        {getStepContent(activeStep)}
      </Box>

      {/* Navigation buttons (hidden for step 2 and 3 as they have their own navigation) */}
      {activeStep < 2 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            variant="outlined"
            startIcon={<BackIcon />}
            onClick={handleBack}
            disabled={activeStep === 0}
          >
            Back
          </Button>
          <Button
            variant="contained"
            endIcon={<NextIcon />}
            onClick={handleNext}
            disabled={
              (activeStep === 0 && images.length !== 30) ||
              (activeStep === 1 && !generatedMosaic)
            }
          >
            {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
          </Button>
        </Box>
      )}

      {/* Save Draft Dialog */}
      <Dialog open={showDraftDialog} onClose={() => setShowDraftDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Save Draft</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Give your mosaic draft a name so you can easily find it later.
          </Typography>
          <input
            type="text"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder="Enter draft name..."
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px',
            }}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDraftDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveDraft} variant="contained">
            Save Draft
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading Overlay */}
      {isLoading && <LoadingSpinner variant="backdrop" message="Processing..." />}
    </Box>
  );
};

export default CreateMosaic;