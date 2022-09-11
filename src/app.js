import get from 'lodash/get';
import { ThemeProvider as MuiThemeProvider, StyledEngineProvider, CssBaseline } from '@mui/material';
import { ThemeProvider as EmotionThemeProvider, css, Global } from '@emotion/react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import theme from './libs/theme';
import { SessionProvider } from './contexts/session';

import Home from './pages/home';

const globalStyles = css`
  body {
    min-height: 100%;
    background-color: #484d5d !important;
    background-image: url(./images/bg.png);
    text-align: center;
    color: #e2e2e4;
    padding: 0;
    margin: 0;
  }
  a {
    color: #e2e2e4;
    text-decoration: none !important;
  }
  a:hover,
  a:hover * {
    text-decoration: none !important;
  }
`;

export default function App() {
  // While the blocklet is deploy to a sub path, this will be work properly.
  const basename = window?.blocklet?.prefix || '/';

  return (
    <StyledEngineProvider injectFirst>
      <MuiThemeProvider theme={theme}>
        <EmotionThemeProvider theme={theme}>
          <Router basename={basename}>
            <SessionProvider serviceHost={get(window, 'blocklet.prefix', '/')}>
              <CssBaseline />
              <Global css={globalStyles} />
              <div className="app">
                <Routes>
                  <Route exact path="/" element={<Home />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </div>
            </SessionProvider>
          </Router>
        </EmotionThemeProvider>
      </MuiThemeProvider>
    </StyledEngineProvider>
  );
}
