import React, { useEffect, useState } from "react";
import "./App.css";
import {
  isMsgInstantiateContractEncodeObject,
  SigningCosmWasmClient,
} from "@cosmjs/cosmwasm-stargate";
// import {
//   coins,
//   executeKdf,
//   GasPrice,
//   uint64ToNumber,
//   uint64ToString,
// } from "@cosmjs/launchpad";

import { Decimal } from "@cosmjs/math";
import { tokenToString } from "typescript";

function App(this: any) {
  const [client, setClient] = useState<SigningCosmWasmClient>();
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState("");
  const [price, setPrice] = useState(2);
  const [initialListing, setInitialListing] = useState(10000);
  const [amount, setAmount] = useState(0);
  const [owned, setOwned] = useState(0);
  const [totalAmountOfTokensMinted, setTotalAmountOftokensMinted] = useState(0);
  const [usdcBalance, setUsdcBalance] = useState(0);
  const [totalTokensLeft, setTotalTokensLeft] = useState(0);

  // let totalAmount = 10000;

  useEffect(() => {
    if (address == "") {
      setConnected(false);
    }
    connect();
    getOwned();
    getTotalAmountOfTokensMinted();
    getUsdcBalance();
  }, [connected]);
  const connect = async () => {
    // Keplr extension injects the offline signer that is compatible with cosmJS.
    // You can get this offline signer from `window.getOfflineSigner(chainId:string)` after load event.
    // And it also injects the helper function to `window.keplr`.
    // If `window.getOfflineSigner` or `window.keplr` is null, Keplr extension may be not installed on browser.
    if (!window.getOfflineSigner || !window.keplr) {
      alert("Please install Keplr extension!");
    } else {
      try {
        // Keplr v0.6.4 introduces an experimental feature that supports the feature to suggests the chain from a webpage.
        // cosmoshub-3 is integrated to Keplr so the code should return without errors.
        // The code below is not needed for cosmoshub-3, but may be helpful if you’re adding a custom chain.
        // If the user approves, the chain will be added to the user's Keplr extension.
        // If the user rejects it or the suggested chain information doesn't include the required fields, it will throw an error.
        // If the same chain id is already registered, it will resolve and not require the user interactions.
        await window.keplr.experimentalSuggestChain({
          // Chain-id of the Osmosis chain.
          chainId: "uni-5",
          // The name of the chain to be displayed to the user.
          chainName: "Juno",
          // RPC endpoint of the chain. In this case we are using blockapsis, as it's accepts connections from any host currently. No Cors limitations.
          rpc: "https://rpc.uni.junonetwork.io",
          // REST endpoint of the chain.
          rest: "https://juno-testnet-api.polkachu.com",
          // Staking coin information
          stakeCurrency: {
            // Coin denomination to be displayed to the user.
            coinDenom: "JUNOX",
            // Actual denom (i.e. uatom, uscrt) used by the blockchain.
            coinMinimalDenom: "ujunox",
            // # of decimal points to convert minimal denomination to user-facing denomination.
            coinDecimals: 6,
            // (Optional) Keplr can show the fiat value of the coin if a coingecko id is provided.
            // You can get id from https://api.coingecko.com/api/v3/coins/list if it is listed.
            // coinGeckoId: ""
          },
          // (Optional) If you have a wallet webpage used to stake the coin then provide the url to the website in `walletUrlForStaking`.
          // The 'stake' button in Keplr extension will link to the webpage.
          // walletUrlForStaking: "",
          // The BIP44 path.
          bip44: {
            // You can only set the coin type of BIP44.
            // 'Purpose' is fixed to 44.
            coinType: 118,
          },
          // Bech32 configuration to show the address to user.
          // This field is the interface of
          // {
          //   bech32PrefixAccAddr: string;
          //   bech32PrefixAccPub: string;
          //   bech32PrefixValAddr: string;
          //   bech32PrefixValPub: string;
          //   bech32PrefixConsAddr: string;
          //   bech32PrefixConsPub: string;
          // }
          bech32Config: {
            bech32PrefixAccAddr: "juno",
            bech32PrefixAccPub: "junopub",
            bech32PrefixValAddr: "junovaloper",
            bech32PrefixValPub: "junovaloperpub",
            bech32PrefixConsAddr: "junovalcons",
            bech32PrefixConsPub: "junovalconspub",
          },
          // List of all coin/tokens used in this chain.
          currencies: [
            {
              // Coin denomination to be displayed to the user.
              coinDenom: "JUNOX",
              // Actual denom (i.e. uatom, uscrt) used by the blockchain.
              coinMinimalDenom: "ujunox",
              // # of decimal points to convert minimal denomination to user-facing denomination.
              coinDecimals: 6,
              // (Optional) Keplr can show the fiat value of the coin if a coingecko id is provided.
              // You can get id from https://api.coingecko.com/api/v3/coins/list if it is listed.
              // coinGeckoId: ""
            },
          ],
          // List of coin/tokens used as a fee token in this chain.
          feeCurrencies: [
            {
              // Coin denomination to be displayed to the user.
              coinDenom: "JUNOX",
              // Actual denom (i.e. uosmo, uscrt) used by the blockchain.
              coinMinimalDenom: "ujunox",
              // # of decimal points to convert minimal denomination to user-facing denomination.
              coinDecimals: 6,
              // (Optional) Keplr can show the fiat value of the coin if a coingecko id is provided.
              // You can get id from https://api.coingecko.com/api/v3/coins/list if it is listed.
              // coinGeckoId: ""
            },
          ],
          // (Optional) The number of the coin type.
          // This field is only used to fetch the address from ENS.
          // Ideally, it is recommended to be the same with BIP44 path's coin type.
          // However, some early chains may choose to use the Cosmos Hub BIP44 path of '118'.
          // So, this is separated to support such chains.
          coinType: 118,
          // (Optional) This is used to set the fee of the transaction.
          // If this field is not provided, Keplr extension will set the default gas price as (low: 0.01, average: 0.025, high: 0.04).
          // Currently, Keplr doesn't support dynamic calculation of the gas prices based on on-chain data.
          // Make sure that the gas prices are higher than the minimum gas prices accepted by chain validators and RPC/REST endpoint.
        });
      } catch {
        alert("Failed to suggest the chain");
      }
    }

    const chainId = "uni-5";

    // You should request Keplr to enable the wallet.
    // This method will ask the user whether or not to allow access if they haven't visited this website.
    // Also, it will request user to unlock the wallet if the wallet is locked.
    // If you don't request enabling before usage, there is no guarantee that other methods will work.
    await window.keplr!.enable(chainId);

    const offlineSigner = window.getOfflineSigner!(chainId);

    // You can get the address/public keys by `getAccounts` method.
    // It can return the array of address/public key.
    // But, currently, Keplr extension manages only one address/public key pair.
    // XXX: This line is needed to set the sender address for SigningCosmosClient.
    const accounts = await offlineSigner.getAccounts();
    const decimal = Decimal.fromAtomics("2000", 0);
    // Initialize the gaia api with the offline signer that is injected by Keplr extension.
    const cosmJS = await SigningCosmWasmClient.connectWithSigner(
      "https://rpc.uni.junonetwork.io",
      offlineSigner,
      {
        gasPrice: {
          amount: decimal,
          denom: "ujunox",
        },
      }
    );

    setClient(cosmJS);
    setConnected(true);
    setAddress(accounts[0].address);
  };

  const purchase = async () => {
    const total = amount * price;
    client?.execute(
      address,
      "juno1j5t7acre67qwd0xst5pa0auauxf968q9jn9td6z5ww5nh4pvnddsuccsac",
      {
        send: {
          contract:
            "juno1mzaulfpfg4mf5r82kwmg46u3zjqjwsza4gvnven42sd7nn0kyssq08enc2",
          amount: total.toString(),

          msg: "eyJ0cmFuc2ZlciI6IHt9fQ==",
        },
      },
      "auto"
    );
    // totalAmount -= amount;
  };
  const handleChange = (event: any) => {
    setAmount(event.target.value);
  };

  const getOwned = async () => {
    const owned = await client?.queryContractSmart(
      "juno1mzaulfpfg4mf5r82kwmg46u3zjqjwsza4gvnven42sd7nn0kyssq08enc2",
      { balance: { address: address } }
    );
    setOwned(owned.balance);
  };

  //honn w rayehhh

  const getTotalAmountOfTokensMinted = async () => {
    const totalAmountOfTokensMinted = await client?.queryContractSmart(
      "juno1mzaulfpfg4mf5r82kwmg46u3zjqjwsza4gvnven42sd7nn0kyssq08enc2",
      { token_info: {} }
    );
    // console.log(totalAmountOfTokensMinted.token_supply);
    setTotalAmountOftokensMinted(totalAmountOfTokensMinted.total_supply);
    const totalTokensLeft = await (initialListing -
      totalAmountOfTokensMinted.total_supply);
    setTotalTokensLeft(totalTokensLeft);
  };

  //hon
  // @ts-ignore
  const getUsdcBalance = async () => {
    const usdcBalance = await client?.queryContractSmart(
      "juno1j5t7acre67qwd0xst5pa0auauxf968q9jn9td6z5ww5nh4pvnddsuccsac",
      { balance: { address: address } }
    );
    setUsdcBalance(usdcBalance.balance);
  };

  return (
    <div className="App">
      <header className="App-header">
        <p className="dafTokens">DAF TOKENS</p>
        <p className="tokenListing">
          Initial Number Of Tokens: {initialListing}
        </p>

        {connected ? (
          <p className="connected">
            {" "}
            You are connected with the address: {address}
          </p>
        ) : (
          <button className="connect" onClick={connect}>
            Connect Wallet
          </button>
        )}
        <p className="priceNumber">${price} USDC </p>
        <p className="currentPrice">Current Price</p>

        <p className="inputTokens"> Input number of tokens: </p>

        <input
          className="inputPrice"
          name="amount"
          value={amount}
          onChange={handleChange}
        ></input>
        <p> </p>
        <button className="buyTokens" onClick={purchase}>
          Buy Tokens
        </button>
        <p className="usdcBalance"> USDC balance: ${usdcBalance} </p>
        <p className="tokensLeft">Tokens left for sale: {totalTokensLeft}</p>

        <p className="tokensOwned">Total tokens owned: {owned}</p>
      </header>
    </div>
  );
}

export default App;
