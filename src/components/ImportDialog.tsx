import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  onNext?: (file: File) => void;
}

const isCsvFile = (file: File | null | undefined): file is File =>
  Boolean(file?.name.toLowerCase().endsWith('.csv'));

export default function ImportDialog({ open, onClose, onNext }: ImportDialogProps) {
  const hiddenInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const resetSelection = () => {
    setSelectedFile(null);
    setIsDragging(false);

    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetSelection();
    onClose();
  };

  const handleSelectedFile = (fileList: FileList | null | undefined) => {
    const file = fileList?.[0] ?? null;

    if (!isCsvFile(file)) {
      setSelectedFile(null);
      if (hiddenInputRef.current) {
        hiddenInputRef.current.value = '';
      }
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleSelectedFile(event.dataTransfer.files);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleSelectedFile(event.target.files);
  };

  const handleNext = () => {
    if (!selectedFile) return;
    onNext?.(selectedFile);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Import users</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ py: 1 }}>
          <Box
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => {
              hiddenInputRef.current?.click();
            }}
            sx={{
              minHeight: 220,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dashed',
              borderColor: isDragging ? 'primary.main' : 'divider',
              borderRadius: 2,
              backgroundColor: isDragging ? 'action.hover' : 'background.paper',
              cursor: 'pointer',
              transition: 'border-color 0.2s ease, background-color 0.2s ease',
            }}
          >
            <Stack alignItems="center" spacing={1}>
              <UploadFileOutlinedIcon color="primary" sx={{ fontSize: 40 }} />
              <Typography variant="h6" sx={{ textAlign: 'center' }}>
                {selectedFile ? selectedFile.name : 'Drop a CSV file here'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                or click to browse
              </Typography>
            </Stack>
          </Box>

          <input
            ref={hiddenInputRef}
            aria-label="Select CSV file"
            type="file"
            accept=".csv"
            multiple={false}
            onChange={handleInputChange}
            style={{ display: 'none' }}
          />

          <Typography variant="body2" color="text.secondary">
            Selected file: {selectedFile ? selectedFile.name : 'No file selected'}
          </Typography>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="contained" disabled={!selectedFile} onClick={handleNext}>
          Next
        </Button>
      </DialogActions>
    </Dialog>
  );
}
