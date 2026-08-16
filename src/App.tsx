import './App.css';

import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import UsersPage from './pages/UsersPage';

function App() {
  return (
    <Box className="app-container d-flex flex-column min-vh-100">
      <CssBaseline />
      <Box sx={{ width: '100%' }}>
        <UsersPage />
      </Box>
    </Box>
  );
}

export default App;
