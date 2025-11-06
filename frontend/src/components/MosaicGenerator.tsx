import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Download as DownloadIcon,
  Tune as TuneIcon,
} from '@mui/icons-material';
import { UploadedImage, MosaicPattern, MosaicGenerationOptions } from '@/types';

interface MosaicGeneratorProps {
  images: UploadedImage[];
  pattern: MosaicPattern;
  onPatternChange: (pattern: MosaicPattern) => void;
  onMosaicGenerated: (dataUrl: string) => void;
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

const DEFAULT_OPTIONS: MosaicGenerationOptions = {
  tileSize: 100,
  spacing: 2,
  opacity: 1,
  borderWidth: 1,
  borderColor: '#ffffff',
  blendMode: 'normal' as GlobalCompositeOperation,
};

const MosaicGenerator: React.FC<MosaicGeneratorProps> = ({
  images,
  pattern,
  onPatternChange,
  onMosaicGenerated,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [options, setOptions] = useState<MosaicGenerationOptions>(DEFAULT_OPTIONS);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');

  // Color analysis for AI artistic pattern
  const analyzeImageColor = useCallback((img: HTMLImageElement): Promise<{ r: number; g: number; b: number; brightness: number }> => {
    return new Promise((resolve) => {
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d')!;
      tempCanvas.width = 50;
      tempCanvas.height = 50;
      tempCtx.drawImage(img, 0, 0, 50, 50);

      const imageData = tempCtx.getImageData(0, 0, 50, 50);
      let r = 0, g = 0, b = 0;
      const pixelCount = imageData.data.length / 4;

      for (let i = 0; i < imageData.data.length; i += 4) {
        r += imageData.data[i];
        g += imageData.data[i + 1];
        b += imageData.data[i + 2];
      }

      r = Math.floor(r / pixelCount);
      g = Math.floor(g / pixelCount);
      b = Math.floor(b / pixelCount);
      const brightness = (r + g + b) / 3;

      resolve({ r, g, b, brightness });
    });
  }, []);

  // Generate grid pattern
  const generateGridPattern = useCallback((ctx: CanvasRenderingContext2D, images: HTMLImageElement[]) => {
    const cols = Math.ceil(Math.sqrt(images.length));
    const rows = Math.ceil(images.length / cols);
    const tileSize = options.tileSize;
    const spacing = options.spacing;

    for (let i = 0; i < images.length; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = col * (tileSize + spacing) + spacing;
      const y = row * (tileSize + spacing) + spacing;

      // Draw border if specified
      if (options.borderWidth > 0) {
        ctx.fillStyle = options.borderColor;
        ctx.fillRect(x - options.borderWidth, y - options.borderWidth,
                    tileSize + options.borderWidth * 2, tileSize + options.borderWidth * 2);
      }

      ctx.globalAlpha = options.opacity;
      ctx.drawImage(images[i], x, y, tileSize, tileSize);
    }

    return {
      width: cols * (tileSize + spacing) + spacing,
      height: rows * (tileSize + spacing) + spacing,
    };
  }, [options]);

  // Generate circular pattern
  const generateCircularPattern = useCallback((ctx: CanvasRenderingContext2D, images: HTMLImageElement[]) => {
    const centerX = 400;
    const centerY = 300;
    const radius = Math.min(centerX, centerY) - options.tileSize;
    const tileSize = options.tileSize;

    images.forEach((image, index) => {
      const angle = (index / images.length) * 2 * Math.PI;
      const x = centerX + Math.cos(angle) * radius - tileSize / 2;
      const y = centerY + Math.sin(angle) * radius - tileSize / 2;

      if (options.borderWidth > 0) {
        ctx.fillStyle = options.borderColor;
        ctx.fillRect(x - options.borderWidth, y - options.borderWidth,
                    tileSize + options.borderWidth * 2, tileSize + options.borderWidth * 2);
      }

      ctx.globalAlpha = options.opacity;
      ctx.drawImage(image, x, y, tileSize, tileSize);
    });

    return { width: 800, height: 600 };
  }, [options]);

  // Generate random artistic pattern
  const generateRandomPattern = useCallback((ctx: CanvasRenderingContext2D, images: HTMLImageElement[]) => {
    const positions: Array<{ x: number; y: number; rotation: number; scale: number }> = [];
    const tileSize = options.tileSize;
    const padding = tileSize;

    // Generate random positions without overlap
    images.forEach(() => {
      let attempts = 0;
      let validPosition = false;
      let x = 0, y = 0;

      while (!validPosition && attempts < 100) {
        x = padding + Math.random() * (800 - padding * 2 - tileSize);
        y = padding + Math.random() * (600 - padding * 2 - tileSize);

        validPosition = positions.every(pos => {
          const distance = Math.sqrt(Math.pow(pos.x - x, 2) + Math.pow(pos.y - y, 2));
          return distance > tileSize * 0.8;
        });

        attempts++;
      }

      positions.push({
        x,
        y,
        rotation: Math.random() * 360,
        scale: 0.8 + Math.random() * 0.4,
      });
    });

    // Draw images at random positions
    positions.forEach((pos, index) => {
      if (index < images.length) {
        ctx.save();
        ctx.translate(pos.x + tileSize / 2, pos.y + tileSize / 2);
        ctx.rotate((pos.rotation * Math.PI) / 180);
        ctx.scale(pos.scale, pos.scale);
        ctx.globalAlpha = options.opacity;

        if (options.borderWidth > 0) {
          ctx.fillStyle = options.borderColor;
          ctx.fillRect(-tileSize / 2 - options.borderWidth, -tileSize / 2 - options.borderWidth,
                      tileSize + options.borderWidth * 2, tileSize + options.borderWidth * 2);
        }

        ctx.drawImage(images[index], -tileSize / 2, -tileSize / 2, tileSize, tileSize);
        ctx.restore();
      }
    });

    return { width: 800, height: 600 };
  }, [options]);

  // Generate AI artistic pattern based on color analysis
  const generateArtisticPattern = useCallback(async (ctx: CanvasRenderingContext2D, images: HTMLImageElement[]) => {
    // Analyze colors for all images
    const imageColors = await Promise.all(
      images.map(img => analyzeImageColor(img))
    );

    // Sort images by brightness for gradient effect
    const sortedIndices = imageColors
      .map((color, index) => ({ color, index }))
      .sort((a, b) => a.color.brightness - b.color.brightness)
      .map(item => item.index);

    const cols = 6; // 6x5 grid for 30 images
    const rows = 5;
    const tileSize = options.tileSize;
    const spacing = options.spacing;
    const offsetX = (800 - (cols * (tileSize + spacing))) / 2;
    const offsetY = (600 - (rows * (tileSize + spacing))) / 2;

    // Create gradient-like arrangement
    sortedIndices.forEach((imageIndex, positionIndex) => {
      const row = Math.floor(positionIndex / cols);
      const col = positionIndex % cols;

      // Add some organic variation to positions
      const variationX = (Math.random() - 0.5) * spacing;
      const variationY = (Math.random() - 0.5) * spacing;

      const x = offsetX + col * (tileSize + spacing) + variationX;
      const y = offsetY + row * (tileSize + spacing) + variationY;

      // Vary scale based on brightness
      const brightness = imageColors[imageIndex].brightness;
      const scale = 0.8 + (brightness / 255) * 0.4;
      const adjustedSize = tileSize * scale;

      // Draw shadow for depth
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      if (options.borderWidth > 0) {
        ctx.fillStyle = options.borderColor;
        ctx.fillRect(x - options.borderWidth, y - options.borderWidth,
                    adjustedSize + options.borderWidth * 2, adjustedSize + options.borderWidth * 2);
      }

      ctx.globalAlpha = options.opacity;
      ctx.drawImage(images[imageIndex], x, y, adjustedSize, adjustedSize);

      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    });

    return { width: 800, height: 600 };
  }, [options, analyzeImageColor]);

  // Main mosaic generation function
  const generateMosaic = useCallback(async () => {
    if (images.length !== 30) {
      alert('Please upload exactly 30 images to generate a mosaic.');
      return;
    }

    setIsGenerating(true);
    const canvas = canvasRef.current;
    if (!canvas) {
      setIsGenerating(false);
      return;
    }

    const ctx = canvas.getContext('2d')!;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set background
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    try {
      // Load all images
      const loadedImages: HTMLImageElement[] = await Promise.all(
        images.map((imageData) => {
          return new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = imageData.preview;
          });
        })
      );

      let dimensions: { width: number; height: number };

      // Apply selected pattern
      switch (pattern.id) {
        case 'grid':
          dimensions = generateGridPattern(ctx, loadedImages);
          break;
        case 'circular':
          dimensions = generateCircularPattern(ctx, loadedImages);
          break;
        case 'random':
          dimensions = generateRandomPattern(ctx, loadedImages);
          break;
        case 'artistic':
          dimensions = await generateArtisticPattern(ctx, loadedImages);
          break;
        default:
          dimensions = generateGridPattern(ctx, loadedImages);
      }

      // Update canvas size if needed
      if (dimensions.width !== canvas.width || dimensions.height !== canvas.height) {
        setCanvasSize(dimensions);
      }

      const dataUrl = canvas.toDataURL('image/png');
      setPreviewDataUrl(dataUrl);
      onMosaicGenerated(dataUrl);

    } catch (error) {
      console.error('Error generating mosaic:', error);
      alert('Error generating mosaic. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [images, pattern, onMosaicGenerated, generateGridPattern, generateCircularPattern, generateRandomPattern, generateArtisticPattern]);

  // Auto-generate when dependencies change
  useEffect(() => {
    if (images.length === 30) {
      generateMosaic();
    }
  }, [images.length, pattern, options.tileSize, options.spacing, options.opacity]);

  const downloadMosaic = () => {
    if (previewDataUrl) {
      const link = document.createElement('a');
      link.download = `mosaic-${Date.now()}.png`;
      link.href = previewDataUrl;
      link.click();
    }
  };

  const handleOptionChange = (key: keyof MosaicGenerationOptions, value: any) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Generate Your Mosaic
      </Typography>

      {images.length < 30 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You need {30 - images.length} more images to generate a mosaic.
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Pattern Selection
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Pattern</InputLabel>
              <Select
                value={pattern.id}
                label="Pattern"
                onChange={(e) => {
                  const selectedPattern = MOSAIC_PATTERNS.find(p => p.id === e.target.value);
                  if (selectedPattern) onPatternChange(selectedPattern);
                }}
              >
                {MOSAIC_PATTERNS.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    <Box>
                      <Typography variant="subtitle2">{p.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {p.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                Generation Options
              </Typography>
              <IconButton onClick={() => setShowAdvanced(!showAdvanced)}>
                <TuneIcon />
              </IconButton>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography gutterBottom>
                Tile Size: {options.tileSize}px
              </Typography>
              <Slider
                value={options.tileSize}
                onChange={(_, value) => handleOptionChange('tileSize', value)}
                min={50}
                max={200}
                step={10}
                marks={[
                  { value: 50, label: '50px' },
                  { value: 100, label: '100px' },
                  { value: 150, label: '150px' },
                  { value: 200, label: '200px' },
                ]}
              />
            </Box>

            {showAdvanced && (
              <>
                <Box sx={{ mb: 2 }}>
                  <Typography gutterBottom>
                    Spacing: {options.spacing}px
                  </Typography>
                  <Slider
                    value={options.spacing}
                    onChange={(_, value) => handleOptionChange('spacing', value)}
                    min={0}
                    max={20}
                    step={1}
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography gutterBottom>
                    Opacity: {Math.round(options.opacity * 100)}%
                  </Typography>
                  <Slider
                    value={options.opacity}
                    onChange={(_, value) => handleOptionChange('opacity', value)}
                    min={0.3}
                    max={1}
                    step={0.1}
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography gutterBottom>
                    Border Width: {options.borderWidth}px
                  </Typography>
                  <Slider
                    value={options.borderWidth}
                    onChange={(_, value) => handleOptionChange('borderWidth', value)}
                    min={0}
                    max={5}
                    step={1}
                  />
                </Box>
              </>
            )}

            <Button
              variant="contained"
              fullWidth
              onClick={generateMosaic}
              disabled={images.length !== 30 || isGenerating}
              startIcon={isGenerating ? <CircularProgress size={16} /> : <RefreshIcon />}
              sx={{ mb: 2 }}
            >
              {isGenerating ? 'Generating...' : 'Generate Mosaic'}
            </Button>

            {previewDataUrl && (
              <Button
                variant="outlined"
                fullWidth
                onClick={downloadMosaic}
                startIcon={<DownloadIcon />}
              >
                Download Mosaic
              </Button>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Preview
              </Typography>
              <Box>
                <Tooltip title="Zoom Out">
                  <IconButton onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}>
                    <ZoomOutIcon />
                  </IconButton>
                </Tooltip>
                <Typography variant="caption" sx={{ mx: 1 }}>
                  {Math.round(zoom * 100)}%
                </Typography>
                <Tooltip title="Zoom In">
                  <IconButton onClick={() => setZoom(Math.min(2, zoom + 0.1))}>
                    <ZoomInIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            <Box
              sx={{
                overflow: 'auto',
                maxHeight: '70vh',
                border: '1px solid #ddd',
                borderRadius: 1,
                backgroundColor: '#fafafa',
              }}
            >
              {previewDataUrl ? (
                <img
                  src={previewDataUrl}
                  alt="Generated mosaic"
                  style={{
                    width: `${canvasSize.width * zoom}px`,
                    height: `${canvasSize.height * zoom}px`,
                    display: 'block',
                    margin: '0 auto',
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: '800px',
                    height: '600px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'text.secondary',
                  }}
                >
                  {images.length === 30 ? (
                    <Typography>Click "Generate Mosaic" to create your artwork</Typography>
                  ) : (
                    <Typography>Add {30 - images.length} more images to start</Typography>
                  )}
                </Box>
              )}
            </Box>

            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              style={{ display: 'none' }}
            />

            {pattern && (
              <Box sx={{ mt: 2 }}>
                <Chip
                  label={`Pattern: ${pattern.name}`}
                  variant="outlined"
                  color="primary"
                  size="small"
                />
                {images.length === 30 && (
                  <Chip
                    label="Ready to generate"
                    variant="outlined"
                    color="success"
                    size="small"
                    sx={{ ml: 1 }}
                  />
                )}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MosaicGenerator;