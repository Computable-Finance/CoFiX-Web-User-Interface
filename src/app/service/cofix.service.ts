import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import WalletConnectProvider from '@walletconnect/web3-provider';
import BNJS from 'bignumber.js/bignumber';
import { BigNumber, Contract, ethers } from 'ethers';
import { Subscription } from 'rxjs';
import { PermissionsQuery } from 'src/app/state/permission/permission.query';
import { PermissionsService } from 'src/app/state/permission/permission.service';
import { TokensInfoQuery } from 'src/app/state/token/token.query';
import { TokenInfoService } from 'src/app/state/token/token.service';
import {
  environment,
  InfuraApiAccessToken,
  infuraNetwork,
} from 'src/environments/environment';
import {
  BLOCKNUMS_IN_A_DAY,
  ETHER_DECIMALS,
  getContractAddressListByNetwork,
  NETWORKS,
} from '../common/constants';
import { internalTokens, tokenList } from '../common/TokenList';
import { ethersOf, unitsOf } from '../common/uitils/bignumber-utils';
import { BalancesQuery } from '../state/balance/balance.query';
import { BalancesService } from '../state/balance/balance.service';
import { CurrentAccountService } from '../state/current-account/current-account.service';
import { MarketDetailsQuery } from '../state/market/market.query';
import { MarketDetailsService } from '../state/market/market.service';
import { MyTokenQuery } from '../state/mytoken/myToken.query';
import { MyTokenService } from '../state/mytoken/myToken.service';
import { SettingsQuery } from '../state/setting/settings.query';
import { SettingsService } from '../state/setting/settings.service';
import {
  getCoFiStakingRewards,
  getCoFiXDAO,
  getCoFiXControllerContract,
  getCoFixFacory,
  getCoFixPair,
  getCofixRouter,
  getCoFiXStakingRewards,
  getCoFiXVaultForLP,
  getCoFiXVaultForTrader,
  getERC20Contract,
  getOracleContract,
} from './confix.abi';
import { EventBusService } from './eventbus.service';
import {
  executionPriceAndAmountOutByERC202ETHThroughUniswap,
  executionPriceAndAmountOutByETH2ERC20ThroughUniswap,
} from './uni-utils';

declare let window: any;

const CACHE_HALF_AN_HOUR = 60 * 1000 * 30;
const CACHE_ONE_MINUTE = 60 * 1000;
const CACHE_TEN_SECONDS = 10 * 1000;
const CACHE_FIVE_SECONDS = 5 * 1000;

const deadline = () => Math.ceil(Date.now() / 1000) + 60 * 10;

let tokenScriptContent = {};

@Injectable({
  providedIn: 'root',
})
export class CofiXService {
  private provider;
  private currentAccount: string;
  private currentNetwork;
  private contractAddressList: any;

  private integrationSubscription: Subscription;

  private connectType: string;

  constructor(
    private settingsService: SettingsService,
    private eventbusService: EventBusService,
    private tokenInfoService: TokenInfoService,
    private tokenInfoQuery: TokensInfoQuery,
    private permissionsQuery: PermissionsQuery,
    private permissionsService: PermissionsService,
    private balancesService: BalancesService,
    private balancesQuery: BalancesQuery,
    private marketDetailsService: MarketDetailsService,
    private marketDetailsQuery: MarketDetailsQuery,
    private settingsQuery: SettingsQuery,
    private myTokenService: MyTokenService,
    private http: HttpClient,
    private currentAccountService: CurrentAccountService,
    private myTokenQuery: MyTokenQuery
  ) {
    BNJS.config({ EXPONENTIAL_AT: 100, ROUNDING_MODE: BNJS.ROUND_DOWN });
    this.reset();
  }

  internalProvider = window.ethereum;

  providerForListening;

  async isEnabled() {
    if (this.internalProvider === undefined) {
      return false;
    } else {
      const provider = new ethers.providers.Web3Provider(this.internalProvider);
      return (await provider.listAccounts()).length !== 0;
    }
  }

  createWalletConnectProvider(qrcode) {
    return new WalletConnectProvider({
      infuraId: InfuraApiAccessToken,
      chainId: environment.network,
      qrcode,
    });
  }

  async initWalletConnectProvider(silent: boolean) {
    const wcProvider = this.createWalletConnectProvider(!silent);

    await wcProvider.enable().catch((e) => {
      console.error(e);
      wcProvider.close();
      throw new Error('WalletConnect initial fialed.');
    });
    this.setConnectType('wallet-connect');

    return wcProvider;
  }

  async connectSilently() {
    if (await this.isEnabled()) {
      await this.setup(true);
    } else {
      throw new Error('No Account connected to MetaMask.');
    }
  }

  async connectWallet() {
    await this.setup(false);
  }

  setConnectType(type) {
    this.connectType = type;
  }

  isWalletConnect() {
    return this.connectType === 'wallet-connect';
  }

  async disconnectWalletConnect() {
    await this.internalProvider.disconnect();
  }

  async connectWithWalletConnect(silent: boolean) {
    this.internalProvider = await this.initWalletConnectProvider(silent);
    return this.connectSilently();
  }

  private async setup(isEnabled: boolean) {
    if (environment.e2e.on) {
      this.updateCurrentAccount(this.getSigner().address);
      this.contractAddressList = getContractAddressListByNetwork(
        this.currentNetwork
      );
      this.trackingBlockchain();
      return;
    }

    if (this.internalProvider === undefined) {
      throw new Error('Non-Ethereum browser detected. Install MetaMask.');
    }

    this.provider = new ethers.providers.Web3Provider(this.internalProvider);

    if (!isEnabled) {
      await this.showConfirmModalIfNeeded();
      this.updateCurrentAccountIfNeeded(
        await this.internalProvider.request({
          method: 'eth_requestAccounts',
        })
      );
    } else {
      await this.showConfirmModalIfNeeded();
      this.updateCurrentAccount((await this.provider.listAccounts())[0]);
    }
    this.currentNetwork = (await this.provider.getNetwork()).chainId;
    this.contractAddressList = getContractAddressListByNetwork(
      this.currentNetwork
    );

    if (
      this.settingsQuery.metamaskDisconnectedByUser() &&
      !this.isWalletConnect()
    ) {
      this.settingsService.updateMetamaskDisconnectedByUser(false);
    }

    this.registerWeb3EventHandler();
    this.trackingBlockchain();
  }

