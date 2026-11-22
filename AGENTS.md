# Repository Guidelines

## Stack

ShopLedger is a Node.js application using Express 4 and `body-parser`. Its browser interface is static HTML, CSS, and vanilla JavaScript under `public/`. Application data is stored in `data/db.json`; configuration is in `config.js`. Dependencies are declared in `package.json` and recorded in `package-lock.json`.

## Module Map

- `server.js` creates the Express app, serves `public/`, and mounts the API routers.
- `routes/` contains resource endpoints: `orders.js`, `products.js`, `customers.js`, and `reports.js`.
- `lib/` contains domain modules: `orders.js`, `pricing.js`, `tax.js`, `coupons.js`, `inventory.js`, `ledger.js`, `invoice.js`, `reports.js`, `dates.js`, and `store.js` for JSON persistence and audit entries.
- `public/` contains the POS and back-office UI; `data/db.json` holds its records; `docs/architecture.svg` diagrams the application.

## Commands

- `npm start` runs `node server.js` on port 3000 by default; set `PORT` to override it.
- `npm test` currently prints “no test specified” and exits unsuccessfully. There is no configured test framework, build step, formatter, or linter.

## Change Rules

- Before changing behavior, write characterization tests that capture the existing behavior and the intended change.
- Change only the module the ticket is about. Avoid unrelated cleanup or edits to neighboring modules.
- Tests must never read or write `data/db.json`. Use isolated test data and temporary files when persistence behavior needs coverage.
- Add no dependencies. Use the existing runtime and packages.
