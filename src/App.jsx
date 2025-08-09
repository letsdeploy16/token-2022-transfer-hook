import { Buffer } from "buffer";
window.Buffer = Buffer;
import React, { useState } from "react";
import axios from "axios";
import { VersionedTransaction } from "@solana/web3.js";
import "./App.css";

export default function App() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [balance, setBalance] = useState(null);
  const [logs, setLogs] = useState("Connect your wallet or paste an address to begin...");
  const [transferTo, setTransferTo] = useState("");
  const [loading, setLoading] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

  const connectWallet = async () => {
    if (!window.solana?.isPhantom) {
      setLogs("❌ Phantom wallet not found. Please install it.");
      return;
    }
    try {
      const resp = await window.solana.connect();
      const address = resp.publicKey.toString();
      setWalletAddress(address);
      setLogs(`✅ Wallet connected: ${address}`);
      await checkBalance(address);
    } catch (err) {
      console.error(err);
      setLogs("❌ Wallet connection failed");
    }
  };

  const handleMint = async () => {
    if (!transferTo.trim()) {
      setLogs("❌ Please provide a recipient address.");
      return;
    }
    setLoading(true);
    setLogs("🪙 Minting 100 tokens...");
    try {
      const { data } = await axios.post(`${BACKEND_URL}/mint`, {
        recipient: transferTo.trim(),
        amount: 100,
      });
      if (data.success) {
        setLogs(
          `✅ Token minted!\n🔗 Tx: ${data.txSig}\n📍 ATA: ${data.ataAddress}`
        );
        await checkBalance(transferTo.trim());
      } else {
        setLogs(`❌ Mint failed: ${data.error}`);
      }
    } catch (err) {
      setLogs(`❌ Mint failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkBalance = async (addressOverride) => {
    const addr = addressOverride || walletAddress || transferTo.trim();
    if (!addr) {
      setLogs("❌ Enter an address to check balance.");
      return;
    }
    setLoading(true);
    setLogs("💰 Checking balance...");
    try {
      const { data } = await axios.get(`${BACKEND_URL}/balance/${addr}`);
      setBalance(data.balance);
      setLogs(`💎 Balance: ${data.balance} tokens\n📍 ATA: ${data.ataAddress}`);
    } catch (err) {
      setLogs(`❌ Balance check failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePhantomTransfer = async () => {
    if (!walletAddress || !transferTo.trim()) {
      setLogs("❌ Connect wallet and enter a recipient address.");
      return;
    }
    setLoading(true);
    setLogs("💸 Preparing Phantom transfer...");
    try {
      const { data } = await axios.post(`${BACKEND_URL}/prepare-transfer`, {
        sender: walletAddress,
        recipient: transferTo.trim(),
        amount: 10,
      });
      if (!data.success) {
        setLogs(`❌ Prepare failed: ${data.error}`);
        return;
      }

      const tx = VersionedTransaction.deserialize(
        Buffer.from(data.txBase64, "base64")
      );
      const signed = await window.solana.signTransaction(tx);

      const { Connection } = await import("@solana/web3.js");
      const conn = new Connection("http://127.0.0.1:8899", "confirmed");
      const sig = await conn.sendRawTransaction(signed.serialize(), { skipPreflight: false });
      await conn.confirmTransaction(sig, "confirmed");
      setLogs(`✅ Phantom transfer sent!\n🔗 Tx: ${sig}`);
      await checkBalance(walletAddress);
      setTimeout(() => checkBalance(transferTo.trim()), 1000);
    } catch (err) {
      setLogs(`❌ Phantom transfer failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddressChange = (e) => {
    setTransferTo(e.target.value);
    setBalance(null);
  };
  const fillConnectedAddress = () => walletAddress && setTransferTo(walletAddress);
  const useSampleAddress = () => setTransferTo("11111111111111111111111111111112");

  const stars = Array.from({ length: 200 }, (_, i) => (
    <div
      key={i}
      className="star"
      style={{
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 3}s`,
        animationDuration: `${2 + Math.random() * 2}s`,
      }}
    />
  ));

  const shootingStars = Array.from({ length: 4 }, (_, i) => (
    <div
      key={i}
      className="shooting-star"
      style={{ top: `${10 + i * 20}%`, animationDelay: `${i * 0.8}s` }}
    />
  ));

  return (
    <div className="app">
      {stars}
      {shootingStars}
      <div className="container">
        <h1 className="title">Token-2022 Transfer Hook AMM</h1>

        <div className="connect-section">
          {!walletAddress ? (
            <button className="btn" onClick={connectWallet} disabled={loading}>
              🔗 Connect Phantom Wallet
            </button>
          ) : (
            <div className="wallet-address">
              <strong>🔑 Connected Wallet:</strong>
              <br />
              <code>{walletAddress}</code>
            </div>
          )}
        </div>

        <div className="input-section">
          <input
            type="text"
            placeholder="Enter recipient wallet address..."
            value={transferTo}
            onChange={handleAddressChange}
            className="input"
            disabled={loading}
          />
          
        </div>

        <div className="btn-group">
          <button className="btn" onClick={handleMint} disabled={loading || !transferTo.trim()}>
            {loading ? "⏳ Processing..." : "⚡ Mint 100 Tokens"}
          </button>

          <button
            className="btn"
            onClick={handlePhantomTransfer}
            disabled={loading || !walletAddress || !transferTo.trim()}
          >
            {loading ? "⏳ Processing..." : "🚀 Phantom Transfer 10"}
          </button>

          <button className="btn" onClick={() => checkBalance()} disabled={loading}>
            {loading ? "⏳ Processing..." : "💰 Check Balance"}
          </button>
        </div>

        {balance !== null && (
          <div className="balance">
            <strong>💎 Current Balance:</strong> {balance} tokens
          </div>
        )}

        <div className="status-section">
          <h3>📊 Status</h3>
          <pre className="logs">{logs}</pre>
        </div>

        <div className="debug-section">
          <h3>🔧 Debug Info</h3>
          <p><strong>Backend:</strong> {BACKEND_URL}</p>
          <p><strong>Connected Wallet:</strong> {walletAddress || "Not connected"}</p>
          <p><strong>Recipient Address:</strong> {transferTo || "Not set"}</p>
          <p><strong>Loading:</strong> {loading ? "Yes" : "No"}</p>
        </div>
      </div>
    </div>
  );
}