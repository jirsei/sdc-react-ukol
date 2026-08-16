import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import { useUserStore } from '../stores/userStore';
import type { User } from '../types/User';
import { normalizeUser, validateUser } from '../utils/userValidation';

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImportMerge: (users: User[]) => void;
  onClearImport: (users: User[]) => void;
}

type ImportStep = 'select' | 'review';

interface ImportedRow {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  valid: boolean;
  conflicting: boolean;
  errors: string[];
  user?: User;
}

const isCsvFile = (file: File | null | undefined): file is File =>
  Boolean(file?.name.toLowerCase().endsWith('.csv'));

const normalizeHeader = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const parseCsvRows = (value: string): string[][] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    const nextChar = value[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ';' && !inQuotes) {
      currentRow.push(currentCell);
      currentCell = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        index += 1;
      }
      currentRow.push(currentCell);
      if (currentRow.some((cell) => cell.trim().length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
      continue;
    }

    currentCell += char;
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    if (currentRow.some((cell) => cell.trim().length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
};

const readImportedRows = (
  csvText: string,
  existingUsers: User[],
): { rows: ImportedRow[]; parseError?: string } => {
  const rows = parseCsvRows(csvText);

  if (rows.length === 0) {
    return { rows: [], parseError: 'CSV file is empty or unreadable.' };
  }

  const normalizedHeader = rows[0].map((header) => normalizeHeader(header));
  const requiredColumns = ['uid', 'firstname', 'lastname', 'email', 'phonenumber'];

  if (!requiredColumns.every((column) => normalizedHeader.includes(column))) {
    return {
      rows: [],
      parseError: 'CSV file must include uid, firstName, lastName, email and phoneNumber columns.',
    };
  }

  const seenUids = new Set<string>();

  const importedRows: ImportedRow[] = rows.slice(1).flatMap((row, rowIndex) => {
    const trimmedRow = row.map((cell) => cell.trim());

    if (trimmedRow.every((cell) => cell.length === 0)) {
      return [];
    }

    const values = Object.fromEntries(
      normalizedHeader.map((columnName, columnIndex) => [
        columnName,
        trimmedRow[columnIndex] ?? '',
      ]),
    );

    const uid = (values.uid || `u-import-${String(rowIndex + 1)}`).trim();
    const firstName = values.firstname || '';
    const lastName = values.lastname || '';
    const email = values.email || '';
    const phoneNumber = values.phonenumber || '';
    const username =
      values.username ||
      `${firstName.toLowerCase()}.${lastName.toLowerCase()}`.replace(/\s+/g, '') ||
      uid;
    const accessAllowedValue = values.accessallowed || '';
    const accessAllowed = ['true', '1', 'yes', 'y'].includes(accessAllowedValue.toLowerCase());
    const hiredSince = values.hiredsince || '';
    const location = values.location || '';

    const user: User = {
      uid,
      firstName,
      lastName,
      username,
      email,
      phoneNumber,
      accessAllowed,
      hiredSince,
      location,
    };

    const normalizedUser = normalizeUser(user);
    const fieldErrors = validateUser(normalizedUser, [], uid);
    const errors: string[] = Object.values(fieldErrors);

    if (seenUids.has(uid)) {
      errors.push('Duplicate UID in the CSV file.');
    }

    const hasConflict =
      existingUsers.some((existingUser) => existingUser.uid === normalizedUser.uid) ||
      existingUsers.some(
        (existingUser) =>
          existingUser.email.trim().toLowerCase() === normalizedUser.email.trim().toLowerCase(),
      );

    seenUids.add(uid);

    return [
      {
        uid: normalizedUser.uid,
        firstName: normalizedUser.firstName,
        lastName: normalizedUser.lastName,
        email: normalizedUser.email,
        phoneNumber: normalizedUser.phoneNumber,
        valid: errors.length === 0,
        conflicting: hasConflict,
        errors,
        user: normalizedUser,
      },
    ];
  });

  if (importedRows.length === 0) {
    return { rows: [], parseError: 'CSV file has no readable user rows.' };
  }

  return { rows: importedRows };
};

export default function ImportDialog({
  open,
  onClose,
  onImportMerge,
  onClearImport,
}: ImportDialogProps) {
  const hiddenInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [step, setStep] = useState<ImportStep>('select');
  const [reviewRows, setReviewRows] = useState<ImportedRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  const resetSelection = () => {
    setSelectedFile(null);
    setIsDragging(false);
    setReviewRows([]);
    setParseError(null);
    setStep('select');

    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = '';
    }
  };

  const closeDialog = () => {
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

  const handleNext = async () => {
    if (!selectedFile) return;

    try {
      const csvText = await selectedFile.text();
      const result = readImportedRows(csvText, useUserStore.getState().users);
      setReviewRows(result.rows);
      setParseError(result.parseError ?? null);
      setStep('review');
    } catch {
      setReviewRows([]);
      setParseError('CSV file could not be read. Please select a valid CSV file.');
      setStep('review');
    }
  };

  const validRows = reviewRows
    .filter((row) => row.valid)
    .flatMap((row) => (row.user ? [row.user] : []));
  const invalidRows = reviewRows.filter((row) => !row.valid);

  const handleBack = () => {
    resetSelection();
  };

  const handleImportMerge = () => {
    if (validRows.length === 0) return;
    onImportMerge(validRows);
  };

  const handleClearImport = () => {
    if (validRows.length === 0) return;
    onClearImport(validRows);
  };

  return (
    <Dialog open={open} onClose={closeDialog} maxWidth="md" fullWidth>
      <DialogTitle>{step === 'select' ? 'Import users' : 'Review import'}</DialogTitle>
      <DialogContent>
        {step === 'select' ? (
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
        ) : (
          <Stack spacing={2} sx={{ py: 1 }}>
            <Box display="flex" gap={2} flexWrap="wrap">
              <Typography color="success.main" fontWeight={600}>
                {validRows.length} valid users
              </Typography>
              <Typography color="error.main" fontWeight={600}>
                {invalidRows.length} invalid
              </Typography>
            </Box>

            {parseError ? (
              <Typography color="error.main">{parseError}</Typography>
            ) : (
              <Typography color="error.main">Invalid rows will not be imported.</Typography>
            )}

            <Box
              sx={{
                maxHeight: 360,
                overflowY: 'auto',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Table size="small" sx={{ minWidth: 620 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>UID</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>First name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Last name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reviewRows.map((row, index) => {
                    const tooltipText = row.errors.length
                      ? row.errors.join('\n')
                      : row.conflicting
                        ? 'This row matches an existing UID or email and will require a duplicate decision during import.'
                        : 'Ready to import.';

                    const rowContent = (
                      <TableRow
                        key={`${row.uid}-${String(index)}`}
                        sx={{
                          backgroundColor: row.conflicting
                            ? 'warning.light'
                            : row.valid
                              ? 'background.paper'
                              : 'error.light',
                          opacity: row.valid || row.conflicting ? 1 : 0.95,
                          '& td': {
                            color: row.conflicting
                              ? 'background.paper'
                              : row.valid
                                ? 'text.primary'
                                : 'background.paper',
                            borderColor: row.conflicting
                              ? 'warning.main'
                              : row.valid
                                ? 'divider'
                                : 'error.light',
                          },
                          '&:last-child td': { borderBottom: 0 },
                        }}
                      >
                        <TableCell>{row.uid}</TableCell>
                        <TableCell>{row.firstName}</TableCell>
                        <TableCell>{row.lastName}</TableCell>
                        <TableCell>{row.email}</TableCell>
                        <TableCell>{row.phoneNumber}</TableCell>
                        <TableCell>
                          {row.conflicting ? (
                            <Chip
                              label="Conflicts"
                              size="small"
                              color="warning"
                              sx={{ fontWeight: 600 }}
                            />
                          ) : row.valid ? (
                            <Chip label="Ready" size="small" color="success" />
                          ) : (
                            <Chip label="Invalid" size="small" color="error" />
                          )}
                        </TableCell>
                      </TableRow>
                    );

                    return (
                      <Tooltip
                        key={`${row.uid}-${String(index)}-tooltip`}
                        title={<Box sx={{ whiteSpace: 'pre-line' }}>{tooltipText}</Box>}
                      >
                        {rowContent}
                      </Tooltip>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, display: 'flex', justifyContent: 'space-between' }}>
        {step === 'select' ? (
          <>
            <Button variant="outlined" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              variant="contained"
              disabled={!selectedFile}
              onClick={() => {
                void handleNext();
              }}
            >
              Next
            </Button>
          </>
        ) : (
          <>
            <Box display="flex" gap={1}>
              <Button variant="outlined" onClick={handleBack}>
                Back
              </Button>
              <Button variant="outlined" onClick={closeDialog}>
                Cancel
              </Button>
            </Box>
            <Box display="flex" gap={1}>
              <Button
                variant="contained"
                disabled={validRows.length === 0}
                onClick={handleImportMerge}
              >
                Import & merge
              </Button>
              <Button
                variant="contained"
                color="error"
                disabled={validRows.length === 0}
                onClick={handleClearImport}
              >
                Clear & Import
              </Button>
            </Box>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
