import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Backdrop,
  Fade,
} from '@mui/material';

interface LoadingSpinnerProps {
  open?: boolean;
  message?: string;
  size?: number;
  variant?: 'inline' | 'overlay' | 'backdrop';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  open = true,
  message,
  size = 40,
  variant = 'inline',
}) => {
  if (variant === 'inline') {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 3,
          gap: 2,
        }}
      >
        <CircularProgress size={size} />
        {message && (
          <Typography variant="body2" color="text.secondary" align="center">
            {message}
          </Typography>
        )}
      </Box>
    );
  }

  if (variant === 'overlay') {
    return (
      <Fade in={open}>
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            zIndex: 10,
            gap: 2,
          }}
        >
          <CircularProgress size={size} />
          {message && (
            <Typography variant="body2" color="text.secondary" align="center">
              {message}
            </Typography>
          )}
        </Box>
      </Fade>
    );
  }

  return (
    <Backdrop
      open={open}
      sx={{
        color: '#fff',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <CircularProgress color="inherit" size={size} />
        {message && (
          <Typography variant="body1" align="center">
            {message}
          </Typography>
        )}
      </Box>
    </Backdrop>
  );
};

export default LoadingSpinner;