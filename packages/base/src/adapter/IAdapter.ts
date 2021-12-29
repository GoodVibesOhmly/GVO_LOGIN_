import { SafeEventEmitter } from "@toruslabs/openlogin-jrpc";

import { AdapterNamespaceType, ChainNamespaceType } from "../chain/IChainInterface";
import { SafeEventEmitterProvider } from "../provider/IProvider";

export const BASE_ADAPTER_EVENTS = {
  READY: "ready",
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
  CONNECTING: "connecting",
  ERRORED: "errored",
};

export type UserInfo = {
  /**
   * Email of the logged in user
   */
  email: string;
  /**
   * Full name of the logged in user
   */
  name: string;
  /**
   * Profile image of the logged in user
   */
  profileImage: string;
  /**
   * verifier of the logged in user (google, facebook etc)
   */
  verifier: string;
  /**
   * Verifier Id of the logged in user
   *
   * email for google,
   * id for facebook,
   * username for reddit,
   * id for twitch,
   * id for discord
   */
  verifierId: string;
};

export const ADAPTER_CATEGORY = {
  EXTERNAL: "external",
  IN_APP: "in_app",
} as const;

export type ADAPTER_CATEGORY_TYPE = typeof ADAPTER_CATEGORY[keyof typeof ADAPTER_CATEGORY];

interface AdapterInitOptions {
  /**
   * Whether to auto connect to the adapter based on redirect mode or saved adapters
   */
  autoConnect?: boolean;
}

export interface IAdapter<T> extends SafeEventEmitter {
  namespace: AdapterNamespaceType;
  currentChainNamespace: ChainNamespaceType;
  type: ADAPTER_CATEGORY_TYPE;
  ready: boolean;
  connecting: boolean;
  connected: boolean;
  provider: SafeEventEmitterProvider;
  init(options?: AdapterInitOptions): Promise<void>;
  connect(params?: T): Promise<SafeEventEmitterProvider | null>;
  disconnect(): Promise<void>;
  getUserInfo(): Promise<Partial<UserInfo> | null>;
}

export abstract class BaseAdapter<T> extends SafeEventEmitter implements IAdapter<T> {
  public abstract namespace: AdapterNamespaceType;

  public abstract currentChainNamespace: ChainNamespaceType;

  public abstract type: ADAPTER_CATEGORY_TYPE;

  public abstract connecting: boolean;

  public abstract ready: boolean;

  public abstract connected: boolean;

  public abstract provider: SafeEventEmitterProvider;

  abstract init(options?: AdapterInitOptions): Promise<void>;
  abstract connect(params?: T): Promise<SafeEventEmitterProvider | null>;
  abstract disconnect(): Promise<void>;
  abstract getUserInfo(): Promise<Partial<UserInfo> | null>;
}

export interface BaseAdapterConfig {
  visible?: boolean;
  showOnMobile?: boolean;
  showOnDesktop?: boolean;
}