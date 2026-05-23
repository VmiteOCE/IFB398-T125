# Reds Web Application


> [!IMPORTANT]
> ## Dependencies
> ### Client application
> From the client application sub-directory, install the project dependencies
> ```
> npm install
> ```
> #### Vite Development Server
> Start the Vite development server by running this at the client application sub-directory, then navigate to http://localhost:5173
> ```
> npm run dev
> ```
> #### Client Application Packages
> - ```vite @ 8.0.10```
> - ```react @ 19.2.5```
> - ```react-router-dom @ 7.14.2```
> - ```react-bootstrap @ 2.10.10```
> - ```bootstrap @ 5.3.8```
> #
> ### Server Application
> From the server application sub-directory, install the project dependencies
> ```
> npm install
> ```
> #### Database Initialization
> From the server application sub-directory, generate the database tables and populate with sample data
> ```
> npm run db:init
> ```
> #### HTTPS certificate generation
> From the server application sub-directory, generate a self-signed HTTPS certificate
> ```
> npm run cert
> ```
> If certificate generation fails, make sure you have OpenSSL installed.
>
>  Click [here](https://slproweb.com/download/Win64OpenSSL_Light-4_0_0.msi) to download OpenSSL Light for 64-bit Windows. Otherwise, follow [this link](https://slproweb.com/products/Win32OpenSSL.html) and download your desired installer.
>
> Once you have installed OpenSSL, add it to your system PATH using the following steps (for Windows):
>
> - **Locate the installation:** Find where the openssl.exe was installed (commonly C:\Program Files\OpenSSL-Win64\bin).
> - **Open Environment Variables:** Search for "Edit the system environment variables" in your Start menu.
> - **Edit Path:** Click Environment Variables, find Path under "System variables," and click Edit.
> - **Add New Entry:** Click New and paste the path to your OpenSSL bin folder (e.g., C:\Program Files\OpenSSL-Win64\bin).
> - **Restart Terminal:** Open a fresh Command Prompt or PowerShell window and type openssl version to verify. 
>
> #### Express + Node.js API Server
> Start the Express + Node.js API server by running this at the server application sub-directory, then navigate to https://localhost:3000/ for documentation.
> ```
> npm run dev
> ```
>
> #### Server Application Packages
> - ```express @ 5.2.1```
> - ```knex @ 3.2.10```
> - ```cors @ 2.8.6```
> - ```dotenv @ 17.4.2```
> - ```morgan @ 1.10.1```
> - ```sqlite3 @ 6.0.1```
> - ```nodemon @ 3.1.14```
> - ```swagger-ui-express @ 5.0.1```

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.