import HardwareWalletInterface from './hardwareWallet-interface';
import {getDerivationPath, paths} from './deterministicWalletPaths';

import * as Utils from 'bbwallet/lib/utils'
import BB_Mnemonic from 'bitcore-mnemonic'

let phrase = '';
let pass = '';

export default class MnemonicWallet extends HardwareWalletInterface {
  constructor(options) {
    super();
    this.identifier = 'Mnemonic';
    this.wallet = null;

    options = options || {};
    this.addressToWalletMap = {};
    this.addressesToIndexMap = {};
    this.walletsRetrieved = [];

    this.id = 0;
    this.hdk = null;
    this.numWallets = 0;

    this.defaultOptions = {
      path: this.getDerivationPath().dpath
    };

    const currentOptions = {
      ...this.defaultOptions,
      ...options
    };

    this.path = currentOptions.path;
    this.accountsLength =
      currentOptions.accountsLength || this.defaultAccountsCount;
    this.accountsOffset =
      currentOptions.accountsOffset || this.defaultAccountsOffset;
    this.networkId = currentOptions.networkId || this.defaultNetworkId;
    this.network = currentOptions.network || this.defaultNetwork;

    this.getAccounts = this.getAccounts.bind(this);
    this.getMultipleAccounts = this.getMultipleAccounts.bind(this);
    // this.signTransaction = this.signTransaction.bind(this);
    // this.signMessage = this.signMessage.bind(this);

    if (options) {
      this.decryptWallet(options);
    }
  }

  // ============== (Start) Expected Utility methods ======================

  setActiveAddress(address) {
    this.wallet = this.addressToWalletMap[address];
    this.wallet.address = address;
  }

  static async unlock(options) {
    try {
      return new MnemonicWallet(options);
    } catch (e) {
      // eslint-disable-next-line
      console.error(e); // todo replace with proper error
      return e;
    }
  }

  get compatibleChains() {
    return paths;
  }

  getDerivationPath(networkShortName) {
    return getDerivationPath(networkShortName);
  }

  // ============== (End) Expected Utility methods ======================

  // ============== (Start) Implementation of required EthereumJs-wallet interface methods =========
  getAddress() {
    if (this.wallet) {
      return this.wallet.address;
    }
    return null;
  }

  getAddressString() {
    if (this.wallet) {
      return this.getAddress();
    }
    return null;
  }

  // ============== (End) Implementation of required EthereumJs-wallet interface methods ===========

  // ============== (Start) Implementation of wallet usage methods ======================
  async getAccounts() {
    const _this = this;
    if (arguments.length > 1) {
      return _this.getMultipleAccounts(arguments[0], arguments[1]);
    }
    return _this._getAccounts();
  }

  async getMultipleAccounts(count, offset) {
    // if the particular wallet does not support multiple accounts this should just return the primary account
    return this._getAccounts(count, offset);
  }

  /*signTransaction(txData) {
    return this.signTxMnemonic(txData);
  }*/

  /*signMessage(msgData) {
    const thisMessage = msgData.data ? msgData.data : msgData;
    return this.signMessageMnemonic(thisMessage);
  }*/

  // ============== (End) Implementation of wallet usage methods ======================

  async changeDerivationPath(path) {
    this.path = path;
    await this.decryptWallet({
      mnemonicPhrase: phrase,
      mnemonicPassword: pass
    });
  }

  // ============== (Start) Internally used methods ======================

  set phrase(mnemonicPhrase) {
    phrase = mnemonicPhrase;
  }

  set password(mnemonicPassword) {
    pass = mnemonicPassword;
  }

  // (Start) Internal setup methods

  decryptWallet(options) {
    try {
      if (!BB_Mnemonic.isValid(options.mnemonicPhrase)) {
        throw new Error('Invalid Mnemonic Supplied');
      }
      this.phrase = options.mnemonicPhrase;
      this.password = options.mnemonicPassword;
      var m = new BB_Mnemonic(options.mnemonicPhrase);
      this.hdk = m.toHDPrivateKey(options.mnemonicPassword, this.network);
      this.setHDAddresses();
    } catch (e) {
      throw  e;
    }
    /*try {
      if (!bip39.validateMnemonic(options.mnemonicPhrase))
        throw new Error('Invalid Mnemonic Supplied');
      this.phrase = options.mnemonicPhrase;
      this.password = options.mnemonicPassword;
      this.hdk = HDKey.fromMasterSeed(
        bip39.mnemonicToSeed(
          options.mnemonicPhrase.trim(),
          options.mnemonicPassword
        )
      );
      this.setHDAddresses();
    } catch (e) {
      throw e;
    }*/
  }

  createWallet(priv, pub, path, hwType, hwTransport) {
    const wallet = {};
    if (typeof priv !== 'undefined') {
      wallet.privKey = priv;
    }
    wallet.pubKey = pub;
    wallet.path = path;
    wallet.hwType = this.identifier;
    wallet.hwTransport = hwTransport;
    wallet.type = this.brand;
    return wallet;
  }

  // (End) Internal setup methods

  AddRemoveHDAddresses(isAdd) {
    if (isAdd)
      this.setHDAddressesHWWallet(this.numWallets, this.accountsLength);
    else
      this.setHDAddressesHWWallet(
        this.numWallets - 2 * this.accountsLength,
        this.accountsLength
      );
  }

  setHDWallet() {
    this.wallet = this.walletsRetrieved[this.id];
    this.wallet.type = 'default';
  }

  // (Start) Internal methods underlying wallet usage methods
  async _getAccounts(count, offset) {
    return new Promise(resolve => {
      const collect = {};
      if (
        this.addressesToIndexMap[offset] &&
        this.addressesToIndexMap[offset + count - 1]
      ) {
        for (let i = offset; i < offset + count; i++) {
          collect[i] = this.addressesToIndexMap[i];
        }
      } else {
        this.setHDAddresses(offset, count);
        for (let i = offset; i < offset + count; i++) {
          collect[i] = this.addressesToIndexMap[i];
        }
      }
      resolve(collect);
    });
  }

  setHDAddresses(start = 0, limit = 5) {
    // TODO: Move to a worker thread
    this.walletsRetrieved = [];
    for (let i = start; i < start + limit; i++) {
      const tempWallet = this.createWallet(
        this.hdk.derive(this.path + '/' + i + "'")
      );
      this.addressToWalletMap[
        this._getAddressForWallet(tempWallet)
        ] = tempWallet;
      this.walletsRetrieved.push(tempWallet);
      this.addressesToIndexMap[i] = this._getAddressForWallet(tempWallet);
      this.walletsRetrieved[this.walletsRetrieved.length - 1].type =
        'addressOnly';
    }
    this.id = 0;
    this.numWallets = start + limit;
  }


  // (End) Internal methods underlying wallet usage methods
  // (Start) Internal utility methods
  _getAddressForWallet(wallet) {
    if (typeof wallet.pubKey === 'undefined') {
      return Utils.privateToAddress(wallet.privKey);
    }
    return Utils.Address(wallet.pubKey);
  }

  // (End) Internal utility methods
  // ============== (End) Internally used methods ======================
}
