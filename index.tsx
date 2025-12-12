import React from 'react';
import ReactDOM from 'react-dom/client';
import { PublicClientApplication, EventType } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "./services/authConfig";
import App from './App';

const msalInstance = new PublicClientApplication(msalConfig);

// Default to active account if available
if (!msalInstance.getActiveAccount() && msalInstance.getAllAccounts().length > 0) {
    msalInstance.setActiveAccount(msalInstance.getAllAccounts()[0]);
}

msalInstance.addEventCallback((event) => {
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
        // @ts-ignore
        const account = event.payload.account;
        msalInstance.setActiveAccount(account);
    }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Initialize MSAL and render
msalInstance.initialize().then(() => {
    root.render(
      <React.StrictMode>
        <MsalProvider instance={msalInstance}>
            <App />
        </MsalProvider>
      </React.StrictMode>
    );
});
