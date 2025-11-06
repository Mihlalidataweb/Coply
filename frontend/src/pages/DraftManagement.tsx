import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  PlayArrow as PlayIcon,
  Search as SearchIcon,
  FolderOpen as OpenIcon,
} from '@mui/icons-material';
import { useDraftStorage } from '@/hooks/useDraftStorage';

interface DraftManagementProps {
  onShowNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

const DraftManagement: React.FC<DraftManagementProps> = ({ onShowNotification }) => {
  const {
    drafts,
    isLoading,
    error,
    deleteDraft,
    duplicateDraft,
    exportDraft,
    importDraft,
    clearError,
  } = useDraftStorage();

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [draftToDelete, setDraftToDelete] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredDrafts = drafts.filter(draft =>
    draft.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteDraft = (draftId: string) => {
    setDraftToDelete(draftId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (draftToDelete) {
      try {
        deleteDraft(draftToDelete);
        onShowNotification('success', 'Draft deleted successfully');
      } catch (error: any) {
        onShowNotification('error', error.message || 'Failed to delete draft');
      }
    }
    setDeleteDialogOpen(false);
    setDraftToDelete(null);
  };

  const handleDuplicateDraft = (draftId: string) => {
    try {
      duplicateDraft(draftId);
      onShowNotification('success', 'Draft duplicated successfully');
    } catch (error: any) {
      onShowNotification('error', error.message || 'Failed to duplicate draft');
    }
  };

  const handleExportDraft = (draftId: string) => {
    try {
      exportDraft(draftId);
      onShowNotification('success', 'Draft exported successfully');
    } catch (error: any) {
      onShowNotification('error', error.message || 'Failed to export draft');
    }
  };

  const handleImportDraft = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importDraft(file)
        .then(() => {
          onShowNotification('success', 'Draft imported successfully');
        })
        .catch((error: any) => {
          onShowNotification('error', error.message || 'Failed to import draft');
        });
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading drafts...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          My Drafts ({drafts.length})
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            component="label"
            startIcon={<OpenIcon />}
          >
            Import Draft
            <input
              type="file"
              accept=".json"
              hidden
              onChange={handleImportDraft}
            />
          </Button>
          <Button
            variant="contained"
            href="/create"
            startIcon={<EditIcon />}
          >
            Create New
          </Button>
        </Box>
      </Box>

      {/* Search */}
      <TextField
        fullWidth
        placeholder="Search drafts..."
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      {filteredDrafts.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          {drafts.length === 0 ? (
            <>
              <Typography variant="h6" gutterBottom>
                No Drafts Yet
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Start creating a mosaic and save it as a draft to see it here.
              </Typography>
              <Button
                variant="contained"
                href="/create"
                startIcon={<EditIcon />}
              >
                Create Your First Mosaic
              </Button>
            </>
          ) : (
            <>
              <Typography variant="h6" gutterBottom>
                No Matching Drafts
              </Typography>
              <Typography variant="body1" color="text.secondary">
                No drafts found matching "{searchTerm}".
              </Typography>
            </>
          )}
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredDrafts.map((draft) => (
            <Grid item xs={12} sm={6} md={4} key={draft.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                {draft.thumbnail && (
                  <CardMedia
                    component="img"
                    height="150"
                    image={draft.thumbnail}
                    alt={draft.name}
                  />
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {draft.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {draft.images.length} images • {draft.pattern.name} pattern
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                    Last modified: {new Date(draft.lastModified).toLocaleDateString()}
                  </Typography>
                  <Chip
                    label={`${draft.images.length}/30 images`}
                    size="small"
                    color={draft.images.length === 30 ? 'success' : 'warning'}
                    sx={{ mb: 2 }}
                  />
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      size="small"
                      href={`/create?draft=${draft.id}`}
                      startIcon={<PlayIcon />}
                    >
                      {draft.images.length === 30 ? 'Continue' : 'Edit'}
                    </Button>
                    <IconButton
                      size="small"
                      onClick={() => handleDuplicateDraft(draft.id)}
                      title="Duplicate"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleExportDraft(draft.id)}
                      title="Export"
                    >
                      <OpenIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteDraft(draft.id)}
                      title="Delete"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Draft</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this draft? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DraftManagement;