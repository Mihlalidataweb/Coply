import React, { useCallback, useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Grid,
  Typography,
  IconButton,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  LinearProgress,
  Fab,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  RotateRight as RotateIcon,
  ZoomIn as ZoomIcon,
  Crop as CropIcon,
  Add as AddIcon,
  Save as SaveIcon,
  FolderOpen as OpenIcon,
} from '@mui/icons-material';
import { UploadedImage } from '@/types';

interface ImageUploaderProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  maxSize?: number; // in bytes
  acceptedFormats?: string[];
}

const MAX_IMAGES = 30;
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];

const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onImagesChange,
  maxImages = MAX_IMAGES,
  maxSize = MAX_SIZE,
  acceptedFormats = ACCEPTED_FORMATS,
}) => {
  const [selectedImage, setSelectedImage] = useState<UploadedImage | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      const newImages: UploadedImage[] = acceptedFiles.map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
        type: file.type,
        position: { x: 0, y: 0 },
        rotation: 0,
        scale: 1,
        cropped: false,
      }));

      const totalImages = images.length + newImages.length;
      if (totalImages > maxImages) {
        alert(`You can only upload up to ${maxImages} images. Selected ${newImages.length} more would exceed the limit.`);
        return;
      }

      onImagesChange([...images, ...newImages]);
    },
    [images, maxImages, onImagesChange]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: acceptedFormats.reduce((acc, format) => {
      acc[format] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxSize,
    maxFiles: maxImages - images.length,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
  });

  const removeImage = (id: string) => {
    const imageToRemove = images.find(img => img.id === id);
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    onImagesChange(images.filter(img => img.id !== id));
  };

  const openEditDialog = (image: UploadedImage) => {
    setSelectedImage(image);
    setEditDialogOpen(true);
  };

  const updateImage = (updatedImage: UploadedImage) => {
    onImagesChange(images.map(img =>
      img.id === updatedImage.id ? updatedImage : img
    ));
    setSelectedImage(updatedImage);
  };

  const handleImageEdit = (property: keyof UploadedImage, value: any) => {
    if (selectedImage) {
      updateImage({
        ...selectedImage,
        [property]: value,
      });
    }
  };

  const rotateImage = () => {
    if (selectedImage) {
      const newRotation = ((selectedImage.rotation || 0) + 90) % 360;
      handleImageEdit('rotation', newRotation);
    }
  };

  const clearAllImages = () => {
    images.forEach(img => URL.revokeObjectURL(img.preview));
    onImagesChange([]);
  };

  const saveDraft = () => {
    const draftData = {
      id: Date.now().toString(),
      name: `Draft ${new Date().toLocaleDateString()}`,
      images: images.map(img => ({
        ...img,
        preview: img.preview, // In a real app, we'd store this differently
      })),
      pattern: { id: 'grid', name: 'Grid', description: 'Grid pattern', icon: 'grid' },
      createdAt: Date.now(),
      lastModified: Date.now(),
    };

    const existingDrafts = JSON.parse(localStorage.getItem('mosaicDrafts') || '[]');
    existingDrafts.push(draftData);
    localStorage.setItem('mosaicDrafts', JSON.stringify(existingDrafts));

    alert('Draft saved successfully!');
  };

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Create Your Mosaic
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<SaveIcon />}
            onClick={saveDraft}
            disabled={images.length === 0}
            sx={{ mr: 2 }}
          >
            Save Draft
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={clearAllImages}
            disabled={images.length === 0}
          >
            Clear All
          </Button>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Upload exactly {maxImages} images to create your mosaic. You can arrange them in the next step.
      </Alert>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Uploaded Images ({images.length}/{maxImages})
        </Typography>
        <LinearProgress
          variant="determinate"
          value={(images.length / maxImages) * 100}
          sx={{ mb: 2 }}
        />
      </Box>

      {images.length < maxImages && (
        <Card
          {...getRootProps()}
          sx={{
            border: `2px dashed ${isDragging ? 'primary.main' : 'grey.300'}`,
            backgroundColor: isDragging ? 'action.hover' : 'background.paper',
            cursor: 'pointer',
            p: 4,
            textAlign: 'center',
            mb: 3,
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: 'action.hover',
              borderColor: 'primary.main',
            },
          }}
        >
          <input {...getInputProps()} />
          <AddIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Drop images here or click to browse
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Maximum {maxImages} images • Up to {Math.round(maxSize / 1024 / 1024)}MB each
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Accepted formats: JPEG, PNG, WebP
          </Typography>
        </Card>
      )}

      {images.length > 0 && (
        <Grid container spacing={2}>
          {images.map((image) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={image.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={image.preview}
                  alt={image.name}
                  sx={{
                    objectFit: 'cover',
                    transform: `rotate(${image.rotation}deg) scale(${image.scale || 1})`,
                    transition: 'transform 0.3s ease',
                  }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle2" noWrap>
                    {image.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(image.size / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                  {image.rotation !== undefined && image.rotation !== 0 && (
                    <Chip
                      label={`${image.rotation}°`}
                      size="small"
                      variant="outlined"
                      sx={{ mt: 1 }}
                    />
                  )}
                </CardContent>
                <CardActions>
                  <IconButton
                    size="small"
                    onClick={() => openEditDialog(image)}
                    title="Edit image"
                  >
                    <ZoomIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => {
                      const updatedImage = { ...image, rotation: ((image.rotation || 0) + 90) % 360 };
                      updateImage(updatedImage);
                    }}
                    title="Rotate image"
                  >
                    <RotateIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => removeImage(image.id)}
                    title="Remove image"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        {selectedImage && (
          <>
            <DialogTitle>Edit Image: {selectedImage.name}</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 2 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <img
                    src={selectedImage.preview}
                    alt={selectedImage.name}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '300px',
                      transform: `rotate(${selectedImage.rotation}deg) scale(${selectedImage.scale || 1})`,
                      transition: 'transform 0.3s ease',
                    }}
                  />
                </Box>

                <Box>
                  <Typography gutterBottom>Rotation: {selectedImage.rotation}°</Typography>
                  <Slider
                    value={selectedImage.rotation || 0}
                    onChange={(_, value) => handleImageEdit('rotation', value as number)}
                    min={0}
                    max={360}
                    step={15}
                    marks={[
                      { value: 0, label: '0°' },
                      { value: 90, label: '90°' },
                      { value: 180, label: '180°' },
                      { value: 270, label: '270°' },
                      { value: 360, label: '360°' },
                    ]}
                  />
                </Box>

                <Box>
                  <Typography gutterBottom>Scale: {selectedImage.scale?.toFixed(1) || 1.0}x</Typography>
                  <Slider
                    value={selectedImage.scale || 1}
                    onChange={(_, value) => handleImageEdit('scale', value as number)}
                    min={0.5}
                    max={2}
                    step={0.1}
                    marks={[
                      { value: 0.5, label: '0.5x' },
                      { value: 1, label: '1.0x' },
                      { value: 1.5, label: '1.5x' },
                      { value: 2, label: '2.0x' },
                    ]}
                  />
                </Box>

                <Box>
                  <Typography gutterBottom>Position</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption">X: {selectedImage.position?.x || 0}</Typography>
                      <Slider
                        value={selectedImage.position?.x || 0}
                        onChange={(_, value) => handleImageEdit('position', {
                          ...selectedImage.position,
                          x: value as number,
                        })}
                        min={-100}
                        max={100}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption">Y: {selectedImage.position?.y || 0}</Typography>
                      <Slider
                        value={selectedImage.position?.y || 0}
                        onChange={(_, value) => handleImageEdit('position', {
                          ...selectedImage.position,
                          y: value as number,
                        })}
                        min={-100}
                        max={100}
                      />
                    </Grid>
                  </Grid>
                </Box>

                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedImage.cropped || false}
                      onChange={(e) => handleImageEdit('cropped', e.target.checked)}
                    />
                  }
                  label="Enable cropping"
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditDialogOpen(false)}>Close</Button>
              <Button onClick={rotateImage} startIcon={<RotateIcon />}>
                Rotate 90°
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default ImageUploader;