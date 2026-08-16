import { csCZ } from '@mui/material/locale';
import { createTheme } from '@mui/material/styles';

const theme = createTheme(
  {
    cssVariables: true,
    palette: {
      mode: 'dark',
      primary: {
        main: '#9bb0c8',
        light: '#c8d4e3',
        dark: '#6f839d',
        contrastText: '#edf3fb',
      },
      secondary: {
        main: '#7f8ea3',
        light: '#a9b6c8',
        dark: '#58657a',
        contrastText: '#edf3fb',
      },
      background: {
        default: '#0b1220',
        paper: '#121b2a',
      },
      text: {
        primary: '#edf3fb',
        secondary: '#b9c5d4',
      },
      divider: '#2d3a4d',
      grey: {
        50: '#eef3f9',
        100: '#dfe8f3',
        200: '#c7d3e2',
        300: '#a9b9cc',
        400: '#7e8ea2',
        500: '#5d6d85',
        600: '#46556e',
        700: '#34425a',
        800: '#202c3f',
        900: '#121b2a',
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
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            minHeight: '100vh',
            background:
              'radial-gradient(circle at top, rgba(124, 155, 196, 0.28), transparent 35%), linear-gradient(135deg, #0b1220 0%, #121b2a 35%, #1a2438 100%)',
            backgroundAttachment: 'fixed',
            color: '#edf3fb',
          },
          '#root': {
            minHeight: '100vh',
            background: 'transparent',
          },
        },
      },
    },
  },
  csCZ,
);

export default theme;
