import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Zoom,
  Fab,
} from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Fullscreen as FullscreenIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import html2canvas from 'html2canvas';
import { MosaicMetadata, UploadedImage } from '@/types';

interface MosaicPreviewProps {
  mosaicDataUrl: string;
  originalImages: UploadedImage[];
  pattern: { id: string; name: string };
  onNext: (metadata: MosaicMetadata) => void;
  onBack: () => void;
}

const MosaicPreview: React.FC<MosaicPreviewProps> = ({
  mosaicDataUrl,
  originalImages,
  pattern,
  onNext,
  onBack,
}) => {
  const [zoom, setZoom] = useState(1);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [metadata, setMetadata] = useState<MosaicMetadata>({
    name: '',
    description: '',
    category: 'art',
    tags: [],
    royaltyPercentage: 250, // 2.5%
  });
  const [isSaving, setIsSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);

  const categories = [
    { value: 'art', label: 'Digital Art' },
    { value: 'photography', label: 'Photography' },
    { value: 'abstract', label: 'Abstract' },
    { value: 'nature', label: 'Nature' },
    { value: 'urban', label: 'Urban' },
    { value: 'portrait', label: 'Portrait' },
    { value: 'landscape', label: 'Landscape' },
    { value: 'experimental', label: 'Experimental' },
  ];

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(mosaicDataUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mosaic-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading mosaic:', error);
      alert('Error downloading image. Please try again.');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: metadata.name || 'My Mosaic Creation',
          text: metadata.description || 'Check out my mosaic creation!',
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleSavePreview = async () => {
    if (!previewRef.current) return;

    setIsSaving(true);
    try {
      const canvas = await html2canvas(previewRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `mosaic-preview-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error saving preview:', error);
      alert('Error saving preview. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !metadata.tags?.includes(tagInput.trim())) {
      setMetadata(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setMetadata(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || [],
    }));
  };

  const handleNext = () => {
    if (!metadata.name.trim()) {
      alert('Please enter a name for your mosaic.');
      return;
    }
    onNext(metadata);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Preview & Details
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
        >
          Back to Generation
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Mosaic Preview</Typography>
              <Box>
                <Tooltip title="Zoom Out">
                  <IconButton onClick={handleZoomOut} disabled={zoom <= 0.5}>
                    <ZoomOutIcon />
                  </IconButton>
                </Tooltip>
                <Typography variant="caption" sx={{ mx: 1, minWidth: '40px', textAlign: 'center' }}>
                  {Math.round(zoom * 100)}%
                </Typography>
                <Tooltip title="Zoom In">
                  <IconButton onClick={handleZoomIn} disabled={zoom >= 3}>
                    <ZoomInIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Fullscreen">
                  <IconButton onClick={() => setShowFullscreen(true)}>
                    <FullscreenIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            <Box
              sx={{
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid #ddd',
                borderRadius: 1,
                backgroundColor: '#fafafa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px',
              }}
            >
              <Zoom in={true}>
                <img
                  src={mosaicDataUrl}
                  alt="Generated mosaic"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '600px',
                    transform: `scale(${zoom})`,
                    transition: 'transform 0.3s ease',
                    cursor: zoom > 1 ? 'move' : 'default',
                  }}
                  draggable={false}
                />
              </Zoom>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
              >
                Download
              </Button>
              <Button
                variant="outlined"
                startIcon={<ShareIcon />}
                onClick={handleShare}
              >
                Share
              </Button>
              <Button
                variant="outlined"
                startIcon={isSaving ? <CircularProgress size={16} /> : <SaveIcon />}
                onClick={handleSavePreview}
                disabled={isSaving}
              >
                Save Preview
              </Button>
            </Box>
          </Paper>

          <Paper sx={{ p: 2, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Source Images ({originalImages.length})
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {originalImages.slice(0, 10).map((image) => (
                <Box
                  key={image.id}
                  component="img"
                  src={image.preview}
                  alt={image.name}
                  sx={{
                    width: 60,
                    height: 60,
                    objectFit: 'cover',
                    borderRadius: 1,
                    border: '1px solid #ddd',
                  }}
                />
              ))}
              {originalImages.length > 10 && (
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1,
                    border: '1px solid #ddd',
                    backgroundColor: '#f5f5f5',
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                  }}
                >
                  +{originalImages.length - 10}
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Mosaic Details
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Chip
                label={`Pattern: ${pattern.name}`}
                color="primary"
                variant="outlined"
                size="small"
                sx={{ mr: 1 }}
              />
              <Chip
                label={`${originalImages.length} images`}
                color="secondary"
                variant="outlined"
                size="small"
              />
            </Box>

            <TextField
              fullWidth
              label="Mosaic Name"
              value={metadata.name}
              onChange={(e) => setMetadata(prev => ({ ...prev, name: e.target.value }))}
              required
              sx={{ mb: 2 }}
              helperText="Give your mosaic a memorable name"
            />

            <TextField
              fullWidth
              label="Description"
              value={metadata.description}
              onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
              multiline
              rows={3}
              sx={{ mb: 2 }}
              helperText="Describe your mosaic creation"
            />

            <TextField
              fullWidth
              select
              label="Category"
              value={metadata.category}
              onChange={(e) => setMetadata(prev => ({ ...prev, category: e.target.value }))}
              sx={{ mb: 2 }}
            >
              {categories.map((category) => (
                <MenuItem key={category.value} value={category.value}>
                  {category.label}
                </MenuItem>
              ))}
            </TextField>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Tags
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                {metadata.tags?.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    size="small"
                  />
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  size="small"
                  placeholder="Add a tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  sx={{ flexGrow: 1 }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim()}
                >
                  Add
                </Button>
              </Box>
            </Box>

            <TextField
              fullWidth
              label="Royalty Percentage"
              type="number"
              value={metadata.royaltyPercentage}
              onChange={(e) => setMetadata(prev => ({
                ...prev,
                royaltyPercentage: Math.min(1000, Math.max(0, parseInt(e.target.value) || 0))
              }))}
              inputProps={{ min: 0, max: 1000, step: 50 }}
              sx={{ mb: 2 }}
              helperText="Percentage for secondary sales (0-1000, where 1000 = 10%)"
            />

            <Divider sx={{ my: 2 }} />

            <Alert severity="info" sx={{ mb: 2 }}>
              After minting, your mosaic will be permanently stored on the blockchain as an NFT.
            </Alert>

            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleNext}
              disabled={!metadata.name.trim()}
              sx={{ mb: 1 }}
            >
              Proceed to Minting
            </Button>

            <Typography variant="caption" color="text.secondary" textAlign="center" display="block">
              Gas fees will apply during the minting process
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Fullscreen Dialog */}
      <Dialog
        open={showFullscreen}
        onClose={() => setShowFullscreen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: 'transparent', boxShadow: 'none' }
        }}
      >
        <DialogContent sx={{ p: 1, textAlign: 'center' }}>
          <img
            src={mosaicDataUrl}
            alt="Fullscreen mosaic"
            style={{
              maxWidth: '100%',
              maxHeight: '80vh',
              objectFit: 'contain',
            }}
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center' }}>
          <Button onClick={() => setShowFullscreen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Hidden preview for saving */}
      <Box
        ref={previewRef}
        sx={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          width: '800px',
          p: 3,
          backgroundColor: 'white',
        }}
      >
        <Typography variant="h4" sx={{ mb: 2, textAlign: 'center' }}>
          {metadata.name || 'Untitled Mosaic'}
        </Typography>
        <img
          src={mosaicDataUrl}
          alt="Mosaic preview"
          style={{ width: '100%', height: 'auto' }}
        />
        <Typography variant="body2" sx={{ mt: 2, textAlign: 'center', color: '#666' }}>
          {metadata.description || 'A beautiful mosaic created from 30 images'}
        </Typography>
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Chip label={pattern.name} size="small" />
          <Chip label={`${originalImages.length} images`} size="small" sx={{ ml: 1 }} />
        </Box>
      </Box>
    </Box>
  );
};

export default MosaicPreview;