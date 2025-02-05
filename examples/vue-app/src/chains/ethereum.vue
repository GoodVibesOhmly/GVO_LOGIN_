<template>
  <div id="app">
    <h3>Login With Web3Auth X Ethereum</h3>
    <Loader :isLoading="loading"></Loader>

    <section
      :style="{
        fontSize: '12px',
      }"
    >
      <button class="rpcBtn" v-if="!connected" @click="connect" style="cursor: pointer">{{ loginButtonStatus }} Connect</button>
      <button class="rpcBtn" v-if="connected" @click="logout" style="cursor: pointer">logout</button>
      <EthRpc v-if="connected && provider" :provider="provider" :console="console"></EthRpc>
      <button class="rpcBtn" v-if="connected" @click="getUserInfo" style="cursor: pointer">Get User Info</button>
      <!-- <button @click="showError" style="cursor: pointer">Show Error</button> -->
    </section>
    <div id="console" style="white-space: pre-line">
      <p style="white-space: pre-line"></p>
    </div>
  </div>
</template>

<script lang="ts">
import { ADAPTER_STATUS, CHAIN_NAMESPACES, CONNECTED_EVENT_DATA, CustomChainConfig, LoginMethodConfig } from "@web3auth/base";
import { Web3Auth } from "@web3auth/web3auth";
import Vue from "vue";

import Loader from "@/components/loader.vue";

import config from "../config";
import EthRpc from "../rpc/ethRpc.vue";

const ethChainConfig: CustomChainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0x3",
  rpcTarget: `https://ropsten.infura.io/v3/776218ac4734478c90191dde8cae483c`,
  displayName: "ropsten",
  blockExplorer: "https://ropsten.etherscan.io/",
  ticker: "ETH",
  tickerName: "Ethereum",
};

export default Vue.extend({
  name: "EthereumChain",
  props: {
    adapterConfig: {
      type: Object,
    },
  },
  watch: {
    adapterConfig: async function (newVal, oldVal) {
      // watch it
      console.log("Prop changed: ", newVal, " | was: ", oldVal);
      await this.initEthAuth();
    },
  },
  data() {
    return {
      modalConfig: {},
      loading: false,
      loginButtonStatus: "",
      connected: false,
      provider: undefined,
      web3auth: new Web3Auth({ chainConfig: { chainNamespace: CHAIN_NAMESPACES.EIP155 }, clientId: config.clientId }),
    };
  },
  components: {
    EthRpc,
    Loader,
  },

  async mounted() {
    await this.initEthAuth();
  },
  methods: {
    parseConfig() {
      this.adapterConfig.adapter.forEach((adapterConf) => {
        this.modalConfig[adapterConf.id] = {
          name: adapterConf.name,
          showOnModal: adapterConf.checked,
        };
        if (adapterConf.id === "openlogin" || adapterConf.id === "customAuth") {
          const loginMethodsConfig: LoginMethodConfig = {};
          this.adapterConfig.login.forEach((loginProvider) => {
            loginMethodsConfig[loginProvider.id] = {
              name: loginProvider.name,
              showOnModal: loginProvider.checked,
            };
          });
          this.modalConfig[adapterConf.id] = {
            ...this.modalConfig[adapterConf.id],
            loginMethods: loginMethodsConfig,
          };
        }
      });
    },
    async initEthAuth() {
      try {
        this.parseConfig();
        console.log("config", this.modalConfig);
        this.loading = true;
        this.web3auth = new Web3Auth({ chainConfig: ethChainConfig, clientId: config.clientId, authMode: "DAPP" });
        this.subscribeAuthEvents(this.web3auth);
        await this.web3auth.initModal({ modalConfig: this.modalConfig });
        console.log("modal initialized", config);
      } catch (error) {
        console.log("error", error);
        this.console("error", error);
      } finally {
        this.loading = false;
      }
    },
    subscribeAuthEvents(web3auth: Web3Auth) {
      web3auth.on(ADAPTER_STATUS.CONNECTED, (data: CONNECTED_EVENT_DATA) => {
        this.console("connected to wallet", data);
        this.provider = web3auth.provider;
        this.loginButtonStatus = "Logged in";
        this.connected = true;
      });
      web3auth.on(ADAPTER_STATUS.CONNECTING, () => {
        this.console("connecting");
        this.loginButtonStatus = "Connecting...";
      });
      web3auth.on(ADAPTER_STATUS.DISCONNECTED, () => {
        this.console("disconnected");
        this.loginButtonStatus = "";
        this.connected = false;
      });
      web3auth.on(ADAPTER_STATUS.ERRORED, (error) => {
        console.log("error", error);
        this.console("errored", error);
        this.loginButtonStatus = "";
      });
    },
    connect() {
      try {
        this.web3auth.connect();
      } catch (error) {
        console.error(error);
        this.console("error", error);
      }
    },

    async logout() {
      await this.web3auth.logout();
      this.provider = undefined;
    },
    async getUserInfo() {
      const userInfo = await this.web3auth.getUserInfo();
      this.console(userInfo);
    },
    console(...args: unknown[]): void {
      const el = document.querySelector("#console>p");
      if (el) {
        el.innerHTML = JSON.stringify(args || {}, null, 2);
      }
    },
  },
});
</script>
