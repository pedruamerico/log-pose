// Vite entry. Loads data globals (window.APPS etc.), styles, then mounts App.

// Local fonts (bundled — work offline). Weights used by the Log Pose design:
// Inter for UI, Space Mono for labels/counts/metadata/bearings.
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/space-mono/400.css';
import '@fontsource/space-mono/700.css';

import './data.js';        // populates window.APPS, window.FEATURES, ... (side-effect)
import './styles.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
    React.createElement(React.StrictMode, null, React.createElement(App))
);
