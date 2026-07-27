# AstroTip 🚀

A Level 2 Stellar & Soroban dApp built on the Stellar Testnet using React, Vite, Tailwind CSS, and Soroban Smart Contracts.

AstroTip allows users to connect Stellar wallets, view balances, send XLM payments, interact with a deployed Soroban smart contract, and track contract activity in real time through a modern, responsive interface.

---

## 🌐 Live Demo

**Live Application:**

https://astro-tip.vercel.app/

---

## 📹 Demo Video

Watch the complete project demonstration:

https://youtu.be/Ia0MADcjq9s?si=aYNvkPQfgWiP49jz

---

## 📂 GitHub Repository

https://github.com/Doremonjh

---

## ✨ Features

### Multi-Wallet Support

* Freighter Wallet Integration
* Albedo Wallet Integration
* Wallet Connect / Disconnect
* Automatic wallet persistence using localStorage

### Balance Management

* Fetch Stellar Testnet XLM balance
* Real-time balance updates
* Friendbot funding support

### XLM Transactions

* Send XLM payments on Stellar Testnet
* Input validation
* Success and failure notifications
* Transaction hash tracking

### Soroban Smart Contract

* Deposit tips into Tip Jar contract
* Read contract state
* Real-time contract interaction
* Event monitoring

### Transaction Status Tracking

Displays transaction stages:

* Preparing
* Awaiting Signature
* Submitting
* Pending Confirmation
* Confirmed
* Failed

### Error Handling

Handles multiple error types:

* WalletNotInstalledError
* UserRejectedTransactionError
* NetworkError
* InsufficientBalanceError
* ContractExecutionError

---

## 🔗 Smart Contract Information

| Item                        | Value                                                              |
| --------------------------- | ------------------------------------------------------------------ |
| Network                     | Stellar Testnet                                                    |
| Contract ID                 | `CCAGHZ6EE2O6TR6DKI6H6M5HE24LBPE435XQD4J6L4CM3HI7ZYO2ZDHS`         |
| Smart Contract              | Soroban Tip Jar                                                    |
| Status                      | Deployed Successfully                                              |
| Deployment Transaction Hash | `68e0d1336abf3a6f7e7d3659d70c5b30134c108297a61b6df0d51e905a818636` |

---

## 🛠 Tech Stack

### Frontend

* React 19
* Vite
* Tailwind CSS
* React Toastify

### Blockchain

* Stellar SDK
* Soroban Smart Contracts
* Horizon API
* Soroban RPC

### Wallets

* Freighter Wallet
* Albedo Wallet

### Deployment

* GitHub
* Vercel
* GitHub Actions

---

## 📁 Project Structure

```text
contracts/
└── tipjar/

src/
├── components/
├── config/
├── contracts/
├── events/
├── services/
├── utils/
├── wallets/

README.md
package.json
```

---

## 🚀 Installation & Setup

### Clone Repository

```bash
git clone https://github.com/Doremonjh/Astro-Tip.git
cd Astro-Tip
```

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Application runs at:

```text
http://localhost:5173
```

---

## 🧪 Build Project

```bash
npm run build
```

---

## 📸 Screenshots

### Home Dashboard

![Home Dashboard](screenshots/front.png)

### Wallet Connection

![Wallet Connection](screenshots/wallet.png)

### Connected Wallet & Balance

![Connected Wallet](screenshots/connected.png)

### Transaction Success

![Transaction Success](screenshots/trans4.png)

### Mobile Responsive View

![Mobile Responsive View](screenshots/mobile.jpeg)

---

## ⚙️ Soroban Contract Deployment

### Build Contract

```bash
stellar contract build
```

### Deploy Contract

```bash
stellar contract deploy \
--wasm target/wasm32v1-none/release/soroban_tipjar_contract.wasm \
--source deployer \
--network testnet
```

### Contract ID

```text
CCAGHZ6EE2O6TR6DKI6H6M5HE24LBPE435XQD4J6L4CM3HI7ZYO2ZDHS
```

---

## 🔄 CI/CD

GitHub Actions automatically:

* Install dependencies
* Run validation checks
* Build project
* Verify deployment readiness

Workflow file:

```text
.github/workflows/ci.yml
```

---

## ✅ Level 2 Requirements Completed

* Wallet Connect Functionality
* Wallet Disconnect Functionality
* Freighter Integration
* Albedo Integration
* Multi-Wallet Support
* Balance Fetching
* XLM Transaction Support
* Contract Deployed on Testnet
* Frontend Contract Interaction
* Real-Time Event Integration
* Transaction Status Tracking
* Error Handling
* Mobile Responsive UI
* Public GitHub Repository
* GitHub Actions CI/CD
* Vercel Deployment
* README Documentation
* Demo Video

---

## 📝 Feedback Form

We'd love to hear your thoughts! Your feedback helps us improve the project and build a better experience.

👉 **Submit your feedback here:**

https://docs.google.com/spreadsheets/d/1keevBdqsgaL9YdjkQXLifaWl-IZr2UDQRCPlN0CTVPo/edit?usp=sharing

Thank you for taking the time to share your feedback! ❤️

---

## 📈 Git Commit History

* feat: add multi-wallet support with Freighter and Albedo integration
* feat: implement Soroban tip jar contract and frontend contract interactions
* feat: add real-time event subscriptions and transaction status tracking
* refactor: improve error handling, UI polish, and production readiness
* feat: complete AstroTip Level 2 project

---

## 🔗 Useful Links

### Stellar Documentation

https://developers.stellar.org/

### Soroban Documentation

https://soroban.stellar.org/

### Stellar Expert Explorer

https://stellar.expert

---

## 👨‍💻 Developer

**Pratibha**

Built as part of the Stellar Developer Program Level 2 Challenge using Stellar, Soroban, React, and Vercel.
