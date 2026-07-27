import { Horizon, TransactionBuilder, Networks, Operation, Asset, rpc, Contract, Address, scValToNative, nativeToScVal } from "@stellar/stellar-sdk";
import { isConnected, requestAccess, signTransaction, getNetwork } from "@stellar/freighter-api";
import albedo from "@albedo-link/intent";

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const server = new Horizon.Server(HORIZON_URL);

const SOROBAN_RPC_URL = "https://soroban-testnet.stellar.org";
export const rpcServer = new rpc.Server(SOROBAN_RPC_URL);

export const TIPJAR_CONTRACT_ID = "CCAGHZ6EE2O6TR6DKI6H6M5HE24LBPE435XQD4J6L4CM3HI7ZYO2ZDHS";

/**
 * Checks if the Freighter browser extension is installed.
 * @returns {Promise<boolean>} True if installed
 */
export const checkFreighterInstalled = async () => {
  try {
    const res = await isConnected();
    return !!res.isConnected;
  } catch (error) {
    console.error("Error checking Freighter installation:", error);
    return false;
  }
};

/**
 * Connects to Freighter and retrieves the user's public key.
 * @returns {Promise<string>} Stellar Public Key
 */
export const connectFreighter = async () => {
  const installed = await checkFreighterInstalled();
  if (!installed) {
    throw new Error("Freighter wallet is not installed.");
  }

  try {
    const { address, error } = await requestAccess();
    if (error) {
      throw new Error(error || "Failed to retrieve address from Freighter.");
    }
    if (!address) {
      throw new Error("User denied access or no account is available in Freighter.");
    }
    return address;
  } catch (error) {
    console.error("Error connecting Freighter:", error);
    throw new Error(error.message || "Failed to retrieve public key from Freighter.", { cause: error });
  }
};

/**
 * Connects to Albedo and retrieves the user's public key.
 * @returns {Promise<string>} Stellar Public Key
 */
export const connectAlbedo = async () => {
  try {
    const res = await albedo.publicKey({});
    const publicKey = res.pubkey;
    if (!publicKey) {
      throw new Error("No public key returned from Albedo.");
    }
    return publicKey;
  } catch (error) {
    console.error("Error connecting Albedo:", error);
    throw new Error(error.message || "Failed to retrieve public key from Albedo.", { cause: error });
  }
};

/**
 * Checks if Freighter is set to the Stellar Testnet.
 * @returns {Promise<boolean>} True if network is TESTNET
 */
export const checkIsTestnet = async () => {
  try {
    const { network, networkPassphrase, error } = await getNetwork();
    if (error) {
      console.error("Error retrieving network from Freighter:", error);
      return false;
    }
    return (
      (network && network.toUpperCase() === "TESTNET") ||
      (networkPassphrase && networkPassphrase.includes("Testnet"))
    );
  } catch (error) {
    console.error("Error retrieving network from Freighter:", error);
    return false;
  }
};

/**
 * Fetches the XLM balance of a Stellar public key on the Testnet.
 * Handles the case where the account does not exist (unfunded) on Testnet.
 * @param {string} publicKey - Stellar public key
 * @returns {Promise<{balance: string, isFunded: boolean}>} Object containing balance and funding status
 */
export const fetchXlmBalance = async (publicKey) => {
  try {
    const account = await server.loadAccount(publicKey);
    const nativeAsset = account.balances.find((b) => b.asset_type === "native");
    return {
      balance: nativeAsset ? parseFloat(nativeAsset.balance).toFixed(4) : "0.0000",
      isFunded: true
    };
  } catch (error) {
    if (error.status === 404 || (error.response && error.response.status === 404)) {
      return {
        balance: "0.0000",
        isFunded: false
      };
    }
    console.error("Error fetching account balance:", error);
    throw new Error("Could not fetch balance from Horizon Testnet. Check network status.", { cause: error });
  }
};

/**
 * Funds an account on the Testnet using the SDF Friendbot.
 * Useful for beginner-friendly testnet onboarding.
 * @param {string} publicKey - Stellar public key
 * @returns {Promise<boolean>} True if funding succeeded
 */
