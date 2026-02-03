import React from 'react';
import ReactDOM from 'react-dom/client';
import '~/src/utils/diagnostics';
import '~/src/utils/mobileLogger'; // Capture logs for mobile debugging
import App from '~/src/App';
import '~/src/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
