// index.js

import express from "express";
import cors from "cors";
import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transfer,
  getAccount,
} from "@solana/spl-token";
import fs from "fs";

// -------------------------
// App Setup
// -------------------------
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// -------------------------
// Solana Setup
// -------------------------
const connection = new Connection("http://127.0.0.1:8899", "confirmed");

// Load keypair (mint authority)
const secretKey = Uint8Array.from(
  JSON.parse(fs.readFileSync("./mint-authority.json", "utf8"))
);
const mintAuthority = Keypair.fromSecretKey(secretKey);

// Token-2022 Mint
const MINT_ADDRESS = new PublicKey("B3QoRek4k8MeDDTk2N2NQGTzuad8dPBc3cwxnshLAPT1");

// -------------------------
// Routes
// -------------------------

// Health Check
app.get("/", (req, res) => {
  res.send("✅ Solana Transfer Hook Backend is running.");
});

// ✅ Mint tokens
app.post("/mint", async (req, res) => {
  try {
    const { recipient, amount } = req.body;

    const recipientPubkey = new PublicKey(recipient);
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      mintAuthority,
      MINT_ADDRESS,
      recipientPubkey
    );

    const tx = await mintTo(
      connection,
      mintAuthority,
      MINT_ADDRESS,
      tokenAccount.address,
      mintAuthority,
      amount
    );

    res.json({
      success: true,
      message: `✅ Minted ${amount} tokens to ${recipient}`,
      tokenAccount: tokenAccount.address.toBase58(),
      signature: tx,
    });
  } catch (error) {
    console.error("❌ Mint Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Get token balance
app.get("/balance/:wallet", async (req, res) => {
  try {
    const wallet = new PublicKey(req.params.wallet);
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      mintAuthority,
      MINT_ADDRESS,
      wallet
    );

    const accountInfo = await getAccount(connection, tokenAccount.address);

    res.json({
      wallet: wallet.toBase58(),
      tokenAccount: tokenAccount.address.toBase58(),
      amount: Number(accountInfo.amount),
    });
  } catch (error) {
    console.error("❌ Balance Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Transfer tokens
app.post("/transfer", async (req, res) => {
  try {
    const { fromSecretKey, toPublicKey, amount } = req.body;

    const from = Keypair.fromSecretKey(Uint8Array.from(fromSecretKey));
    const to = new PublicKey(toPublicKey);

    const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      from,
      MINT_ADDRESS,
      from.publicKey
    );

    const toTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      from,
      MINT_ADDRESS,
      to
    );

    const tx = await transfer(
      connection,
      from,
      fromTokenAccount.address,
      toTokenAccount.address,
      from,
      amount
    );

    res.json({
      success: true,
      message: `✅ Transferred ${amount} tokens`,
      from: from.publicKey.toBase58(),
      to: to.toBase58(),
      txSignature: tx,
    });
  } catch (error) {
    console.error("❌ Transfer Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// -------------------------
// Start server
// -------------------------
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
