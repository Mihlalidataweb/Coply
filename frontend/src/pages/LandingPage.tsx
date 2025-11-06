import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Paper,
  Avatar,
  Chip,
  Stepper,
  Step,
  StepLabel,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Create as CreateIcon,
  Image as ImageIcon,
  AccountBalanceWallet as WalletIcon,
  Brush as BrushIcon,
  CloudUpload as UploadIcon,
  Star as StarIcon,
  TrendingUp as TrendingIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';

interface LandingPageProps {
  onShowNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onShowNotification }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const features = [
    {
      icon: <ImageIcon />,
      title: 'Upload 30 Images',
      description: 'Select and arrange your favorite photos to create a unique mosaic composition.',
    },
    {
      icon: <BrushIcon />,
      title: 'AI-Powered Generation',
      description: 'Our intelligent algorithm creates stunning mosaic patterns based on color analysis.',
    },
    {
      icon: <WalletIcon />,
      title: 'Mint as NFT',
      description: 'Transform your mosaic into a unique NFT that can be traded and collected.',
    },
    {
      icon: <UploadIcon />,
      title: 'IPFS Storage',
      description: 'Your original images and mosaic are securely stored on the decentralized IPFS network.',
    },
    {
      icon: <StarIcon />,
      title: 'Royalty System',
      description: 'Earn ongoing royalties from secondary sales of your mosaic creations.',
    },
    {
      icon: <SecurityIcon />,
      title: 'Blockchain Security',
      description: 'Your NFTs are protected by the security and immutability of blockchain technology.',
    },
  ];

  const steps = [
    'Upload Your Images',
    'Choose Pattern',
    'Generate Mosaic',
    'Add Metadata',
    'Mint NFT',
  ];

  const featuredMosaics = [
    {
      id: 1,
      title: 'Sunset Memories',
      creator: 'Artist123',
      image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23fbbf24" width="300" height="300"/%3E%3Crect fill="%23f59e0b" x="50" y="50" width="60" height="60"/%3E%3Crect fill="%23d97706" x="130" y="80" width="60" height="60"/%3E%3Crect fill="%23b45309" x="210" y="50" width="60" height="60"/%3E%3Crect fill="%2392400e" x="80" y="160" width="60" height="60"/%3E%3Crect fill="%23783f09" x="170" y="180" width="60" height="60"/%3E%3C/svg%3E',
      price: '0.5 ETH',
      likes: 42,
    },
    {
      id: 2,
      title: 'Urban Dreams',
      creator: 'CryptoArt',
      image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%236b7280" width="300" height="300"/%3E%3Crect fill="%234b5563" x="30" y="30" width="80" height="80"/%3E%3Crect fill="%23374151" x="140" y="60" width="80" height="80"/%3E%3Crect fill="%231f2937" x="200" y="20" width="80" height="80"/%3E%3Crect fill="%23111827" x="60" y="140" width="80" height="80"/%3E%3Crect fill="%23030712" x="180" y="160" width="80" height="80"/%3E%3C/svg%3E',
      price: '0.8 ETH',
      likes: 67,
    },
    {
      id: 3,
      title: 'Nature\'s Pattern',
      creator: 'GreenThumb',
      image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%2310b981" width="300" height="300"/%3E%3Crect fill="%23059669" x="40" y="40" width="70" height="70"/%3E%3Crect fill="%23047856" x="130" y="90" width="70" height="70"/%3E%3Crect fill="%23065f46" x="220" y="40" width="70" height="70"/%3E%3Crect fill="%23064631" x="90" y="170" width="70" height="70"/%3E%3Crect fill="%23022c22" x="190" y="190" width="70" height="70"/%3E%3C/svg%3E',
      price: '0.3 ETH',
      likes: 28,
    },
  ];

  const stats = [
    { label: 'Mosaics Created', value: '2,847' },
    { label: 'Active Artists', value: '1,239' },
    { label: 'Total Volume', value: '847 ETH' },
    { label: 'Average Price', value: '0.4 ETH' },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant="h1"
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '2.5rem', md: '4rem' },
                  lineHeight: 1.2,
                }}
              >
                Transform Your Photos into
                <Box component="span" sx={{ color: '#fbbf24' }}> NFT Mosaics</Box>
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  mb: 4,
                  opacity: 0.9,
                  fontSize: { xs: '1.2rem', md: '1.5rem' },
                }}
              >
                Upload 30 images, let AI create stunning mosaic art, and mint it as a unique NFT on the blockchain.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  href="/create"
                  startIcon={<CreateIcon />}
                  sx={{
                    backgroundColor: '#fbbf24',
                    color: '#1f2937',
                    fontWeight: 600,
                    px: 4,
                    py: 1.5,
                    '&:hover': {
                      backgroundColor: '#f59e0b',
                    },
                  }}
                >
                  Create Your Mosaic
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  href="/gallery"
                  startIcon={<PlayIcon />}
                  sx={{
                    borderColor: 'white',
                    color: 'white',
                    fontWeight: 600,
                    px: 4,
                    py: 1.5,
                    '&:hover': {
                      borderColor: '#fbbf24',
                      color: '#fbbf24',
                    },
                  }}
                >
                  Explore Gallery
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                component="img"
                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='400'%3E%3Cdefs%3E%3Cpattern id='grid' width='50' height='50' patternUnits='userSpaceOnUse'%3E%3Crect width='50' height='50' fill='none' stroke='rgba(255,255,255,0.2)' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='500' height='400' fill='url(%23grid)'/%3E%3Crect fill='%23fbbf24' x='100' y='100' width='80' height='80' opacity='0.8'/%3E%3Crect fill='%23f59e0b' x='200' y='150' width='80' height='80' opacity='0.8'/%3E%3Crect fill='%23d97706' x='300' y='100' width='80' height='80' opacity='0.8'/%3E%3Crect fill='%23b45309' x='150' y='250' width='80' height='80' opacity='0.8'/%3E%3Crect fill='%2392400e' x='250' y='280' width='80' height='80' opacity='0.8'/%3E%3C/svg%3E"
                alt="Mosaic example"
                sx={{
                  width: '100%',
                  maxWidth: 500,
                  height: 'auto',
                  borderRadius: 2,
                  boxShadow: 4,
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Stats Section */}
      <Box sx={{ py: 6, backgroundColor: '#f8fafc' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {stats.map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" component="div" fontWeight={700} color="primary.main">
                    {stat.value}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {stat.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* How It Works */}
      <Box sx={{ py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h2" component="h2" gutterBottom fontWeight={600}>
              How It Works
            </Typography>
            <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
              Create your mosaic NFT in 5 simple steps
            </Typography>
          </Box>

          <Stepper
            alternativeLabel={!isMobile}
            orientation={isMobile ? 'vertical' : 'horizontal'}
            sx={{ mb: 8 }}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
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
                  <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 3 }}>
                    <Avatar
                      sx={{
                        bgcolor: 'primary.main',
                        width: 64,
                        height: 64,
                        mx: 'auto',
                        mb: 2,
                      }}
                    >
                      {feature.icon}
                    </Avatar>
                    <Typography variant="h6" component="h3" gutterBottom fontWeight={600}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Featured Mosaics */}
      <Box sx={{ py: { xs: 8, md: 12 }, backgroundColor: '#f8fafc' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h2" component="h2" gutterBottom fontWeight={600}>
              Featured Mosaics
            </Typography>
            <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
              Discover amazing creations from our community
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {featuredMosaics.map((mosaic) => (
              <Grid item xs={12} sm={6} md={4} key={mosaic.id}>
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
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ width: 24, height: 24, mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        {mosaic.creator}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6" color="primary.main" fontWeight={600}>
                        {mosaic.price}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <StarIcon sx={{ fontSize: 16, color: '#fbbf24', mr: 0.5 }} />
                        <Typography variant="body2" color="text.secondary">
                          {mosaic.likes}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Button
              variant="contained"
              size="large"
              href="/gallery"
              sx={{ px: 4 }}
            >
              View All Mosaics
            </Button>
          </Box>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          py: { xs: 8, md: 12 },
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h2" component="h2" gutterBottom fontWeight={600}>
            Ready to Create Your First Mosaic?
          </Typography>
          <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
            Join thousands of artists creating unique mosaic NFTs
          </Typography>
          <Button
            variant="contained"
            size="large"
            href="/create"
            startIcon={<CreateIcon />}
            sx={{
              backgroundColor: '#fbbf24',
              color: '#1f2937',
              fontWeight: 600,
              px: 6,
              py: 2,
              fontSize: '1.1rem',
              '&:hover': {
                backgroundColor: '#f59e0b',
              },
            }}
          >
            Start Creating
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;