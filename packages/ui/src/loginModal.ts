import "../css/web3auth.css";

import { SafeEventEmitter } from "@toruslabs/openlogin-jrpc";
import { BASE_WALLET_EVENTS, BaseAdapterConfig, CommonLoginOptions, LoginMethodConfig, WALLET_ADAPTER_TYPE } from "@web3auth/base";

import { icons, images } from "../assets";
import { LOGIN_MODAL_EVENTS, UIConfig } from "./interfaces";

export default class LoginModal extends SafeEventEmitter {
  public $modal!: HTMLDivElement;

  private appLogo: string;

  private version: string;

  private state = {
    initialized: false,
    connected: false,
    connecting: false,
    errored: false,
  };

  constructor({ appLogo, version, adapterListener }: UIConfig) {
    super();
    this.appLogo = appLogo;
    this.version = version;
    this.subscribeCoreEvents(adapterListener);
  }

  get initialized() {
    return this.state.initialized;
  }

  init() {
    const web3authIcon = images[`web3auth.svg`];
    const closeIcon = icons["close.svg"];
    this.$modal = this.htmlToElement(`
        <div class="w3a-modal">
            <div class="w3a-modal__inner">
                <div class="w3a-modal__header">
                    <div class="w3a-header">
                        <img class="w3a-header__logo" src="${this.appLogo}" alt="">
                        <div>
                            <h1 class="w3a-header__title">Sign in</h1>
                            <p class="w3a-header__subtitle">Select one of the following to continue</p>
                        </div>
                    </div>
                    <button class="w3a-header__button">
                        <img src="${closeIcon}" alt="">
                    </button>
                </div>
                <div class="w3a-modal__content w3ajs-content"></div>
                <div class="w3a-modal__footer">
                    <div class="w3a-footer">
                        <div>
                            <ul class="w3a-footer__links">
                                <li class="w3a-footer__links-item"><a href="">Terms of use</a></li>
                                <li class="w3a-footer__links-item"><a href="">Privacy policy</a></li>
                            </ul>
                            <p>${this.version}</p>
                        </div>
                        <img height="24" src="${web3authIcon}" alt="">
                    </div>
                </div>
            </div>
        </div>
    `);
    const $content = this.$modal.querySelector(".w3ajs-content");

    const $torusWallet = this.getTorusWallet();
    const $torusWalletEmail = this.getTorusWalletEmail();
    const $externalWallet = this.getExternalWallet();

    const $externalToggle = $externalWallet.querySelector(".w3ajs-external-toggle");
    const $externalToggleButton = $externalToggle?.querySelector(".w3ajs-external-toggle__button");
    const $externalBackButton = $externalWallet.querySelector(".w3ajs-external-back");
    const $externalContainer = $externalWallet.querySelector(".w3ajs-external-container");

    $externalToggleButton?.addEventListener("click", () => {
      $externalToggle?.classList.toggle("w3a-external-toggle--hidden");
      $externalContainer?.classList.toggle("w3a-external-container--hidden");
      $torusWallet.classList.toggle("w3a-group--hidden");
      $torusWalletEmail.classList.toggle("w3a-group--hidden");
    });
    $externalBackButton?.addEventListener("click", () => {
      $externalToggle?.classList.toggle("w3a-external-toggle--hidden");
      $externalContainer?.classList.toggle("w3a-external-container--hidden");
      $torusWallet.classList.toggle("w3a-group--hidden");
      $torusWalletEmail.classList.toggle("w3a-group--hidden");
    });

    $content?.appendChild($torusWallet);
    $content?.appendChild($torusWalletEmail);
    $content?.appendChild($externalWallet);

    document.body.appendChild(this.$modal);
    this.state.initialized = true;
  }

  showModal() {}

  addSocialLogins = (adapter: WALLET_ADAPTER_TYPE, adapterConfig: BaseAdapterConfig, loginMethods: Record<string, LoginMethodConfig>): void => {
    const adapterList = this.$modal.querySelector(".w3ajs-socials-adapters") as HTMLDivElement;
    Object.keys(loginMethods)
      .reverse()
      .forEach((method: string) => {
        const providerIcon = images[`login-${method}.svg`];
        const adapterButton = this.htmlToElement(`
            <li class="w3a-adapter-item">
                <button class="w3a-button w3a-button--icon">
                    <img class="w3a-button__image" src="${providerIcon}" alt="">
                </button>
            </li>          
        `);

        adapterButton.addEventListener("click", () => {
          this.emit(LOGIN_MODAL_EVENTS.LOGIN, { adapter, loginParams: { loginProvider: method } as CommonLoginOptions });
        });

        adapterList.prepend(adapterButton);
      });
  };

