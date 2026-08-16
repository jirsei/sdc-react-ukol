import { csCZ } from '@mui/material/locale';
import { createTheme } from '@mui/material/styles';

const theme = createTheme(
  {
    cssVariables: true,
    palette: {
      primary: {
        main: '#262a32',
      },
      secondary: {
        main: '#737c90',
      },
      background: {
        default: '#f4f6f8',
      },
    },
    shape: {
      borderRadius: 4,
    },
    typography: {
      h1: {
        fontSize: '2.5rem',
        fontWeight: 500,
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 500,
      },
      h3: {
        fontSize: '1.5rem',
        fontWeight: 500,
      },
    },
    components: {
      MuiButtonBase: {
        defaultProps: {
          disableRipple: true,
        },
      },
      MuiToolbar: {
        defaultProps: {
          variant: 'dense',
        },
      },
    },
  },
  csCZ,
);

export default theme;
