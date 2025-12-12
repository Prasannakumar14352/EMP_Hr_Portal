import { Configuration, PopupRequest } from "@azure/msal-browser";

// Config object to be passed to Msal on creation
export const msalConfig: Configuration = {
    auth: {
        clientId: "af84ee21-88c6-4cb7-9586-957230a8f583", // Replace with your Azure AD Application (client) ID
        authority: "https://login.microsoftonline.com/common", // Change 'common' to your Tenant ID for single-tenant apps
        redirectUri: window.location.origin,
    },
    cache: {
        cacheLocation: "sessionStorage", // This configures where your cache will be stored
        storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
    },
};

// Add scopes here for ID token to be used at Microsoft identity platform endpoints.
export const loginRequest: PopupRequest = {
    scopes: ["User.Read", "User.ReadBasic.All"]
};
