<template>
  <section
    :style="{
      fontSize: '12px',
    }"
  >
    <button class="rpcBtn" @click="onDepositEth" style="cursor: pointer">Deposit eth</button>
    <button class="rpcBtn" @click="onGetAccounts" style="cursor: pointer">Get Accounts</button>
  </section>
</template>

<script lang="ts">
import { POSClient, use } from "@maticnetwork/maticjs";
import { Web3ClientPlugin } from "@maticnetwork/maticjs-web3";
import { CHAIN_NAMESPACES, CustomChainConfig, SafeEventEmitterProvider } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import Vue from "vue";

import { getAccounts } from "../lib/eth";
import { depositEth } from "../lib/polygon";

// install web3 plugin
use(Web3ClientPlugin);

const ethChainConfig: CustomChainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0x5",
  rpcTarget: `https://goerli.infura.io/v3/776218ac4734478c90191dde8cae483c`,
  displayName: "ropsten",
  blockExplorer: "https://ropsten.etherscan.io/",
  ticker: "ETH",
  tickerName: "Ethereum",
};
const polygon = {
  _posClient: new POSClient(),
  connect: async (privateKey: string, polygonProvider: SafeEventEmitterProvider): Promise<POSClient> => {
    const posClient = new POSClient();
    await posClient.init({
      network: "testnet",
      version: "mumbai",
      parent: {
        provider: EthereumPrivateKeyProvider.getProviderInstance({ privKey: privateKey, chainConfig: ethChainConfig }),
        defaultConfig: {
          from: "",
        },
      },
      child: {
        provider: polygonProvider,
        defaultConfig: {
          from: "",
        },
      },
    });
    return posClient;
  },
  getClient: async (polygonProvider: SafeEventEmitterProvider): Promise<POSClient> => {
    if (polygon._posClient) {
      return polygon._posClient;
    }
    const privKey = await polygonProvider.request<string>({ method: "eth_private_key", params: {} });
    return await polygon.connect(privKey, polygonProvider);
  },
};

export default Vue.extend({
  name: "PolygonRpc",
  props: ["provider", "console"],
  data() {
    return {};
  },
  methods: {
    async onDepositEth() {
      const posClient = await polygon.getClient(this.provider);
      await depositEth(posClient, this.provider, this.console);
    },
    async onGetAccounts() {
      await getAccounts(this.provider, this.console);
    },
  },
});
</script>