  addWalletLogins = (adaptersConfig: Record<string, BaseAdapterConfig>): void => {
    const adapterList = this.$modal.querySelector(".w3ajs-wallet-adapters") as HTMLDivElement;
    Object.keys(adaptersConfig).forEach((adapter) => {
      const providerIcon = images[`login-${adapter}.svg`];
      const adapterButton = this.htmlToElement(`
            <li class="w3a-adapter-item">
                <button class="w3a-button w3a-button--icon">
                    <img class="w3a-button__image" src="${providerIcon}" alt="">
                </button>
                <p class="w3a-adapter-item__label">${adapter}</p>
            </li>   
        `);

      adapterButton.addEventListener("click", () => {
        this.emit(LOGIN_MODAL_EVENTS.LOGIN, { adapter });
      });

      adapterList.appendChild(adapterButton);
    });
  };

  private getTorusWallet(): HTMLDivElement {
    const expandIcon = icons["expand.svg"];
    return this.htmlToElement(`
        <div class="w3a-group">
            <h6 class="w3a-group__title">CONTINUE WITH</h6>
            <ul class="w3a-adapter-list w3ajs-socials-adapters">
              <li class="w3a-adapter-item">
                  <button class="w3a-button w3a-button--icon">
                      <img class="w3a-button__image" src="${expandIcon}" alt="">
                  </button>
              </li>   
            </ul>
        </div>
    `);
  }

  private getTorusWalletEmail = (): HTMLDivElement => {
    return this.htmlToElement(`
        <div class="w3a-group">
            <h6 class="w3a-group__title">EMAIL</h6>
            <form>
                <input class="w3a-text-field" type="text" placeholder="Email">
                <button class="w3a-button">Continue with Email</button>
            </form>
        </div>
    `);
  };

  private getExternalWallet = (): HTMLDivElement => {
    const torusImage = images[`login-torus.svg`];
    const arrowLeftIcon = icons["circle-arrow-left.svg"];
    const expandIcon = icons["expand.svg"];
    return this.htmlToElement(`
        <div class="w3a-group">
            <div class="w3a-external-toggle w3ajs-external-toggle">
                <h6 class="w3a-group__title">EXTERNAL WALLET</h6>
                <button class="w3a-button w3ajs-external-toggle__button">Connect with Wallet</button>
            </div>
            <div class="w3a-external-container w3a-external-container--hidden w3ajs-external-container">
                <button class="w3a-external-back w3ajs-external-back">
                    <img src="${arrowLeftIcon}" alt="">
                    <h6 class="w3a-group__title">Back</h6>
                </button>

                <h6 class="w3a-group__title">EXTERNAL WALLET</h6>
                <div class="w3a-external-group">
                    <div class="w3a-external-group__left">
                        <button class="w3a-button">
                            <img class="w3a-button__image w3a-button__image--left"
                                src="${torusImage}" alt="">
                            Sign in with Torus
                        </button>
                    </div>
                    <div>
                        <button class="w3a-button w3a-button--icon">
                            <img src="${expandIcon}" alt="">
                        </button>
                    </div>
                </div>
                <!-- Other Wallet -->
                <ul class="w3a-adapter-list w3ajs-wallet-adapters"></ul>
            </div>
        </div>
    `);
  };

  private htmlToElement = <T extends Element>(html: string): T => {
    const template = window.document.createElement("template");
    const trimmedHtml = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = trimmedHtml;
    return template.content.firstChild as T;
  };

  private subscribeCoreEvents(listener: SafeEventEmitter) {
    listener.on(BASE_WALLET_EVENTS.CONNECTING, () => {
      this.state.connecting = true;
      this.state.connected = false;
    });
    listener.on(BASE_WALLET_EVENTS.CONNECTED, () => {
      this.state.connecting = false;
      this.state.connected = true;
    });
    listener.on(BASE_WALLET_EVENTS.ERRORED, () => {
      this.state.errored = true;
    });
    listener.on(BASE_WALLET_EVENTS.DISCONNECTED, () => {
      this.state.connecting = false;
      this.state.connected = false;
    });
  }
}