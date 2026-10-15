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
> #### Express + Node.js API Server
> Start the Express + Node.js API server by running this at the server application sub-directory, then navigate to http://localhost:3000/ for documentation.
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
> - ```supertest @ 7.2.2```
>
> #
> ### Github Actions (CI)
> Runs the tests locally without requiring a pull request (Ensure you run this from the ```server-application/``` directory)
> ```
> npm test
> ```

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
