import React from 'react';
import get from 'lodash/get';
import { ThemeProvider, StyledEngineProvider, CssBaseline } from '@mui/material';
import { ThemeProvider as StyledThemeProvider, createGlobalStyle } from 'styled-components';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import theme from './libs/theme';
import { SessionProvider } from './contexts/session';

import Home from './pages/home';

const GlobalStyle = createGlobalStyle`
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

function App() {
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <StyledThemeProvider theme={theme}>
          <SessionProvider serviceHost={get(window, 'blocklet.prefix', '/')}>
            <CssBaseline />
            <GlobalStyle />
            <div className="app">
              <Routes>
                <Route exact path="/" element={<Home />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </div>
          </SessionProvider>
        </StyledThemeProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}

const WrappedApp = App;

export default () => {
  // While the blocklet is deploy to a sub path, this will be work properly.
  const basename = window?.blocklet?.prefix || '/';

  return (
    <Router basename={basename}>
      <WrappedApp />
    </Router>
  );
};
