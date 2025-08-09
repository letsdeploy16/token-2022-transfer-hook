import express from "express";
import cors from "cors";
import fs from "fs";
import dotenv from "dotenv";

import {
  Connection,
  Keypair,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";

import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferInstruction,
  createAssociatedTokenAccountIdempotent,
  mintTo,
  transfer,
  getAccount,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

dotenv.config();
const app = express();
const port = 3001;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

const connection = new Connection("http://127.0.0.1:8899", "confirmed");

function readKeypairOrExit(path, name) {
  try {
    return Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(fs.readFileSync(path, "utf8")))
    );
  } catch (e) {
    console.error(`❌ Cannot load ${name} from ${path}:`, e.message);
    process.exit(1);
  }
}
const feePayer = readKeypairOrExit(`${process.env.HOME}/.config/solana/id.json`, "feePayer");
const mintAuthority = readKeypairOrExit(`${process.env.HOME}/.config/solana/mintAuthority.json`, "mintAuthority");
const senderPath = `${process.env.HOME}/.config/solana/sender.json`;
let senderKeypair = null;
try { senderKeypair = readKeypairOrExit(senderPath, "sender"); } catch { /* ok */ }

const MINT_ADDRESS = new PublicKey("6ZPwB5MJD57J2NeVbMzVjtBpc5zFBDSbH6MRRZCV4rWL");

console.log("🚀 Server starting...");
console.log("💰 Fee Payer:", feePayer.publicKey.toBase58());
console.log("🪙 Mint:", MINT_ADDRESS.toBase58());
console.log("🔑 Mint Auth:", mintAuthority.publicKey.toBase58());
if (senderKeypair) console.log("🔐 Server Sender:", senderKeypair.publicKey.toBase58());

app.get("/", (_, res) => res.send("Token-2022 backend is running"));

app.get("/balance/:address", async (req, res) => {
  try {
    const owner = new PublicKey(req.params.address);
    const ata = await getAssociatedTokenAddress(
      MINT_ADDRESS, owner, false, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID
    );
    const acc = await getAccount(connection, ata, undefined, TOKEN_2022_PROGRAM_ID)
      .catch(() => null);
    res.json({
      success: true,
      ata: ata.toBase58(),
      balance: acc ? acc.amount.toString() : "0",
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/create-ata", async (req, res) => {
  try {
    const { owner } = req.body;
    const ownerPub = new PublicKey(owner);
    const ata = await getAssociatedTokenAddress(
      MINT_ADDRESS, ownerPub, false, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID
    );
    const txSig = await createAssociatedTokenAccountIdempotent(
      connection, feePayer, MINT_ADDRESS, ownerPub,
      { commitment: "confirmed" }, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID
    );
    res.json({ success: true, ata: ata.toBase58(), txSig });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/mint", async (req, res) => {
  try {
    const { recipient, amount } = req.body;
    const recPub = new PublicKey(recipient);
    const ata = await getAssociatedTokenAddress(
      MINT_ADDRESS, recPub, false, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID
    );
    const ataTx = await createAssociatedTokenAccountIdempotent(
      connection, feePayer, MINT_ADDRESS, recPub,
      { commitment: "confirmed" }, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID
    );
    const sig = await mintTo(
      connection, feePayer, MINT_ADDRESS, ata, mintAuthority,
      BigInt(amount), [], { commitment: "confirmed" }, TOKEN_2022_PROGRAM_ID
    );
    res.json({ success: true, txSig: sig, ata: ata.toBase58() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/prepare-transfer", async (req, res) => {
  try {
    const { sender, recipient, amount } = req.body;
    if (!sender || !recipient || amount === undefined)
      return res.status(400).json({ error: "Missing params" });

    const senderPub = new PublicKey(sender);
    const recipientPub = new PublicKey(recipient);
    const amountBN = BigInt(amount);

    const senderATA = await getAssociatedTokenAddress(
      MINT_ADDRESS, senderPub, false, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID
    );
    const recipientATA = await getAssociatedTokenAddress(
      MINT_ADDRESS, recipientPub, false, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const senderAcc = await getAccount(connection, senderATA, undefined, TOKEN_2022_PROGRAM_ID);
    if (senderAcc.amount < amountBN)
      return res.status(400).json({ error: "Insufficient balance" });

    const { blockhash } = await connection.getLatestBlockhash();

    const instructions = [
      createAssociatedTokenAccountIdempotentInstruction(
        senderPub, recipientATA, recipientPub, MINT_ADDRESS,
        TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID
      ),
      createTransferInstruction(
        senderATA, recipientATA, senderPub, amountBN, [], TOKEN_2022_PROGRAM_ID
      ),
    ];

    const msgV0 = new TransactionMessage({
      payerKey: senderPub,
      recentBlockhash: blockhash,
      instructions,
    }).compileToV0Message();

    const tx = new VersionedTransaction(msgV0);
    res.json({
      success: true,
      txBase64: Buffer.from(tx.serialize()).toString("base64"),
    });
  } catch (e) {
    console.error("❌ prepare-transfer:", e);
    res.status(500).json({ error: e.message });
  }
});

app.listen(port, () => console.log(`✅ Backend listening on http://localhost:${port}`));