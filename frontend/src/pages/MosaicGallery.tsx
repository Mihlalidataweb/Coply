import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Button,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
} from '@mui/icons-material';

interface MosaicGalleryProps {
  onShowNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  requireConnection?: boolean;
}

const MosaicGallery: React.FC<MosaicGalleryProps> = ({ onShowNotification, requireConnection }) => {
  // Placeholder gallery data
  const featuredMosaics = [
    {
      id: 1,
      title: 'Sunset Memories',
      creator: 'Artist123',
      image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23fbbf24" width="300" height="300"/%3E%3Crect fill="%23f59e0b" x="50" y="50" width="60" height="60"/%3E%3Crect fill="%23d97706" x="130" y="80" width="60" height="60"/%3E%3Crect fill="%23b45309" x="210" y="50" width="60" height="60"/%3E%3Crect fill="%2392400e" x="80" y="160" width="60" height="60"/%3E%3Crect fill="%23783f09" x="170" y="180" width="60" height="60"/%3E%3C/svg%3E',
      price: '0.5 ETH',
      likes: 42,
      pattern: 'Artistic',
    },
    {
      id: 2,
      title: 'Urban Dreams',
      creator: 'CryptoArt',
      image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%236b7280" width="300" height="300"/%3E%3Crect fill="%234b5563" x="30" y="30" width="80" height="80"/%3E%3Crect fill="%23374151" x="140" y="60" width="80" height="80"/%3E%3Crect fill="%231f2937" x="200" y="20" width="80" height="80"/%3E%3Crect fill="%23111827" x="60" y="140" width="80" height="80"/%3E%3Crect fill="%23030712" x="180" y="160" width="80" height="80"/%3E%3C/svg%3E',
      price: '0.8 ETH',
      likes: 67,
      pattern: 'Grid',
    },
    {
      id: 3,
      title: 'Nature\'s Pattern',
      creator: 'GreenThumb',
      image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%2310b981" width="300" height="300"/%3E%3Crect fill="%23059669" x="40" y="40" width="70" height="70"/%3E%3Crect fill="%23047856" x="130" y="90" width="70" height="70"/%3E%3Crect fill="%23065f46" x="220" y="40" width="70" height="70"/%3E%3Crect fill="%23064631" x="90" y="170" width="70" height="70"/%3E%3Crect fill="%23022c22" x="190" y="190" width="70" height="70"/%3E%3C/svg%3E',
      price: '0.3 ETH',
      likes: 28,
      pattern: 'Circular',
    },
  ];

  if (requireConnection) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Please connect your wallet to view the gallery
        </Alert>
        <Typography variant="h6" gutterBottom>
          Wallet Connection Required
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Connect your Web3 wallet to browse and collect mosaic NFTs.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Mosaic Gallery
      </Typography>

      {/* Search and Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search mosaics..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 300, flexGrow: 1 }}
        />
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Pattern</InputLabel>
          <Select label="Pattern" defaultValue="">
            <MenuItem value="">All Patterns</MenuItem>
            <MenuItem value="artistic">Artistic</MenuItem>
            <MenuItem value="grid">Grid</MenuItem>
            <MenuItem value="circular">Circular</MenuItem>
            <MenuItem value="random">Random</MenuItem>
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Sort By</InputLabel>
          <Select label="Sort By" defaultValue="recent">
            <MenuItem value="recent">Recent</MenuItem>
            <MenuItem value="popular">Popular</MenuItem>
            <MenuItem value="price-low">Price: Low to High</MenuItem>
            <MenuItem value="price-high">Price: High to Low</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Gallery Grid */}
      <Grid container spacing={3}>
        {featuredMosaics.map((mosaic) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={mosaic.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                },
              }}
            >
              <CardMedia
                component="img"
                height="200"
                image={mosaic.image}
                alt={mosaic.title}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="h3" gutterBottom>
                  {mosaic.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  by {mosaic.creator}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" color="primary.main" fontWeight={600}>
                    {mosaic.price}
                  </Typography>
                  <Chip label={mosaic.pattern} size="small" variant="outlined" />
                </Box>
                <Button variant="contained" fullWidth>
                  View Details
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Load More */}
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Button variant="outlined" size="large">
          Load More Mosaics
        </Button>
      </Box>
    </Box>
  );
};

export default MosaicGallery;