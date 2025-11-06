import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  Snackbar,
  Fab,
  useScrollTrigger,
  Zoom,
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  KeyboardArrowUp as ArrowUpIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { useWeb3 } from './hooks/useWeb3';
import { useDraftStorage } from './hooks/useDraftStorage';

// Import pages (will create these next)
import LandingPage from './pages/LandingPage';
import CreateMosaic from './pages/CreateMosaic';
import MosaicGallery from './pages/MosaicGallery';
import DraftManagement from './pages/DraftManagement';

// Import components
import LoadingSpinner from './components/LoadingSpinner';

// Create theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6366f1',
      light: '#818cf8',
      dark: '#4f46e5',
    },
    secondary: {
      main: '#ec4899',
      light: '#f472b6',
      dark: '#db2777',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '3.5rem',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 600,
      fontSize: '2.5rem',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 600,
      fontSize: '2rem',
      lineHeight: 1.4,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
      },
    },
  },
});

// Scroll to top component
function ScrollTop(props: { children: React.ReactElement }) {
  const { children } = props;
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 100,
  });

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const anchor = ((event.target as HTMLDivElement).ownerDocument || document).querySelector(
      '#back-to-top-anchor'
    );
    if (anchor) {
      anchor.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  };

  return (
    <Zoom in={trigger}>
      <Box
        onClick={handleClick}
        role="presentation"
        sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1 }}
      >
        {children}
      </Box>
    </Zoom>
  );
}

// Main App Content
const AppContent: React.FC = () => {
  const {
    account,
    isConnected,
    isConnecting,
    network,
    isTestnet,
    connectWallet,
    disconnectWallet,
    isWalletAvailable,
  } = useWeb3();

  const { drafts, clearError } = useDraftStorage();

  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    open: boolean;
  }>({
    type: 'info',
    message: '',
    open: false,
  });

  // Show notification
  const showNotification = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setNotification({ type, message, open: true });
  };

  // Handle wallet connection
  const handleConnectWallet = async () => {
    try {
      await connectWallet();
      showNotification('success', 'Wallet connected successfully!');
    } catch (error: any) {
      showNotification('error', error.message || 'Failed to connect wallet');
    }
  };

  // Handle wallet disconnection
  const handleDisconnectWallet = () => {
    disconnectWallet();
    showNotification('info', 'Wallet disconnected');
  };

  // Handle mobile menu
  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  // Copy share link
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mosaic NFT Creator',
          text: 'Create stunning mosaic NFTs from your photos',
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      showNotification('success', 'Link copied to clipboard!');
    }
  };

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <AppBar position="sticky" elevation={2} color="default" sx={{ backgroundColor: 'background.paper' }}>
        <Toolbar>
          {/* Mobile menu button */}
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="open drawer"
            sx={{ mr: 2, display: { xs: 'flex', md: 'none' } }}
            onClick={handleMobileMenuOpen}
          >
            <MenuIcon />
          </IconButton>

          {/* Logo */}
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 700,
              color: 'primary.main',
              cursor: 'pointer',
            }}
            onClick={() => window.location.href = '/'}
          >
            Mosaic NFT Creator
          </Typography>

          {/* Desktop navigation */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2, alignItems: 'center' }}>
            <Button color="inherit" href="/">
              Home
            </Button>
            <Button color="inherit" href="/create">
              Create
            </Button>
            <Button color="inherit" href="/gallery">
              Gallery
            </Button>
            <Button color="inherit" href="/drafts">
              Drafts ({drafts.length})
            </Button>
          </Box>

          {/* Wallet section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
            {isConnected && account ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={`${formatAddress(account)} • ${network.toUpperCase()}`}
                  variant="outlined"
                  size="small"
                  color={isTestnet ? 'warning' : 'primary'}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleDisconnectWallet}
                >
                  Disconnect
                </Button>
              </Box>
            ) : (
              <Button
                variant="contained"
                startIcon={<WalletIcon />}
                onClick={handleConnectWallet}
                disabled={isConnecting || !isWalletAvailable}
                sx={{ minWidth: 140 }}
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            )}
            <IconButton onClick={handleShare} color="inherit">
              <ShareIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile menu */}
      <Menu
        anchorEl={mobileMenuAnchor}
        open={Boolean(mobileMenuAnchor)}
        onClose={handleMobileMenuClose}
        sx={{ display: { xs: 'block', md: 'none' } }}
      >
        <MenuItem onClick={handleMobileMenuClose} href="/">
          Home
        </MenuItem>
        <MenuItem onClick={handleMobileMenuClose} href="/create">
          Create Mosaic
        </MenuItem>
        <MenuItem onClick={handleMobileMenuClose} href="/gallery">
          Gallery
        </MenuItem>
        <MenuItem onClick={handleMobileMenuClose} href="/drafts">
          Drafts ({drafts.length})
        </MenuItem>
      </Menu>

      {/* Main content */}
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Routes>
          <Route path="/" element={<LandingPage onShowNotification={showNotification} />} />
          <Route
            path="/create"
            element={
              <CreateMosaic
                onShowNotification={showNotification}
                requireConnection={true}
              />
            }
          />
          <Route
            path="/gallery"
            element={
              <MosaicGallery
                onShowNotification={showNotification}
                requireConnection={true}
              />
            }
          />
          <Route
            path="/drafts"
            element={
              <DraftManagement
                onShowNotification={showNotification}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>

      {/* Scroll to top button */}
      <ScrollTop>
        <Fab size="small" aria-label="scroll back to top" color="primary">
          <ArrowUpIcon />
        </Fab>
      </ScrollTop>

      {/* Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
          severity={notification.type}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>

      {/* Wallet not available warning */}
      {!isWalletAvailable && (
        <Alert
          severity="warning"
          sx={{
            position: 'fixed',
            bottom: 20,
            left: 20,
            right: 20,
            zIndex: 1000,
          }}
          action={
            <Button
              size="small"
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Install MetaMask
            </Button>
          }
        >
          No Web3 wallet detected. Install MetaMask to create and manage mosaic NFTs.
        </Alert>
      )}
    </Box>
  );
};

// Main App component
const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
};

export default App;