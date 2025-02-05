import {
  ADAPTER_CATEGORY,
  ADAPTER_CATEGORY_TYPE,
  ADAPTER_NAMESPACES,
  ADAPTER_STATUS,
  ADAPTER_STATUS_TYPE,
  AdapterInitOptions,
  AdapterNamespaceType,
  BaseAdapter,
  CHAIN_NAMESPACES,
  ChainNamespaceType,
  CONNECTED_EVENT_DATA,
  CustomChainConfig,
  getChainConfig,
  SafeEventEmitterProvider,
  UserInfo,
  WALLET_ADAPTERS,
  WalletInitializationError,
  WalletLoginError,
  Web3AuthError,
} from "@web3auth/base";
import { PhantomInjectedProvider, PhantomWallet } from "@web3auth/solana-provider";
import log from "loglevel";

import { detectProvider } from "./utils";
export interface PhantomAdapterOptions {
  chainConfig?: CustomChainConfig;
}

export class PhantomAdapter extends BaseAdapter<void> {
  readonly name: string = WALLET_ADAPTERS.PHANTOM;

  readonly adapterNamespace: AdapterNamespaceType = ADAPTER_NAMESPACES.SOLANA;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.SOLANA;

  readonly type: ADAPTER_CATEGORY_TYPE = ADAPTER_CATEGORY.EXTERNAL;

  public status: ADAPTER_STATUS_TYPE = ADAPTER_STATUS.NOT_READY;

  public provider: SafeEventEmitterProvider | null = null;

  public _wallet: PhantomWallet | null = null;

  private phantomProvider: PhantomInjectedProvider | null = null;

  private rehydrated = false;

  constructor(options: PhantomAdapterOptions = {}) {
    super();
    this.chainConfig = options.chainConfig;
  }

  get isWalletConnected(): boolean {
    return !!(this._wallet?.isConnected && this.status === ADAPTER_STATUS.CONNECTED);
  }

  setAdapterSettings(_: unknown): void {}

  async init(options: AdapterInitOptions): Promise<void> {
    super.checkInitializationRequirements();
    // set chainConfig for mainnet by default if not set
    if (!this.chainConfig) {
      this.chainConfig = getChainConfig(CHAIN_NAMESPACES.SOLANA, "0x1");
    }
    this._wallet = await detectProvider({ interval: 500, count: 3 });
    if (!this._wallet) throw WalletInitializationError.notInstalled();
    this.phantomProvider = new PhantomInjectedProvider({ config: { chainConfig: this.chainConfig as CustomChainConfig } });
    this.status = ADAPTER_STATUS.READY;
    this.emit(ADAPTER_STATUS.READY, WALLET_ADAPTERS.PHANTOM);

    try {
      if (options.autoConnect) {
        this.rehydrated = true;
        await this.connect();
      }
    } catch (error) {
      log.error("Failed to connect with cached phantom provider", error);
      this.emit("ERRORED", error);
    }
  }

  async connect(): Promise<void> {
    try {
      super.checkConnectionRequirements();
      this.status = ADAPTER_STATUS.CONNECTING;
      this.emit(ADAPTER_STATUS.CONNECTING, { adapter: WALLET_ADAPTERS.PHANTOM });

      if (!this._wallet) throw WalletInitializationError.notInstalled();
      if (!this._wallet.isConnected) {
        const handleDisconnect = this._wallet._handleDisconnect;
        try {
          await new Promise<void>((resolve, reject) => {
            const connect = async () => {
              await this.connectWithProvider(this._wallet as PhantomWallet);
              resolve();
            };
            if (!this._wallet) return reject(WalletInitializationError.notInstalled());
            this._wallet.once("connect", connect);
            // Raise an issue on phantom that if window is closed, disconnect event is not fired
            (this._wallet as PhantomWallet)._handleDisconnect = (...args: unknown[]) => {
              reject(WalletInitializationError.windowClosed());
              return handleDisconnect.apply(this._wallet, args);
            };

            this._wallet.connect().catch((reason: unknown) => {
              reject(reason);
            });
          });
        } catch (error: unknown) {
          if (error instanceof Web3AuthError) throw error;
          throw WalletLoginError.connectionError((error as Error)?.message);
        } finally {
          this._wallet._handleDisconnect = handleDisconnect;
        }
      } else {
        await this.connectWithProvider(this._wallet);
      }

      if (!this._wallet.publicKey) throw WalletLoginError.connectionError();
      this._wallet.on("disconnect", this._onDisconnect);
    } catch (error: unknown) {
      // ready again to be connected
      this.status = ADAPTER_STATUS.READY;
      this.rehydrated = false;
      this.emit(ADAPTER_STATUS.ERRORED, error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isWalletConnected) throw WalletLoginError.notConnectedError("Not connected with wallet");
    try {
      await this._wallet?.disconnect();
      this.emit(ADAPTER_STATUS.DISCONNECTED);
    } catch (error: unknown) {
      this.emit(ADAPTER_STATUS.ERRORED, WalletLoginError.disconnectionError((error as Error)?.message));
    }
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (!this.isWalletConnected) throw WalletLoginError.notConnectedError("Not connected with wallet, Please login/connect first");
    return {};
  }

  private async connectWithProvider(injectedProvider: PhantomWallet): Promise<SafeEventEmitterProvider | null> {
    if (!this.phantomProvider) throw WalletLoginError.connectionError("No phantom provider");
    this.provider = await this.phantomProvider.setupProvider(injectedProvider);
    this.status = ADAPTER_STATUS.CONNECTED;
    this.emit(ADAPTER_STATUS.CONNECTED, { adapter: WALLET_ADAPTERS.PHANTOM, reconnected: this.rehydrated } as CONNECTED_EVENT_DATA);
    return this.provider;
  }

  private _onDisconnect = () => {
    if (this._wallet) {
      this._wallet.off("disconnect", this._onDisconnect);
      this.provider = null;
      this.rehydrated = false;
      // ready to be connected again
      this.status = ADAPTER_STATUS.READY;
      this.emit(ADAPTER_STATUS.DISCONNECTED);
    }
  };
}