  private async showConfirmModalIfNeeded() {
    if (
      this.settingsQuery.metamaskDisconnectedByUser() &&
      !this.isWalletConnect()
    ) {
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [
          {
            eth_accounts: {},
          },
        ],
      });
    }
  }

  private updateCurrentAccount(address: string) {
    this.currentAccount = address;
    if (address === undefined) {
      this.currentAccountService.reset();
    } else {
      this.currentAccountService.update(address);
    }
  }

  private registerWeb3EventHandler() {
    this.internalProvider
      .on('disconnect', (result) => {
        // reference: https://docs.metamask.io/guide/ethereum-provider.html#disconnect
        location.reload();
      })
      .on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          location.reload();
        }

        if (this.updateCurrentAccountIfNeeded(accounts)) {
          this.eventbusService.emit({ name: 'connection_changed' });
        }
      })
      .on('chainChanged', (chainId) => {
        // reference: https://github.com/ethers-io/ethers.js/issues/589
        location.reload();
      });
  }

  getCurrentProvider() {
    return this.provider;
  }

  // an infura provider used when wallect is not connected
  // with this provider, pages can get all public information, such as changePrice
  private defaultProvider() {
    return new ethers.providers.InfuraProvider(
      infuraNetwork,
      InfuraApiAccessToken
    );
  }

  getCurrentNetwork() {
    return this.currentNetwork;
  }

  getCurrentNetworkName() {
    const network = NETWORKS.filter(
      (el) => el.id === Number(this.currentNetwork)
    );
    if (network) {
      return network[0]?.name;
    } else {
      throw new Error('Unknown Network!');
    }
  }

  getCurrentAccount() {
    return this.currentAccount;
  }

  getCurrentContractAddressList() {
    return this.contractAddressList;
  }

  async getERC20Allowance(address: string, spender: string) {
    const contract = getERC20Contract(address, this.provider);
    const allowance = await contract.allowance(this.currentAccount, spender);
    return allowance;
  }

  // ?????????????????????????????????????????????
  // undefined ?????? ETH
  // 1 eth -> n erc20 ???changePrice(undefined, toToken)
  // 1 erc20 -> n eth ???changePrice(fromToken, undefined)
  // 1 erc20 -> n erc20 ???changePrice(fromToken, toToken)
  async changePrice(fromToken: string, toToken: string) {
    if (!this.provider) {
      return;
    }

    let result1 = new BNJS(1);
    let result2 = new BNJS(1);
    if (toToken !== undefined) {
      // ETH > ERC20
      // p * (1-k) * (1-theta)
      const kinfo = await this.getKInfo(toToken);
      const price = await this.checkPriceNow(toToken);
      result1 = new BNJS(price.changePrice)
        .times(new BNJS(1).minus(kinfo.k))
        .times(new BNJS(1).minus(kinfo.theta));
    }

    if (fromToken !== undefined) {
      // ERC20 > ETH
      // (1-theta) / (p * (1+k))
      const kinfo = await this.getKInfo(fromToken);
      const price = await this.checkPriceNow(fromToken);
      result2 = new BNJS(1)
        .minus(kinfo.theta)
        .div(new BNJS(price.changePrice).times(new BNJS(1).plus(kinfo.k)));
    }

    const result = result1.times(result2);
    return result.toString();
  }

  // ????????????????????????????????????????????????k ??? theta
  // ??????????????????
  async nestPrice(fromToken: string, toToken: string) {
    if (
      !this.provider ||
      (fromToken && !this.isCoFixToken(fromToken)) ||
      (toToken && !this.isCoFixToken(toToken))
    ) {
      return;
    }

    let result1 = new BNJS(1);
    let result2 = new BNJS(1);
    if (toToken !== undefined) {
      const price = await this.checkPriceNow(toToken);
      result1 = new BNJS(price.changePrice);
    }

    if (fromToken !== undefined) {
      const price = await this.checkPriceNow(fromToken);
      result2 = new BNJS(1).div(new BNJS(price.changePrice));
    }
    const result = result1.times(result2);
    return result.toString();
  }

  // ???????????????????????????????????????????????????amount ??? fromToken ?????????
  async executionPriceAndExpectedCofi(
    fromToken: string,
    toToken: string,
    amount: string
  ) {
    if (!this.provider) {
      return;
    }

    let excutionPrice1 = new BNJS(1);
    const expectedCofi = [];
    let excutionPrice2 = new BNJS(1);

    let innerAmount = amount;

    if (fromToken !== undefined) {
      if (this.isCoFixToken(fromToken)) {
        excutionPrice1 = await this.executionPriceByERC202ETH(
          fromToken,
          innerAmount
        );
        innerAmount = excutionPrice1.times(amount).toString();
        expectedCofi.push(
          this.expectedCoFi(fromToken, innerAmount, amount, false)
        );
      } else {
        const result =
          await executionPriceAndAmountOutByERC202ETHThroughUniswap(
            {
              network: this.currentNetwork,
              address: fromToken,
              decimals: Number(await this.getERC20Decimals(fromToken)),
            },
            innerAmount,
            this.provider
          );
        excutionPrice1 = new BNJS(result.excutionPrice);
        innerAmount = result.amountOut;
      }
    }

    if (toToken !== undefined && innerAmount !== '0') {
      if (this.isCoFixToken(toToken)) {
        excutionPrice2 = await this.executionPriceByETH2ERC20(
          toToken,
          innerAmount
        );
        const ethAmount = innerAmount;
        innerAmount = excutionPrice2.times(innerAmount).toString();
        expectedCofi.push(
          this.expectedCoFi(toToken, ethAmount, innerAmount, true)
        );
      } else {
        const result =
          await executionPriceAndAmountOutByETH2ERC20ThroughUniswap(
            {
              network: this.currentNetwork,
              address: toToken,
              decimals: Number(await this.getERC20Decimals(toToken)),
            },
            innerAmount,
            this.provider
          );
        excutionPrice2 = new BNJS(result.excutionPrice);
        innerAmount = result.amountOut;
      }
    }

    console.log(
      `========= executionPriceByETH2ERC20 =============
excutionPrice1 = ${excutionPrice1}, excutionPrice2 = ${excutionPrice2}
========= executionPriceByETH2ERC20 =============`
    );
    const excutionPrice = excutionPrice1.times(excutionPrice2).toString();
    const amountOut = innerAmount;

    return {
      excutionPrice,
      amountOut,
      expectedCofi,
    };
  }

  private async executionPriceByETH2ERC20(token: string, amount: string) {
    const kinfo = await this.getKInfo(token);
    const price = await this.checkPriceNow(token);
    const valx = new BNJS(amount);

    let c;
    if (valx.lt(500)) {
      c = 0;
    } else {
      const gamma =
        token.toUpperCase() === this.contractAddressList.NEST.toUpperCase()
          ? 20
          : 1;
      c = new BNJS('-1.171e-4')
        .plus(new BNJS('8.386e-7').times(amount))
        .times(gamma);
    }
    console.log(
      `========= executionPriceByETH2ERC20 =============
kinfo = ${JSON.stringify(kinfo)}
triggeredPriceInfo = ${JSON.stringify(price)}
C = ${c}
========= executionPriceByETH2ERC20 =============`
    );

    const excutionPrice = new BNJS(price.changePrice)
      .times(new BNJS(1).minus(new BNJS(kinfo.k).plus(c)))
      .times(new BNJS(1).minus(kinfo.theta));

    return excutionPrice;
  }

  private async executionPriceByERC202ETH(token: string, amount: string) {
    const kinfo = await this.getKInfo(token);
    const price = await this.checkPriceNow(token);
    const valx = new BNJS(amount).div(new BNJS(price.changePrice));

    let c;
    if (valx.lt(500)) {
      c = 0;
    } else {
      const gamma =
        token.toUpperCase() === this.contractAddressList.NEST.toUpperCase()
          ? 20
          : 1;
      c = new BNJS('2.57e-5')
        .plus(new BNJS('8.542e-7').times(amount))
        .times(gamma);
    }

    const excutionPrice = new BNJS(1)
      .minus(kinfo.theta)
      .div(
        new BNJS(price.changePrice).times(
          new BNJS(1).plus(new BNJS(kinfo.k).plus(c))
        )
      );

    return excutionPrice;
  }

  private async expectedCoFi(
    token: string,
    ethAmount: string,
    erc20Amount: string,
    isEth2Erc20: boolean
  ) {
    if (!this.isCoFixToken(token)) {
      return;
    }

    const pairAddress = await this.getPairAddressByToken(token);
    const trader = getCoFiXVaultForTrader(
      this.contractAddressList.CoFiXVaultForTrader,
      this.provider
    );

    let reserve0 = new BNJS(
      await this.getERC20BalanceOfPair(
        token,
        this.getCurrentContractAddressList().WETH9
      )
    );

    let reserve1 = new BNJS(
      await this.getERC20BalanceOfPair(
        token,
        this.getCurrentContractAddressList().WETH9
      )
    );

    const prices = await this.checkPriceNow(token);

    let actualMiningAmount;
    if (isEth2Erc20) {
      reserve1 = reserve1.minus(erc20Amount);
      actualMiningAmount = await trader.actualMiningAmount(
        pairAddress,
        this.parseEthers(reserve0.plus(ethAmount).toString()),
        this.parseUnits(
          reserve1.isLessThan('0') ? '0' : reserve1.toString(),
          await this.getERC20Decimals(token)
        ),
        this.parseEthers(prices.ethAmount),
        this.parseUnits(prices.erc20Amount, await this.getERC20Decimals(token))
      );
    } else {
      reserve0 = reserve0.minus(ethAmount);
      actualMiningAmount = await trader.actualMiningAmount(
        pairAddress,
        this.parseEthers(reserve0.isLessThan('0') ? '0' : reserve0.toString()),
        this.parseUnits(
          reserve1.plus(erc20Amount).toString(),
          await this.getERC20Decimals(token)
        ),
        this.parseEthers(prices.ethAmount),
        this.parseUnits(prices.erc20Amount, await this.getERC20Decimals(token))
      );
    }

    const value = new BNJS(ethersOf(actualMiningAmount[0])).times(0.9);
    return value;
  }

  // ?????????????????????????????????????????????????????????????????????????????????????????????????????????
  // ??????: {
  //   calculateAssetRatio1(?????????): {k0:xx, k1:xx, offset:xx, calculateAssetRatio:xx},
  //   calculateAssetRatio2(?????????): {k0:xx, k1:xx, offset:xx, calculateAssetRatio:xx},
  // }
  async getTradeAssetRatio(fromToken: string, toToken: string, amount: string) {
    // tradeAssetRatio1 -> fromToken => ETH ???????????????????????????tradeAssetRatio2 -> ETH => toToken ????????????????????????
    const tradeAssetRatio: { [k: string]: any } = {};
    let innerAmount = amount;
    let excutionPrice1 = new BNJS(1);
    let excutionPrice2 = new BNJS(1);

    if (fromToken !== undefined) {
      if (this.isCoFixToken(fromToken)) {
        excutionPrice1 = await this.executionPriceByERC202ETH(
          fromToken,
          innerAmount
        );
        innerAmount = excutionPrice1.times(amount).toString();
        const calculateAssetRatio1 =
          await this.calculateAssetRatioBetweenETHAndERC20(
            fromToken,
            innerAmount,
            amount,
            false
          );
        tradeAssetRatio.calculateAssetRatio1 = calculateAssetRatio1;
      }
    }

    if (toToken !== undefined && innerAmount !== '0') {
      if (this.isCoFixToken(toToken)) {
        excutionPrice2 = await this.executionPriceByETH2ERC20(
          toToken,
          innerAmount
        );
        const ethAmount = innerAmount;
        innerAmount = excutionPrice2.times(innerAmount).toString();
        const calculateAssetRatio2 =
          await this.calculateAssetRatioBetweenETHAndERC20(
            toToken,
            ethAmount,
            innerAmount,
            true
          );
        tradeAssetRatio.calculateAssetRatio2 = calculateAssetRatio2;
      }
    }

    return tradeAssetRatio;
  }

  // ???????????? ETH <--> ERC20 ???????????????
  // ??????:
  // ???????????? k0 ??????????????? getInitialAssetRatio() ????????????
  // ???????????? k1 ??????????????? getReserves() ????????????
  // ?????????: | (k1 - k0) / k0 |
  // ?????????????????????: (reserve0 +- ethAmount) / (reserve1 -+ erc20Amount)
  private async calculateAssetRatioBetweenETHAndERC20(
    token: string,
    ethAmount: string,
    erc20Amount: string,
    isEth2Erc20: boolean
  ) {
    if (!this.isCoFixToken(token)) {
      return;
    }
    const initialAssetRatio = await this.getInitialAssetRatio(token);
    const initialEthAmount = initialAssetRatio.ethAmount;
    const initialErc20Amount = initialAssetRatio.erc20Amount;
    const reserves = await this.getReserves(token);
    const reserve0 = reserves.reserve0;
    const reserve1 = reserves.reserve1;

    const k0 = new BNJS(initialEthAmount).div(new BNJS(initialErc20Amount));
    const k1 = new BNJS(reserve0).div(new BNJS(reserve1));
    const offset = k1.minus(k0).div(k0).abs();
    const calculateAssetRatio = isEth2Erc20
      ? new BNJS(reserve0)
          .minus(new BNJS(ethAmount))
          .div(new BNJS(reserve1).plus(new BNJS(erc20Amount)))
      : new BNJS(reserve0)
          .plus(new BNJS(ethAmount))
          .div(new BNJS(reserve1).minus(new BNJS(erc20Amount)));

    console.log(`k0 = ${k0}`);
    console.log(`k1 = ${k1}`);
    console.log(`offset = ${offset}`);
    console.log(`calculateAssetRatio = ${calculateAssetRatio}`);

    return {
      k0: k0.toString(),
      k1: k1.toString(),
      offset: offset.toString(),
      calculateAssetRatio: calculateAssetRatio.toString(),
    };
  }

  async expectedXToken(address: string, ethAmount: string) {
    const checkedPriceNow = await this.checkPriceNow(address);
    const oraclePrice = [
      this.parseEthers(checkedPriceNow.ethAmount),
      this.parseUnits(
        checkedPriceNow.erc20Amount,
        await this.getERC20Decimals(address)
      ),
      '0',
      '0',
      '0',
    ];
    const pair = getCoFixPair(
      await this.getPairAddressByToken(address),
      this.provider
    );
    const expectedShare = ethersOf(
      await pair.getLiquidity(this.parseEthers(ethAmount), oraclePrice)
    );

    return expectedShare;
  }

  // ?????? getETHAmountForRemoveLiquidity ??? getTokenAmountForRemoveLiquidity ???????????????
  // removeERC20 = false????????? getETHAmountForRemoveLiquidity
  // removeERC20 = true????????? getTokenAmountForRemoveLiquidity
  // ?????????kinfo???checkedPriceNow???nAVPerShareForBurn?????????????????????
  async calculateArgumentsUsedByGetAmountRemoveLiquidity(
    token: string,
    pair: string,
    amount: string,
    removeERC20: boolean = false
  ) {
    const kinfo = await this.getKInfo(token);
    const checkedPriceNow = await this.checkPriceNow(token);
    const coFiXPair = getCoFixPair(pair, this.provider);
    const navPerShare = await this.getNavPerShare(token);

    const tradingVolumeInETH = new BNJS(amount).times(navPerShare);

    const k = new BNJS(kinfo.k);
    let cB: BNJS.Value;
    let cS: BNJS.Value = 0;
    if (tradingVolumeInETH.lt(500)) {
      cB = cS = 0;
    } else {
      cB = new BNJS(0.0000257).plus(
        new BNJS(0.0000008542).times(tradingVolumeInETH)
      );
      if (removeERC20) {
        cS = new BNJS(-0.0001171).plus(
          new BNJS(0.0000008386).times(tradingVolumeInETH)
        );
      }
    }

    const oraclePrice = [
      this.parseEthers(checkedPriceNow.ethAmount),
      this.parseUnits(
        checkedPriceNow.erc20Amount,
        await this.getERC20Decimals(token)
      ),
      '0',
      this.parseUnits(k.plus(cB).toString(), 8),
      '0',
    ];
    const nAVPerShareForBurn = ethersOf(
      await coFiXPair.getNAVPerShareForBurn(oraclePrice)
    );

    return { kinfo, checkedPriceNow, nAVPerShareForBurn, cB, cS };
  }

  async getETHAmountForRemoveLiquidity(
    token: string,
    pair: string,
    amount: string
  ) {
    const args = await this.calculateArgumentsUsedByGetAmountRemoveLiquidity(
      token,
      pair,
      amount,
      false
    );

    const result = new BNJS(amount)
      .times(args.nAVPerShareForBurn)
      .times(new BNJS(1).minus(args.kinfo.theta))
      .toString();

    return { nAVPerShareForBurn: args.nAVPerShareForBurn, result };
  }

  async getTokenAmountForRemoveLiquidity(
    token: string,
    pair: string,
    amount: string
  ) {
    const args = await this.calculateArgumentsUsedByGetAmountRemoveLiquidity(
      token,
      pair,
      amount,
      true
    );

    const result = new BNJS(amount)
      .times(args.nAVPerShareForBurn)
      .times(args.checkedPriceNow.changePrice)
      .times(new BNJS(1).minus(new BNJS(args.kinfo.k).plus(args.cS)))
      .times(new BNJS(1).minus(args.kinfo.theta))
      .toString();

    return { nAVPerShareForBurn: args.nAVPerShareForBurn, result };
  }

  async getETHAndTokenForRemoveLiquidity(
    token: string,
    pair: string,
    amount: string
  ) {
    const kinfo = await this.getKInfo(token);
    const checkedPriceNow = await this.checkPriceNow(token);
    const coFiXPair = getCoFixPair(pair, this.provider);

    const oraclePrice = [
      this.parseEthers(checkedPriceNow.ethAmount),
      this.parseUnits(
        checkedPriceNow.erc20Amount,
        await this.getERC20Decimals(token)
      ),
      '0',
      '0',
      kinfo.thetaOriginal,
    ];
    const result = await coFiXPair.calcOutTokenAndETHForBurn(
      this.parseEthers(amount),
      oraclePrice
    );

    const erc20Amount = unitsOf(result[0], await this.getERC20Decimals(token));
    const ethAmount = ethersOf(result[1]);
    const fee = ethersOf(result[1]);
    const nAVPerShareForBurn = ethersOf(
      await coFiXPair.getNAVPerShareForBurn(oraclePrice)
    );

    return { erc20Amount, ethAmount, fee, nAVPerShareForBurn };
  }

  unitsOf(amount: BigNumber, decimals: BigNumber) {
    return Number.parseFloat(ethers.utils.formatUnits(amount, decimals));
  }

  ethersOf(amount: BigNumber) {
    return Number.parseFloat(ethers.utils.formatEther(amount));
  }

  private reset() {
    tokenScriptContent = {};
    this.integrationSubscription?.unsubscribe();
    this.untrackingBlockchain();
    this.provider = this.defaultProvider();
    this.updateCurrentAccount(undefined);
    this.currentNetwork = environment.network;
    this.contractAddressList = getContractAddressListByNetwork(
      this.currentNetwork
    );
    this.internalProvider = window.ethereum;
  }

  // ??????????????????????????????
  async pairAttended(token: string) {
    const pair = await this.getPairAddressByToken(token);
    const xtBalance = await this.getERC20Balance(pair);
    if (!new BNJS(xtBalance).isZero()) {
      return true;
    }

    const stakingPool = await this.getStakingPoolAddressByToken(token);
    const stakingBalance = await this.getERC20Balance(stakingPool);
    return !new BNJS(stakingBalance).isZero();
  }

  private updateCurrentAccountIfNeeded(accounts) {
    if (accounts[0]?.toUpperCase() !== this.currentAccount?.toUpperCase()) {
      this.updateCurrentAccount(accounts[0]);
      return true;
    }

    return false;
  }

  async redeemCoFi(amount: string) {
    const contract = getCoFiXDAO(
      this.contractAddressList.CoFiXDAO,
      this.provider
    );
    return this.redeem(contract, this.contractAddressList.CoFiToken, amount);
  }

  // ?????? ETH ??????
  async withdrawEarnedETH() {
    const contract = getCoFiStakingRewards(
      this.contractAddressList.CoFiStakingRewards,
      this.provider
    );
    return await this.executeContractMethodWithEstimatedGas(
      contract,
      'getReward',
      [{}]
    );
  }

  // ?????? CoFi ??????
  async withdrawEarnedCoFi(
    stakingPoolAddress: string,
    staking: boolean = false
  ) {
    const contract = getCoFiXStakingRewards(stakingPoolAddress, this.provider);
    if (staking) {
      return await this.executeContractMethodWithEstimatedGas(
        contract,
        'getRewardAndStake',
        [{}]
      );
    } else {
      return await this.executeContractMethodWithEstimatedGas(
        contract,
        'getReward',
        [{}]
      );
    }
  }

  async withdrawDepositedCoFi(amount: string) {
    const contract = getCoFiStakingRewards(
      this.contractAddressList.CoFiStakingRewards,
      this.provider
    );
    return await this.withdraw(contract, amount);
  }

  async depositCoFi(amount: string) {
    const contract = getCoFiStakingRewards(
      this.contractAddressList.CoFiStakingRewards,
      this.provider
    );
    return this.deposit(contract, this.contractAddressList.CoFiToken, amount);
  }

  async withdrawDepositedXToken(stakingPoolAddress: string, amount: string) {
    const contract = getCoFiXStakingRewards(stakingPoolAddress, this.provider);
    return await this.withdraw(contract, amount);
  }

  async depositXToken(
    stakingPoolAddress: string,
    pairAddress: string,
    amount: string
  ) {
    const contract = getCoFiXStakingRewards(stakingPoolAddress, this.provider);
    return this.deposit(contract, pairAddress, amount);
  }

  private async withdraw(contract: Contract, amount: string) {
    const balance = await contract.balanceOf(this.currentAccount);
    const value = this.parseEthers(amount);
    if (balance.lt(value)) {
      throw new Error('Insufficient Balance.');
    } else {
      return await this.executeContractMethodWithEstimatedGas(
        contract,
        'withdraw',
        [value, {}]
      );
    }
  }

  private async deposit(contract: Contract, token: string, amount: string) {
    const allowance = await this.getERC20Allowance(token, contract.address);
    const balance = await this.getERC20Balance(token);
    const value = this.parseEthers(amount);
    if (allowance.lt(value)) {
      throw new Error('Insufficient Allowance.');
    } else if (new BNJS(balance).lt(amount)) {
      throw new Error('Insufficient Balance.');
    } else {
      return await this.executeContractMethodWithEstimatedGas(
        contract,
        'stake',
        [value, {}]
      );
    }
  }

  private async redeem(contract: Contract, token: string, amount: string) {
    const allowance = await this.getERC20Allowance(token, contract.address);
    const balance = await this.getERC20Balance(token);
    const value = this.parseEthers(amount);
    if (allowance.lt(value)) {
      throw new Error('Insufficient Allowance.');
    } else if (new BNJS(balance).lt(amount)) {
      throw new Error('Insufficient Balance.');
    } else {
      return await this.executeContractMethodWithEstimatedGas(
        contract,
        'redeem',
        [value, {value: this.parseEthers('0.01')}]
      );
    }
  }


  private parseUnits(amount: string, unit: number) {
    const bnAmount = new BNJS(amount);
    try {
      return ethers.utils.parseUnits(bnAmount.toFixed(unit), unit);
    } catch (e) {
      return BigNumber.from(bnAmount.times(Math.pow(10, unit)).toFixed(0));
    }
  }

  parseEthers(amount: string) {
    return this.parseUnits(amount, ETHER_DECIMALS);
  }

  // ?????????
  // ?????? eth ????????? value = eth + fee????????????????????????????????? eth ???
  // amountOutMin ????????????????????????????????????????????????????????????????????? changePrice ??????????????????
  // ????????? ui ????????? amountOutMin ???????????? changePrice ??????????????????????????????
  async swapExactETHForTokens(
    pair: string,
    token: string,
    amountIn: string,
    amountOutMin: string,
    swapPrice: string,
    fee: string,
    DEX_TYPE: number[]
  ) {
    const ethBalanceOfAccount = new BNJS(await this.getETHBalance());
    const bnValue = new BNJS(amountIn).plus(fee);
    if (bnValue.gt(ethBalanceOfAccount)) {
      throw new Error('Insufficient ETH balance.');
    }

    const erc20Decimals = await this.getERC20Decimals(token);
    if (this.isCoFixToken(token)) {
      const erc20Contract = getERC20Contract(token, this.provider);
      const erc20BalanceOfPair = new BNJS(
        unitsOf(await erc20Contract.balanceOf(pair), erc20Decimals)
      );
      if (new BNJS(amountOutMin).gt(erc20BalanceOfPair)) {
        throw new Error('Insufficient tokens for swapping.');
      }
    }

    const cofixRouter = getCofixRouter(
      this.contractAddressList.CofixRouter,
      this.provider
    );
    return this.executeContractMethodWithEstimatedGas(
      cofixRouter,
      'hybridSwapExactETHForTokens',
      [
        this.parseEthers(amountIn),
        this.parseUnits(
          new BNJS(amountIn).times(swapPrice).times(0.99).toString(),
          erc20Decimals
        ),
        [this.contractAddressList.WETH9, token],
        DEX_TYPE,
        this.currentAccount,
        this.currentAccount,
        deadline(),
        {
          value: this.parseEthers(bnValue.toString()),
        },
      ]
    );
  }

  // ?????? token ??????
  async swapExactTokensForETH(
    pair: string,
    token: string,
    amountIn: string,
    amountOutMin: string,
    swapPrice: string,
    fee: string,
    DEX_TYPE: number[]
  ) {
    const erc20Decimals = await this.getERC20Decimals(token);
    const erc20BalanceOfAccount = await this.getERC20Balance(token);

    if (new BNJS(amountIn).gt(erc20BalanceOfAccount)) {
      throw new Error('Insufficient token balance.');
    }

    if (this.isCoFixToken(token)) {
      const wethContract = getERC20Contract(
        this.contractAddressList.WETH9,
        this.provider
      );
      const wethBalanceOfPair = ethersOf(await wethContract.balanceOf(pair));
      if (new BNJS(amountOutMin).gt(wethBalanceOfPair)) {
        throw new Error('Insufficient eth for swapping.');
      }
    }
    const cofixRouter = getCofixRouter(
      this.contractAddressList.CofixRouter,
      this.provider
    );
    return this.executeContractMethodWithEstimatedGas(
      cofixRouter,
      'hybridSwapExactTokensForETH',
      [
        this.parseUnits(amountIn, erc20Decimals),
        this.parseEthers(
          new BNJS(amountIn).times(swapPrice).times(0.99).toString()
        ),
        [token, this.contractAddressList.WETH9],
        DEX_TYPE,
        this.currentAccount,
        this.currentAccount,
        deadline(),
        {
          value: this.parseEthers(fee),
        },
      ]
    );
  }

  // ERC20 -> ERC20 = ERC20 -> ETH -> ERC20
  // ???????????? tokenIn ??????????????? weth??????????????????
  async swapExactTokensForTokens(
    pairIn: string,
    tokenIn: string,
    pairOut: string,
    tokenOut: string,
    amountIn: string,
    amountOutMin: string,
    swapPrice: string,
    fee: string,
    DEX_TYPE: number[]
  ) {
    if (
      !(await this.hasEnoughTokenBalance(
        this.currentAccount,
        tokenIn,
        amountIn
      ))
    ) {
      throw new Error('Insufficient token balance.');
    }
    if (this.isCoFixToken(tokenIn) && this.isCoFixToken(tokenOut)) {
      if (
        !(await this.hasEnoughTokenBalance(pairOut, tokenOut, amountOutMin))
      ) {
        throw new Error('Insufficient token for swapping.');
      }
      const kinfo = await this.getKInfo(tokenIn);
      const price = await this.checkPriceNow(tokenIn);
      const wethAmount = new BNJS(amountIn).div(
        new BNJS(price.changePrice)
          .times(new BNJS(1).plus(kinfo.k))
          .times(new BNJS(1).minus(kinfo.theta))
      );
      if (
        !(await this.hasEnoughTokenBalance(
          pairIn,
          this.contractAddressList.WETH9,
          wethAmount.toString()
        ))
      ) {
        throw new Error('Insufficient weth for swapping.');
      }
    }

    const cofixRouter = getCofixRouter(
      this.contractAddressList.CofixRouter,
      this.provider
    );
    return this.executeContractMethodWithEstimatedGas(
      cofixRouter,
      'hybridSwapExactTokensForTokens',
      [
        this.parseUnits(amountIn, await this.getERC20Decimals(tokenIn)),
        this.parseUnits(
          new BNJS(amountIn)
            .times(swapPrice)
            .times(0.99)
            .times(0.99)
            .toString(),
          await this.getERC20Decimals(tokenOut)
        ),
        [tokenIn, this.contractAddressList.WETH9, tokenOut],
        DEX_TYPE,
        this.currentAccount,
        this.currentAccount,
        deadline(),
        {
          value: this.parseEthers(fee),
        },
      ]
    );
  }

  async hasEnoughTokenBalance(address: string, token: string, amount: string) {
    const contract = getERC20Contract(token, this.provider);
    const decimals = await this.getERC20Decimals(token);
    const balance = new BNJS(
      unitsOf(await contract.balanceOf(address), decimals)
    );
    return balance.gte(amount);
  }

  async hasEnoughETHBalance(amount: string) {
    const balance = new BNJS(await this.getETHBalance());
    return balance.gt(amount);
  }

  async hasEnoughAllowance(spender: string, token: string, amount: string) {
    const contract = getERC20Contract(token, this.provider);
    const decimals = await this.getERC20Decimals(token);
    const allowance = new BNJS(
      unitsOf(await contract.allowance(this.currentAccount, spender), decimals)
    );
    return allowance.gt(amount);
  }

  async addLiquidity(
    token: string,
    amountETH: string,
    amountToken: string,
    liquidityMin: string,
    fee: string,
    staking: boolean = false
  ) {
    const bnAmountETH = new BNJS(amountETH);
    const bnAmountToken = new BNJS(amountToken);
    if (bnAmountETH.isZero() && bnAmountToken.isZero()) {
      return;
    }

    if (bnAmountETH.gt(0) && !(await this.hasEnoughETHBalance(amountETH))) {
      throw new Error('Insufficient ETH balance.');
    }

    if (
      bnAmountToken.gt(0) &&
      !(await this.hasEnoughTokenBalance(
        this.currentAccount,
        token,
        amountToken
      ))
    ) {
      throw new Error('Insufficient token balance.');
    }

    if (
      bnAmountToken.gt(0) &&
      !(await this.hasEnoughAllowance(
        this.contractAddressList.CofixRouter,
        token,
        amountToken
      ))
    ) {
      throw new Error('Insufficient allowance for this token.');
    }

    const decimals = await this.getERC20Decimals(token);
    const cofixRouter = getCofixRouter(
      this.contractAddressList.CofixRouter,
      this.provider
    );
    if (staking) {
      return await this.executeContractMethodWithEstimatedGas(
        cofixRouter,
        'addLiquidityAndStake',
        [
          token,
          this.parseEthers(amountETH),
          this.parseUnits(amountToken, decimals),
          this.parseEthers(new BNJS(liquidityMin).times(0.99).toString()),
          this.currentAccount,
          deadline(),
          {
            value: this.parseEthers(new BNJS(amountETH).plus(fee).toString()),
          },
        ]
      );
    } else {
      return await this.executeContractMethodWithEstimatedGas(
        cofixRouter,
        'addLiquidity',
        [
          token,
          this.parseEthers(amountETH),
          this.parseUnits(amountToken, decimals),
          this.parseEthers(new BNJS(liquidityMin).times(0.99).toString()),
          this.currentAccount,
          deadline(),
          {
            value: this.parseEthers(new BNJS(amountETH).plus(fee).toString()),
          },
        ]
      );
    }
  }

  async removeLiquidityGetETH(
    pair: string,
    token: string,
    liquidityMin: string,
    amountETHMin: string,
    fee: string
  ) {
    if (
      !(await this.hasEnoughTokenBalance(
        this.currentAccount,
        pair,
        liquidityMin
      ))
    ) {
      throw new Error('Insufficient liquidity tokens.');
    }

    if (
      !(await this.hasEnoughTokenBalance(
        pair,
        this.contractAddressList.WETH9,
        amountETHMin
      ))
    ) {
      throw new Error('Insufficient WETH9 tokens.');
    }

    const cofixRouter = getCofixRouter(
      this.contractAddressList.CofixRouter,
      this.provider
    );
    return await this.executeContractMethodWithEstimatedGas(
      cofixRouter,
      'removeLiquidityGetETH',
      [
        token,
        this.parseEthers(liquidityMin),
        this.parseEthers(new BNJS(amountETHMin).times(0.99).toString()),
        this.currentAccount,
        deadline(),
        {
          value: this.parseEthers(fee),
        },
      ]
    );
  }

  async removeLiquidityGetTokenAndETH(
    pair: string,
    token: string,
    liquidityMin: string,
    amountETHMin: string,
    amountTokenMin: string,
    fee: string
  ) {
    if (
      !(await this.hasEnoughTokenBalance(
        this.currentAccount,
        pair,
        liquidityMin
      ))
    ) {
      throw new Error('Insufficient liquidity tokens.');
    }

    if (
      !(await this.hasEnoughTokenBalance(
        pair,
        this.contractAddressList.WETH9,
        amountETHMin
      ))
    ) {
      throw new Error('Insufficient WETH tokens.');
    }

    if (!(await this.hasEnoughTokenBalance(pair, token, amountTokenMin))) {
      throw new Error('Insufficient token balance.');
    }

    const cofixRouter = getCofixRouter(
      this.contractAddressList.CofixRouter,
      this.provider
    );
    return await this.executeContractMethodWithEstimatedGas(
      cofixRouter,
      'removeLiquidityGetTokenAndETH',
      [
        token,
        this.parseEthers(liquidityMin),
        this.parseEthers(new BNJS(amountETHMin).times(0.99).toString()),
        this.currentAccount,
        deadline(),
        {
          value: this.parseEthers(fee),
        },
      ]
    );
  }

  async removeLiquidityGetToken(
    pair: string,
    token: string,
    liquidityMin: string,
    amountTokenMin: string,
    fee: string
  ) {
    if (
      !(await this.hasEnoughTokenBalance(
        this.currentAccount,
        pair,
        liquidityMin
      ))
    ) {
      throw new Error('Insufficient liquidity tokens.');
    }

    if (!(await this.hasEnoughTokenBalance(pair, token, amountTokenMin))) {
      throw new Error('Insufficient token balance.');
    }

    const decimals = await this.getERC20Decimals(token);
    const cofixRouter = getCofixRouter(
      this.contractAddressList.CofixRouter,
      this.provider
    );

    return await this.executeContractMethodWithEstimatedGas(
      cofixRouter,
      'removeLiquidityGetToken',
      [
        token,
        this.parseEthers(liquidityMin),
        this.parseUnits(
          new BNJS(amountTokenMin).times(0.99).toString(),
          decimals
        ),
        this.currentAccount,
        deadline(),
        {
          value: this.parseEthers(fee),
        },
      ]
    );
  }

  // for written contract methods only
  private async executeContractMethodWithEstimatedGas(
    contract: Contract,
    functionName: string,
    args: any
  ) {
    const estimatedGas = new BNJS(
      ethersOf(
        await contract.estimateGas[functionName](...args)
          .then((value) => {
            const minimumGas = BigNumber.from('300000');
            if (value.lt(minimumGas)) {
              return minimumGas;
            }
            return value;
          })
          .catch((err) => {
            return BigNumber.from('700000');
          })
      )
    );
    const argsForOverridden = args.pop();
    argsForOverridden.gasLimit = this.parseEthers(
      estimatedGas.times(1.2).toString()
    );
    args.push(argsForOverridden);
    return contract.connect(this.getSigner())[functionName](...args);
  }

  private getSigner() {
    if (environment.e2e.on) {
      const pk = environment.e2e.wallet;
      return new ethers.Wallet(pk, this.provider);
    }

    return this.provider.getSigner();
  }

  // pair ??? token ?????????targetToken ????????? pair ???????????? token ????????????
  // ?????? ETH???targetToken ??? WETH9 ??????
  async getERC20BalanceOfPair(token: string, targetToken: string) {
    const pair = await this.getPairAddressByToken(token);
    const erc20Contract = getERC20Contract(targetToken, this.provider);
    const amount = new BNJS(
      unitsOf(
        await erc20Contract.balanceOf(pair),
        await this.getERC20Decimals(targetToken)
      )
    ).toString();

    return amount;
  }

  async currentGasFee() {
    const price = await this.http
      .get('https://ethgasstation.info/json/ethgasAPI.json')
      .toPromise<any>();

    return new BNJS(700000)
      .times(new BNJS(price.fastest).div(10))
      .div(1000000000)
      .toString();
  }

  async currentCoFiPrice() {
    const price = await this.http
      .get(
        'https://api.coingecko.com/api/v3/simple/price?ids=cofix&vs_currencies=usd'
      )
      .toPromise<any>();

    return price.cofix.usd;
  }

  // --------- TokenInfo Methods ------------ //

  async getERC20Decimals(tokenAddress: string) {
    const targetToken = tokenList(this.currentNetwork).find(
      (token) => token.address === tokenAddress
    );

    if (targetToken) {
      return targetToken.decimals.toString();
    }

    const decimals = this.tokenInfoQuery.getDecimals(tokenAddress);
    if (!decimals) {
      const contract = getERC20Contract(tokenAddress, this.provider);
      let result;
      try {
        result = await contract.decimals();
      } catch (e) {
        // ??????????????? balanceOf ????????? decimals ???????????????????????????????????? erc20
        // ?????????????????????????????????????????????
        result = '18';
      }
      this.tokenInfoService.updateTokenInfo(tokenAddress, {
        decimals: result,
      });
      return this.tokenInfoQuery.getDecimals(tokenAddress);
    }
    return decimals;
  }

  async getPairAddressByToken(tokenAddress: string) {
    const pairAddress = this.tokenInfoQuery.getPairAddress(tokenAddress);
    if (!pairAddress) {
      const factory = getCoFixFacory(
        this.contractAddressList.CofixFactory,
        this.provider
      );
      this.tokenInfoService.updateTokenInfo(tokenAddress, {
        pairAddress: await factory.getPair(tokenAddress),
      });
      return this.tokenInfoQuery.getPairAddress(tokenAddress);
    }
    return pairAddress;
  }

  async getStakingPoolAddressByToken(tokenAddress: string) {
    const stakingPoolAddress =
      this.tokenInfoQuery.getStakingPoolAddress(tokenAddress);
    if (!stakingPoolAddress) {
      const coFiXVaultForLP = getCoFiXVaultForLP(
        this.contractAddressList.CoFiXVaultForLP,
        this.provider
      );

      const pairAddress = await this.getPairAddressByToken(tokenAddress);
      if (pairAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('invalid invocation!!!!!');
      }

      this.tokenInfoService.updateTokenInfo(tokenAddress, {
        stakingPoolAddress: await coFiXVaultForLP.stakingPoolForPair(
          await this.getPairAddressByToken(tokenAddress)
        ),
      });
      return this.tokenInfoQuery.getStakingPoolAddress(tokenAddress);
    }
    return stakingPoolAddress;
  }

  // --------- Permissions Methods ------------ //

  // token???spender ??????
  // ?????????????????????????????????????????????token???CofixRouter
  // ????????????????????????pair, CofixRouter
  // CoFi???pair???stakingPool
  // ?????????CoFiToken???CoFiStakingRewards
  async approved(token: string, spender: string) {
    const result = this.permissionsQuery.approved(
      this.currentAccount,
      token,
      spender
    );

    // result === false has two possibilities:
    // 1. a new browser which has not approved histories of current account.
    // 2. never got approved
    if (!result) {
      const allowance = await this.getERC20Allowance(token, spender);
      if (!allowance.isZero()) {
        this.permissionsService.updatePermission(
          this.currentAccount,
          token,
          spender
        );
        return true;
      } else {
        return false;
      }
    }

    return result;
  }

  // ?????????????????????????????????????????????????????????
  // token???spender ??????
  async approve(token: string, spender: string) {
    const contract = getERC20Contract(token, this.provider);
    return await contract
      .connect(this.getSigner())
      .approve(spender, BigNumber.from('9999999999999999999999999999'));
  }

  // --------- Tracking Balances  ------------ //

  private getBalancesByAccount(account: string) {
    return this.balancesQuery.getBalancesByAccount(account);
  }

  private getCurrentBalances() {
    return this.getBalancesByAccount(this.currentAccount);
  }

  private async trackingBlockchain() {
    if (this.provider) {
      this.providerForListening = new ethers.providers.InfuraProvider(
        this.currentNetwork === 1 ? 'homestead' : 'ropsten',
        InfuraApiAccessToken
      );

      if (this.currentAccount) {
        await this.updateETHBalance();
        await this.updateDividend();
        this.providerForListening.on('block', async (blockNum) => {
          console.log('updating ...');

          await this.updateETHBalance();
          await this.updateDividend();
          this.updateERC20Balances();
          this.updateUnclaimedCofis();
          this.updateMarketDetails();
        });
      } else {
        this.providerForListening.on('block', async (blockNum) => {
          console.log('updating ...');

          this.updateMarketDetails();
        });
      }
    }
  }

  private untrackingBlockchain() {
    if (this.provider) {
      this.providerForListening.off('block');
    }
  }

  private async updateETHBalance() {
    this.balancesService.updateEthBalance(
      this.currentAccount,
      ethersOf(await this.provider.getBalance(this.currentAccount))
    );
  }

  private async updateDividend() {
    this.balancesService.updateDividend(
      this.currentAccount,
      ethersOf(
        await getCoFiStakingRewards(
          this.contractAddressList.CoFiStakingRewards,
          this.provider
        ).earned(this.currentAccount)
      )
    );
  }

  private async updateUnclaimedCofi(address: string) {
    const coFiXStakingRewards = getCoFiXStakingRewards(
      await this.getStakingPoolAddressByToken(address),
      this.provider
    );
    const earned = ethersOf(
      await coFiXStakingRewards.earned(this.currentAccount)
    );

    const unclaimedCoFi = {};
    unclaimedCoFi[address] = earned;
    this.balancesService.updateUnclaimedCoFi(
      this.currentAccount,
      unclaimedCoFi
    );
  }

  private updateUnclaimedCofis() {
    if (this.getCurrentBalances()?.unclaimedCoFis) {
      Object.keys(this.getCurrentBalances().unclaimedCoFis).forEach(
        async (address) => await this.updateUnclaimedCofi(address)
      );
    }
  }

  private async updateERC20Balance(address: string) {
    const contract = getERC20Contract(address, this.provider);
    const balance = await contract.balanceOf(this.currentAccount);
    let decimals = this.tokenInfoQuery.getDecimals(address);
    if (!decimals) {
      try {
        decimals = await contract.decimals();
      } catch (e) {
        // ??????????????? balanceOf ????????? decimals ???????????????????????????????????? erc20
        // ?????????????????????????????????????????????
        decimals = '18';
      }
    }
    const erc20Balance = {};
    erc20Balance[address] = unitsOf(balance, decimals);
    this.balancesService.updateERC20Balance(this.currentAccount, erc20Balance);
  }

  private updateERC20Balances() {
    if (this.getCurrentBalances()?.erc20Balances) {
      Object.keys(this.getCurrentBalances().erc20Balances).forEach(
        async (address) => await this.updateERC20Balance(address)
      );
    }
  }

  async getETHBalance() {
    const balance = this.getCurrentBalances()?.ethBalance;
    if (!balance) {
      await this.updateETHBalance();
      return this.getCurrentBalances().ethBalance;
    }
    return balance;
  }

  // ?????? ERC20 Token
  // ????????? Cofi???CoFiToken
  // ????????? Cofi???CoFiStakingRewards
  // ??????????????? XT????????????????????? pair ?????????this.getPairAddressByToken(token)
  // ??????????????? XT??????????????????????????? stakingPool ?????????this.getStakingPoolAddressByToken(pair)
  async getERC20Balance(address: string) {
    const balance = this.getCurrentBalances()?.erc20Balances?.[address];
    if (!balance) {
      await this.updateERC20Balance(address);
      return this.getCurrentBalances().erc20Balances[address];
    }
    return balance;
  }

  // ?????????getERC20Balance???Token???????????????
  async getERC20BalanceForSelect(address: string, decimals: any) {
    const contract = getERC20Contract(address, this.provider);
    const balance = await contract.balanceOf(this.currentAccount);
    return unitsOf(balance, decimals);
  }

  async earnedCofiAndRewardRate(address: string) {
    let earned = '0';
    if (this.currentAccount) {
      earned = this.getCurrentBalances()?.unclaimedCoFis?.[address];
      if (!earned) {
        await this.updateUnclaimedCofi(address);
        earned = this.getCurrentBalances().unclaimedCoFis[address];
      }
    }

    let rewardRate = await this.getRewardRate(address);
    if (!rewardRate) {
      await this.updateRewardRate(address);
      rewardRate = await this.getRewardRate(address);
    }

    return { earned, rewardRate };
  }

  async earnedETH() {
    const dividend = this.getCurrentBalances()?.dividend;
    if (!dividend) {
      await this.updateDividend();
      return this.getCurrentBalances().dividend;
    }
    return dividend;
  }

  private updateMarketDetails() {
    Object.keys(this.marketDetailsQuery.getValue()).forEach(async (address) => {
      if (!this.isCoFixToken(address)) {
        return;
      }

      await this.updateKInfo(address);
      await this.updateCheckedPriceNow(address);
      await this.updateNAVPerShare(address);
      await this.updateRewardRate(address);
      await this.updateInitialAssetRatio(address);
    });
  }

  private async updateKInfo(address: string) {
    let kinfo;
    let latestK = '';

    if (tokenScriptContent[address]?.LiquidityPoolShare?.kInfoK) {
      kinfo = [0, 0, 0];
      kinfo[0] = tokenScriptContent[address].LiquidityPoolShare.kInfoK;
      kinfo[2] = tokenScriptContent[address].LiquidityPoolShare.kInfoTheta;
    } else {
      kinfo = await getCoFiXControllerContract(
        this.contractAddressList.CofiXController,
        this.provider
      ).getKInfo(address);

      const latestPrice = await this.checkPriceNow(address);
      latestK = await getCoFiXControllerContract(
        this.contractAddressList.CofiXController,
        this.provider
      ).calcK(latestPrice.vola, latestPrice.bn);

      console.log(
        `vola: ${latestPrice.vola}`,
        `bn: ${latestPrice.bn}`,
        `latestK: ${latestK}`
      );
    }

    this.marketDetailsService.updateMarketDetails(address, {
      kinfo: {
        kOriginal: latestK,
        k: new BNJS(latestK).div(1e8).toString(),
        theta: new BNJS(kinfo[2]).div(1e8).toString(),
        thetaOriginal: kinfo[2],
      },
    });
  }

  private async getKInfo(address: string) {
    let kinfo = this.marketDetailsQuery.getKInfo(address);
    if (!kinfo) {
      await this.updateKInfo(address);
      kinfo = this.marketDetailsQuery.getKInfo(address);
    }
    return kinfo;
  }

  private async updateCheckedPriceNow(tokenAddress: string) {
    let ethAmount: string;
    let erc20Amount: string;
    let changePrice: string;
    let vola;
    let bn;
    const decimals = await this.getERC20Decimals(tokenAddress);

    if (
      tokenScriptContent[tokenAddress]?.LiquidityPoolShare
        ?.referenceExchangeRateEthAmount
    ) {
      const price = [0, 0];
      price[0] =
        tokenScriptContent[
          tokenAddress
        ].LiquidityPoolShare.referenceExchangeRateEthAmount;
      price[1] =
        tokenScriptContent[
          tokenAddress
        ].LiquidityPoolShare.referenceExchangeRateErc20Amount;
      ethAmount = ethersOf(price[0]);
      erc20Amount = unitsOf(price[1], decimals);
      changePrice = new BNJS(erc20Amount).div(new BNJS(ethAmount)).toString();
    } else {
      const oracle = getOracleContract(
        this.contractAddressList.OracleMock,
        this.provider
      );

      // returns (uint latestPriceBlockNumber, uint latestPriceValue, uint triggeredPriceBlockNumber, uint triggeredPriceValue, uint triggeredAvgPrice, uint triggeredSigmaSQ)
      const triggeredPriceInfo = await oracle.latestPriceAndTriggeredPriceInfo(
        tokenAddress
      );
      console.log(`triggeredPriceInfo = ${triggeredPriceInfo}`);
      bn = triggeredPriceInfo[0];
      ethAmount = '1';
      erc20Amount = unitsOf(triggeredPriceInfo[1], decimals);
      changePrice = erc20Amount;
      // ??????????????????sigmaSQ???????????????????????????
      vola = triggeredPriceInfo[5];
    }

    console.log(
      `tokenAddress = ${tokenAddress},\
      ethAmount = ${ethAmount},\
      erc20Amount = ${erc20Amount},\
      changePrice = ${changePrice},\
      vola = ${vola},\
      bn = ${bn}`
    );

    this.marketDetailsService.updateMarketDetails(tokenAddress, {
      checkedPriceNow: {
        ethAmount,
        erc20Amount,
        changePrice,
        vola,
        bn,
      },
    });
  }

  private async checkPriceNow(address: string) {
    let checkedPriceNow = this.marketDetailsQuery.getCheckedPriceNow(address);
    if (!checkedPriceNow) {
      await this.updateCheckedPriceNow(address);
      checkedPriceNow = this.marketDetailsQuery.getCheckedPriceNow(address);
    }

    return checkedPriceNow;
  }

  private async updateNAVPerShare(address: string) {
    let navPerShare;
    if (tokenScriptContent[address]?.LiquidityPoolShare?.navPerShare) {
      navPerShare = ethersOf(
        tokenScriptContent[address]?.LiquidityPoolShare?.navPerShare
      );
    } else {
      const checkedPriceNow = await this.checkPriceNow(address);
      const pairAddress = await this.getPairAddressByToken(address);

      if (pairAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('invalid invocation!!!!!');
      }
      const coFiXPair = getCoFixPair(pairAddress, this.provider);
      navPerShare = ethersOf(
        await coFiXPair.getNAVPerShare(
          this.parseEthers(checkedPriceNow.ethAmount),
          this.parseUnits(
            checkedPriceNow.erc20Amount,
            await this.getERC20Decimals(address)
          )
        )
      );
    }

    this.marketDetailsService.updateMarketDetails(address, {
      navPerShare,
    });
  }

  private async getNavPerShare(address: string) {
    const navPerShare = this.marketDetailsQuery.getNavPerShare(address);
    if (!navPerShare) {
      await this.updateNAVPerShare(address);
      return this.marketDetailsQuery.getNavPerShare(address);
    }
    return navPerShare;
  }

  private async updateRewardRate(address: string) {
    let miningRate;
    if (tokenScriptContent[address]?.MiningPoolShare?.cofiMiningRate) {
      miningRate = tokenScriptContent[address].MiningPoolShare.cofiMiningRate;
    } else {
      const coFiXStakingRewards = getCoFiXStakingRewards(
        await this.getStakingPoolAddressByToken(address),
        this.provider
      );
      miningRate = await coFiXStakingRewards.rewardRate();
    }

    const rewardRate = new BNJS(ethersOf(miningRate))
      .times(BLOCKNUMS_IN_A_DAY)
      .toString();
    this.marketDetailsService.updateMarketDetails(address, { rewardRate });
  }

  private async getRewardRate(address: string) {
    const rewardRate = this.marketDetailsQuery.getRewardRate(address);
    if (!rewardRate) {
      await this.updateRewardRate(address);
      return this.marketDetailsQuery.getRewardRate(address);
    }
    return rewardRate;
  }

  private async updateInitialAssetRatio(address: string) {
    const pairAddress = await this.getPairAddressByToken(address);
    if (pairAddress === '0x0000000000000000000000000000000000000000') {
      throw new Error('invalid invocation!!!!!');
    }

    const coFiXPair = getCoFixPair(pairAddress, this.provider);
    const initialAssetRatio = await coFiXPair.getInitialAssetRatio();
    const ethAmount = ethersOf(initialAssetRatio[0]);
    const erc20Amount = unitsOf(
      initialAssetRatio[1],
      await this.getERC20Decimals(address)
    );

    console.log('initialRatio', ethAmount, erc20Amount);

    this.marketDetailsService.updateMarketDetails(address, {
      initialAssetRatio: {
        ethAmount,
        erc20Amount,
      },
    });
  }

  async getInitialAssetRatio(address: string) {
    let initialAssetRatio =
      this.marketDetailsQuery.getInitialAssetRatio(address);
    if (!initialAssetRatio) {
      await this.updateInitialAssetRatio(address);
      initialAssetRatio = this.marketDetailsQuery.getInitialAssetRatio(address);
    }
    return initialAssetRatio;
  }

  private async updateReserves(address: string) {
    const pairAddress = await this.getPairAddressByToken(address);
    if (pairAddress === '0x0000000000000000000000000000000000000000') {
      throw new Error('invalid invocation!!!!!');
    }

    const coFiXPair = getCoFixPair(pairAddress, this.provider);
    const reserves = await coFiXPair.getReserves();
    const erc20Decimals = await this.getERC20Decimals(address);
    const readableReserve0 = ethersOf(reserves[0]);
    const readableReserve1 = unitsOf(reserves[1], erc20Decimals);

    console.log('reserves', readableReserve0, readableReserve1, address);

    this.marketDetailsService.updateMarketDetails(address, {
      reserves: {
        reserve0: readableReserve0,
        reserve1: readableReserve1,
      },
    });
    return reserves;
  }

  async getReserves(address: string) {
    let reserves = this.marketDetailsQuery.getReserves(address);
    if (!reserves) {
      await this.updateReserves(address);
      reserves = this.marketDetailsQuery.getReserves(address);
    }
    return reserves;
  }

  async calcETHAmountForStaking(address: string, erc20Amount: string) {
    const initialAssetRatio = await this.getInitialAssetRatio(address);
    return new BNJS(initialAssetRatio.ethAmount)
      .times(erc20Amount)
      .div(initialAssetRatio.erc20Amount)
      .toString();
  }

  async calcERC20AmountForStaking(address: string, ethAmount: string) {
    const initialAssetRatio = await this.getInitialAssetRatio(address);
    return new BNJS(initialAssetRatio.erc20Amount)
      .times(ethAmount)
      .div(initialAssetRatio.ethAmount)
      .toString();
  }

  async isValidRatio(address: string, ethAmount: string, erc20Amount: string) {
    const initialAssetRatio = await this.getInitialAssetRatio(address);
    return new BNJS(initialAssetRatio.erc20Amount)
      .times(ethAmount)
      .eq(new BNJS(initialAssetRatio.ethAmount).times(erc20Amount));
  }

  async totalETHFromSwapFees() {
    const cofiStakingRewards = getCoFiStakingRewards(
      this.contractAddressList.CoFiToken,
      this.provider
    );

    return new BNJS(ethersOf(await cofiStakingRewards.totalSupply()))
      .toString();
  }

  async quotaOfCofi() {
    const cofiXDAO = getCoFiXDAO(
      this.contractAddressList.CoFiXDAO,
      this.provider
    );

    return new BNJS(ethersOf(await cofiXDAO.quotaOf()))
      .toString();
  }

  async totalETHRewards() {
    const cofiXDAO = getCoFiXDAO(
      this.contractAddressList.CoFiXDAO,
      this.provider
    );
    return new BNJS(ethersOf(await cofiXDAO.totalETHRewards()))
      .toString();
  }

  async getCofiBalanceofContract(address: any) {
    const cofiContract = getERC20Contract(
      this.contractAddressList.CoFiToken,
      this.provider
    );
    return new BNJS(ethersOf(await cofiContract.balanceOf(address)))
      .toString();
  }

  async getOraclePrice(address: any) {
    const oracle = getOracleContract(
      this.contractAddressList.OracleMock,
      this.provider
    );
    const triggeredPriceInfo = await oracle.latestPriceAndTriggeredPriceInfo(
      address
    );
    return triggeredPriceInfo.latestPriceValue
  }

  async totalETHInDividendPool() {
    const wethContract = getERC20Contract(
      this.contractAddressList.WETH9,
      this.provider
    );
    const ethOfDividendPool = ethersOf(
      await wethContract.balanceOf(this.contractAddressList.CoFiStakingRewards)
    );

    const cofiStakingRewards = getCoFiStakingRewards(
      this.contractAddressList.CoFiStakingRewards,
      this.provider
    );
    const pendingSavingAmount = ethersOf(
      await cofiStakingRewards.pendingSavingAmount()
    );

    return new BNJS(ethOfDividendPool).minus(pendingSavingAmount).toString();
  }

  async shareInDividendPool() {
    const balance = await this.getERC20Balance(
      this.contractAddressList.CoFiStakingRewards
    );

    const cofiStakingRewards = getCoFiStakingRewards(
      this.contractAddressList.CoFiStakingRewards,
      this.provider
    );
    const totalSupply = ethersOf(await cofiStakingRewards.totalSupply());
    const result = new BNJS(balance).div(totalSupply).times(100).toString();

    return result;
  }

  getETHTotalClaimed() {
    if (tokenScriptContent['DividendPoolShare']?.ethTotalClaimed) {
      return ethersOf(tokenScriptContent['DividendPoolShare'].ethTotalClaimed);
    }
  }

  isCoFixToken(token: string): boolean {
    return (
      token?.toUpperCase() === this.contractAddressList.USDT.toUpperCase() ||
      token?.toUpperCase() === this.contractAddressList.HBTC.toUpperCase() ||
      token?.toUpperCase() === this.contractAddressList.NEST.toUpperCase()
    );
  }

  async loadToken(token: string) {
    try {
      const existToken = this.getExistToken(token);

      if (!existToken) {
        const contract = getERC20Contract(token, this.provider);
        let symbol = await contract.symbol();
        if (!symbol) {
          symbol = `Unknown Token${this.getUnknownTokenIndex()}`;
        }

        return this.myTokenService.add(
          this.currentNetwork,
          token,
          symbol,
          await contract.decimals()
        );
      } else {
        return existToken;
      }
    } catch (e) {
      console.error(e);
      return undefined;
    }
  }

  async loadSwapToken(token: string) {
    const existToken = this.getExistMyToken(token);
    if (!existToken) {
      const contract = getERC20Contract(token, this.provider);
      let symbol = await contract.symbol();

      this.myTokenService.add(
        this.currentNetwork,
        token,
        symbol,
        await contract.decimals()
      );
    }
  }

  getExistMyToken(address: string) {
    return this.myTokenQuery
      .getAll()
      .filter((token) => token.chainId === environment.network)
      .find((token) => token.address === address);
  }

  getExistTokenInInteralTokens(address: string) {
    return internalTokens
      .filter((token) => token.chainId === environment.network)
      .find((token) => token.address === address);
  }

  getUnknownTokenIndex() {
    return (
      tokenList(this.currentNetwork).filter(
        (token) => token.symbol.indexOf('Unknown') > -1
      ).length + 1
    );
  }

  getExistToken(address: string) {
    return tokenList(this.currentNetwork).find(
      (token) => token.address === address
    );
  }
}