export const fundAccountWithFriendbot = async (publicKey) => {
  try {
    const response = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`);
    if (response.ok) {
      return true;
    }
    throw new Error("Friendbot request failed.");
  } catch (error) {
    console.error("Friendbot error:", error);
    throw new Error("Friendbot was unable to fund this account. Please try again later.", { cause: error });
  }
};

/**
 * Prepares, signs, and submits a payment transaction on the Stellar Testnet.
 * Updates state through `onProgress` callbacks.
 * 
 * @param {string} senderPk - Sender's public key
 * @param {string} receiverPk - Recipient's public key
 * @param {string} amount - Amount of XLM to send
 * @param {string} walletType - "freighter" or "albedo"
 * @param {function} onProgress - Status update callback
 * @returns {Promise<string>} Transaction hash
 */
export const sendTransactionFlow = async (senderPk, receiverPk, amount, walletType, onProgress) => {
  // Step 1: Preparing transaction (loading account, checking sequence, estimating fees)
  onProgress({ status: "preparing", message: "Fetching account sequence and fee details..." });
  
  let account;
  let baseFee;
  try {
    account = await server.loadAccount(senderPk);
    baseFee = await server.fetchBaseFee();
  } catch (error) {
    console.error("Preparation error:", error);
    throw new Error("Failed to load account sequence from Testnet. Ensure your account is funded.", { cause: error });
  }

  // Double check Freighter network before proceeding if using Freighter
  if (walletType === "freighter") {
    const isTestnet = await checkIsTestnet();
    if (!isTestnet) {
      throw new Error("Freighter is not set to Testnet. Open Freighter settings -> Preferences -> Network and switch to Testnet.");
    }
  }

  // Step 2: Build transaction
  let tx;
  try {
    tx = new TransactionBuilder(account, {
      fee: baseFee.toString(),
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        Operation.payment({
          destination: receiverPk.trim(),
          asset: Asset.native(),
          amount: amount.toString(),
        })
      )
      .setTimeout(300) // 5 minutes validity
      .build();
  } catch (error) {
    console.error("Build error:", error);
    throw new Error(`Failed to build transaction: ${error.message}`, { cause: error });
  }

  const txXdr = tx.toXDR();

  // Step 3: Awaiting signature
  onProgress({ 
    status: "signing", 
    message: `Awaiting signature from ${walletType === "albedo" ? "Albedo Wallet" : "Freighter Wallet"}. Please approve the prompt.` 
  });
  
  let signedXdr;
  if (walletType === "albedo") {
    try {
      const result = await albedo.tx({
        xdr: txXdr,
        network: "testnet",
        submit: false,
      });
      signedXdr = result.signed_envelope_xdr;
    } catch (error) {
      console.error("Albedo signing error:", error);
      throw new Error(error.message || "Transaction signing rejected or failed in Albedo.", { cause: error });
    }
  } else {
    // Freighter
    try {
      const result = await signTransaction(txXdr, {
        networkPassphrase: Networks.TESTNET,
      });
      if (typeof result === "string") {
        signedXdr = result;
      } else if (result && typeof result === "object") {
        if (result.error) {
          throw new Error(result.error);
        }
        signedXdr = result.signedTxXdr || result.xdr || "";
      }
    } catch (error) {
      console.error("Signing error:", error);
      throw new Error(error.message || "Transaction signing rejected or failed in Freighter.", { cause: error });
    }
  }

  if (!signedXdr) {
    throw new Error(`${walletType === "albedo" ? "Albedo" : "Freighter"} did not return a signed transaction.`);
  }

  // Step 4: Submitting to network
  onProgress({ status: "submitting", message: "Submitting transaction to Horizon Testnet..." });

  try {
    // Reconstruct transaction from signed XDR and submit
    const transactionToSubmit = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
    const result = await server.submitTransaction(transactionToSubmit);
    
    if (result.successful) {
      return result.hash;
    } else {
      throw new Error("Transaction submission was not successful.");
    }
  } catch (error) {
    console.error("Submission error details:", error);
    let detailedMsg = "Failed to submit transaction to the network.";
    if (error.response?.data?.extras?.result_codes) {
      const codes = error.response.data.extras.result_codes;
      const opCodes = codes.operations ? codes.operations.join(", ") : "";
      detailedMsg = `Horizon transaction failed: ${codes.transaction}${opCodes ? ` (Operation code: ${opCodes})` : ""}`;
    } else if (error.message) {
      detailedMsg = error.message;
    }
    throw new Error(detailedMsg, { cause: error });
  }
};

/**
 * Fetches the total tipped amount in XLM from the TipJar smart contract.
 * Uses simulation to avoid transaction fees.
 * @returns {Promise<string>} String representing total tips in XLM
 */
export const fetchTipJarTotal = async () => {
  try {
    const contract = new Contract(TIPJAR_CONTRACT_ID);
    const dummyAccount = new Horizon.Account("GCRRSYF5JBFPXHN5DCG65A4J3MUYE53QMQ4XMXZ3CNKWFJIJJTGMH6MZ", "0");
    const tx = new TransactionBuilder(dummyAccount, {
      fee: "100",
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(contract.call("get_total"))
      .setTimeout(300)
      .build();

    const simResult = await rpcServer.simulateTransaction(tx);
    if (rpc.Api.isSimulationSuccess(simResult)) {
      const retval = simResult.result.retval;
      const totalNative = scValToNative(retval);
      return (Number(totalNative) / 10000000).toFixed(4);
    } else {
      throw new Error(simResult.result.error || "Simulation failed reading total tips.");
    }
  } catch (error) {
    console.error("Error fetching tip jar total:", error);
    throw new Error("Could not fetch smart contract state. Please check network connectivity.", { cause: error });
  }
};

/**
 * Submits a tip deposit transaction to the TipJar smart contract on Testnet.
 * Updates state through `onProgress` callbacks.
 * 
 * @param {string} senderPk - Sender's public key
 * @param {string} amount - Amount of XLM to tip
 * @param {string} walletType - "freighter" or "albedo"
 * @param {function} onProgress - Status update callback
 * @returns {Promise<string>} Transaction hash
 */
export const sendTipTransaction = async (senderPk, amount, walletType, onProgress) => {
  onProgress({ status: "preparing", message: "Fetching account details from Testnet..." });

  let account;
  try {
    account = await server.loadAccount(senderPk);
  } catch (error) {
    console.error("Load account error:", error);
    throw new Error("Failed to load account sequence from Testnet. Ensure your account is funded.", { cause: error });
  }

  // Double check Freighter network before proceeding if using Freighter
  if (walletType === "freighter") {
    const isTestnet = await checkIsTestnet();
    if (!isTestnet) {
      throw new Error("Freighter is not set to Testnet. Open Freighter settings -> Preferences -> Network and switch to Testnet.");
    }
  }

  // Build the contract invocation
  onProgress({ status: "preparing", message: "Building smart contract invocation..." });
  const contract = new Contract(TIPJAR_CONTRACT_ID);
  const senderScVal = Address.fromString(senderPk).toScVal();
  
  // Scale amount by 10^7 (stroops) for standard XLM representation
  const amountBigInt = BigInt(Math.floor(parseFloat(amount) * 10000000));
  const amountScVal = nativeToScVal(amountBigInt, { type: "i128" });

  let tx;
  try {
    tx = new TransactionBuilder(account, {
      fee: "100", // Temporary fee, overridden by simulation
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(contract.call("deposit", senderScVal, amountScVal))
      .setTimeout(300)
      .build();
  } catch (error) {
    console.error("Build error:", error);
    throw new Error(`Failed to build transaction: ${error.message}`, { cause: error });
  }

  // Simulate to populate footprint and resource fees
  onProgress({ status: "preparing", message: "Simulating contract execution and estimating resources..." });
  let simResult;
  try {
    simResult = await rpcServer.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(simResult)) {
      throw new Error(simResult.result.error || "Simulation error");
    }
  } catch (error) {
    console.error("Simulation error:", error);
    throw new Error(`Simulation failed: ${error.message || "Unknown error"}. Check if you have enough balance to tip.`, { cause: error });
  }

  // Assemble transaction with simulation resources
  tx = rpc.assembleTransaction(tx, simResult);

  // Awaiting signature from wallet
  onProgress({ 
    status: "signing", 
    message: `Awaiting signature from ${walletType === "albedo" ? "Albedo Wallet" : "Freighter Wallet"}. Please approve the prompt.` 
  });
  const txXdr = tx.toXDR();
  
  let signedXdr;
  if (walletType === "albedo") {
    try {
      const result = await albedo.tx({
        xdr: txXdr,
        network: "testnet",
        submit: false,
      });
      signedXdr = result.signed_envelope_xdr;
    } catch (error) {
      console.error("Albedo signing error:", error);
      throw new Error(error.message || "Transaction signing rejected or failed in Albedo.", { cause: error });
    }
  } else {
    // Freighter
    try {
      const result = await signTransaction(txXdr, {
        networkPassphrase: Networks.TESTNET,
      });
      if (typeof result === "string") {
        signedXdr = result;
      } else if (result && typeof result === "object") {
        if (result.error) {
          throw new Error(result.error);
        }
        signedXdr = result.signedTxXdr || result.xdr || "";
      }
    } catch (error) {
      console.error("Signing error:", error);
      throw new Error(error.message || "Transaction signing rejected or failed in Freighter.", { cause: error });
    }
  }

  if (!signedXdr) {
    throw new Error(`${walletType === "albedo" ? "Albedo" : "Freighter"} did not return a signed transaction.`);
  }

  // Submit signed transaction to RPC
  onProgress({ status: "submitting", message: "Submitting contract call to Soroban RPC..." });
  let sendResponse;
  try {
    const signedTx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
    sendResponse = await rpcServer.sendTransaction(signedTx);
    if (sendResponse.status === "ERROR") {
      throw new Error(`RPC submission error: ${JSON.stringify(sendResponse.errorResult)}`);
    }
  } catch (error) {
    console.error("Submission error:", error);
    throw new Error(`Failed to submit transaction to RPC: ${error.message || error}`, { cause: error });
  }

  const txHash = sendResponse.hash;
  onProgress({ status: "submitting", message: "Waiting for contract state confirmation..." });

  // Poll transaction status
  let txStatus = sendResponse.status;
  let getTxResponse;
  let attempts = 0;
  const maxAttempts = 30;

  try {
    while (txStatus === "PENDING" && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      getTxResponse = await rpcServer.getTransaction(txHash);
      txStatus = getTxResponse.status;
      attempts++;
    }

    if (txStatus === "SUCCESS") {
      return txHash;
    } else {
      throw new Error(`Transaction execution failed with status: ${txStatus}.`);
    }
  } catch (error) {
    console.error("Polling error:", error);
    throw new Error(`Failed to verify transaction status: ${error.message || error}`, { cause: error });
  }
};
