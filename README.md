# Token-2022 with Transfer Hooks – Tradable on Solana AMMs

A full-stack Solana project that showcases a **Token-2022 mint** equipped with **Transfer-Hook** instructions.  
The hook enforces custom logic on every transfer (e.g., royalty, fee, or access-control) while the token remains **fully tradable on any Solana AMM** (Orca, Raydium, Phoenix, etc.).  
Everything runs against a **local validator**, complete with Anchor tests, deployment scripts, and a minimal React UI for minting / swapping.

-----
🔗 **Live Repository**  
https://github.com/letsdeploy16/token-2022-transfer-hook

-----

## ✅ Completed Features
| # | Component | Status | Notes |
|---|-----------|--------|-------|
| 1 | Token-2022 Mint Program (`programs/token_2022_transfer_hook/`) | ✅ | `lib.rs`, `initialize_mint.rs`, `transfer_hook.rs` compiled & tested |
| 2 | Transfer-Hook Interface CPIs | ✅ | SPL TLV account management & validation |
| 3 | Unit / Integration Tests (`tests/`) | ✅ | `token_2022_transfer_hook.ts` – all suites pass |
| 4 | Local Validator Scripts | ✅ | `start-local.sh`, `stop-local.sh` |
| 5 | AMM Compatibility Demo (`scripts/create_amm_pool.ts`) | ✅ | Creates Orca Whirlpool on devnet clone |
| 6 | React Front-End (`app/`) | ✅ | Vite + `@solana/wallet-adapter` + Jupiter swap widget |
| 7 | Dev-Keypair & Airdrop Scripts | ✅ | `scripts/setup.sh`, `scripts/mint-to-user.js` |
| 8 | README & Environment Docs | ✅ | You are reading it |

---

## 🛠 Prerequisites
- Solana CLI ≥ 1.18  
- Anchor ≥ 0.30  
- Node ≥ 18  
- Yarn (or npm)  
- Optional: Orca SDK for pool testing

---

## 🚀 Quick Start (Local Validator)

```bash
# 1. Clone repo
git clone https://github.com/letsdeploy16/token-2022-transfer-hook.git
cd token-2022-transfer-hook

# 2. Install dependencies
yarn install          # root
cd app && yarn install && cd ..

# 3. Start fresh local validator (background)
./start-local.sh

# 4. Build & deploy program
anchor build
anchor deploy --provider.cluster localnet

# 5. Run tests
anchor test --skip-build --skip-deploy

# 6. Start React dev server
cd app
yarn dev   # http://localhost:5173

-----
📁 Project Layout
-----
token-2022-transfer-hook/
├── Anchor.toml
├── Cargo.toml
├── programs/
│   └── token_2022_transfer_hook/
│       └── src/
│           ├── lib.rs
│           ├── initialize_mint.rs
│           └── transfer_hook.rs
├── tests/
│   └── token_2022_transfer_hook.ts
├── migrations/
├── scripts/
│   ├── setup.sh
│   ├── mint-to-user.js
│   └── create_amm_pool.ts
├── app/
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── start-local.sh
├── stop-local.sh
└── README.md

-----
🧪 Useful Commands
-----
| Task                              | Command                                                 |
| --------------------------------- | ------------------------------------------------------- |
| Start validator                   | `solana-test-validator --reset --quiet --rpc-port 8899` |
| Stop validator                    | `pkill solana-test-validator`                           |
| Build program                     | `anchor build`                                          |
| Deploy to localnet                | `anchor deploy --provider.cluster localnet`             |
| Run tests                         | `anchor test --skip-build --skip-deploy`                |
| Create AMM pool (local)           | `ts-node scripts/create_amm_pool.ts`                    |
| Airdrop 10 SOL to default keypair | `solana airdrop 10`                                     |
| View logs                         | `solana logs --url localhost`                           |

------

------
📝 Troubleshooting
------
Anchor build error: “failed to run custom build command”
→ Run cargo clean && anchor build.
React can’t connect to localhost
→ Ensure start-local.sh is running and your browser wallet is set to http://localhost:8899.

---

## 🪪 License
This project is MIT licensed.

---

## 🔗 Author
**GitHub**: [letsdeploy16](https://github.com/letsdeploy16)

Happy building! 🚀