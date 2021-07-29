import BigNumber from 'bignumber.js'
import { BigNumberish } from 'ethers'
import API from '.'
import Contract, { ContractProps } from './Contract'
import { formatNumber, toBigNumber } from '../util'
import { TokenETH } from 'src/components/Icon'

export type TokenProps = ContractProps & {
  symbol: string
  Icon: typeof TokenETH
  decimals?: number
  formatPrecision?: number
  isXToken?: boolean
}

export type SwapInfo = {
  oracleValuePerETH: BigNumber
  oracleETHValue: BigNumber
  oracleETHAmount: BigNumber

  finalValuePerETH: BigNumber
  finalETHValue: BigNumber
  finalETHAmount: BigNumber

  vol: BigNumber
  ethVol: BigNumber
  k: BigNumber
  c: BigNumber
}

abstract class Token extends Contract {
  symbol: TokenProps['symbol']
  Icon: TokenProps['Icon']
  decimals: number
  formatPrecision: TokenProps['formatPrecision']
  isXToken: boolean
  cofiAmountPerBlock?: number

  constructor(api: API, props: TokenProps) {
    super(api, props)

    this.symbol = props.symbol
    this.Icon = props.Icon
    this.decimals = props.decimals || 18
    this.formatPrecision = props.formatPrecision
    this.isXToken = !!props.isXToken
  }

  amount(n: BigNumber | BigNumberish) {
    return toBigNumber(n).shiftedBy(-this.decimals)
  }

  parse(n: BigNumber | BigNumberish) {
    return toBigNumber(n).shiftedBy(this.decimals)
  }

  format(n: BigNumber | BigNumberish) {
    return formatNumber(n, this.decimals, this.formatPrecision)
  }

  async getETHValue() {
    const value = await this.getValuePerETH()
    if (!value || value.isZero()) {
      return new BigNumber(0)
    }

    return this.parse(this.api.Tokens.ETH.parse(1).div(value))
  }

  async getETHAmount() {
    const value = await this.getETHValue()
    if (!value || value.isZero()) {
      return new BigNumber(0)
    }

    return this.api.Tokens.ETH.amount(value)
  }

  async getUSDTValue() {
    const value = await this.getValuePerUSDT()
    if (!value || value.isZero()) {
      return new BigNumber(0)
    }

    return this.parse(this.api.Tokens.USDT.parse(1).div(value))
  }

  async getUSDTAmount() {
    const value = await this.getUSDTValue()
    if (!value || value.isZero()) {
      return new BigNumber(0)
    }

    return this.api.Tokens.USDT.amount(value)
  }

  async queryOracle() {
    if (this.symbol === 'ETH') {
      return {
        k: toBigNumber(0),
        tokenAmount: toBigNumber(1),
      }
    }

    if (!this.address || !this.api.Contracts.NestPriceFacade.contract || !this.api.Contracts.CoFiXController.contract) {
      return {
        k: toBigNumber(0),
        tokenAmount: this.amount(await this.getValuePerETH()),
      }
    }

    try {
      const priceInfo = await this.api.Contracts.NestPriceFacade.contract.lastPriceListAndTriggeredPriceInfo(
        this.address,
        2
      )

      const k = await this.api.Contracts.CoFiXController.contract.calcRevisedK(
        priceInfo.triggeredSigmaSQ,
        priceInfo.prices[3],
        priceInfo.prices[2],
        priceInfo.prices[1],
        priceInfo.prices[0]
      )

      return {
        k: toBigNumber(k).shiftedBy(-18),
        tokenAmount: this.amount(priceInfo.prices[1]),
      }
    } catch (e) {
      return {
        k: toBigNumber(0),
        tokenAmount: this.amount(await this.getValuePerETH()),
      }
    }
  }

  async getSwapInfo(vol?: BigNumberish | BigNumber): Promise<SwapInfo> {
    let oracleValuePerETH = new BigNumber(0)
    let k = new BigNumber(0)

    // FIX token price with P'b = P * (1 + K + C)
    if (
      this.symbol !== 'ETH' &&
      this.address &&
      this.api.Contracts.NestPriceFacade.contract &&
      this.api.Contracts.CoFiXController.contract
    ) {
      const priceInfo = await this.api.Contracts.NestPriceFacade.contract.lastPriceListAndTriggeredPriceInfo(
        this.address,
        2
      )

      oracleValuePerETH = toBigNumber(priceInfo.prices[1])
      if (oracleValuePerETH.isZero()) {
        oracleValuePerETH = (await this.getValuePerETH()) || this.parse(1)
      }
      const kinfo = await this.api.Contracts.CoFiXController.contract.calcRevisedK(
        priceInfo.triggeredSigmaSQ,
        priceInfo.prices[3],
        priceInfo.prices[2],
        priceInfo.prices[1],
        priceInfo.prices[0]
      )
      k = new BigNumber(kinfo.toString()).shiftedBy(-18)
    } else {
      oracleValuePerETH = this.api.Tokens.ETH.parse(1)
      k = new BigNumber(0)
    }

    vol = toBigNumber(vol || 0)
    const oneETH = this.api.Tokens.ETH.parse(1)
    const ethVol = this.api.Tokens.ETH.amount(vol.multipliedBy(oneETH.div(oracleValuePerETH)))
    const c = ethVol.lt(500) ? new BigNumber(0) : ethVol.multipliedBy(0.000002).plus(0).multipliedBy(1)

    const oracleETHValue = oracleValuePerETH.isZero() ? toBigNumber(0) : this.parse(oneETH.div(oracleValuePerETH))
    const oracleETHAmount = this.api.Tokens.ETH.amount(oracleETHValue)

    const finalValuePerETH = this.parse(this.amount(oracleValuePerETH).multipliedBy(new BigNumber(1).plus(k).plus(c)))
    const finalETHValue = this.parse(oneETH.div(finalValuePerETH))
    const finalETHAmount = this.api.Tokens.ETH.amount(finalETHValue)

    return {
      oracleValuePerETH,
      oracleETHValue,
      oracleETHAmount,

      finalValuePerETH,
      finalETHValue,
      finalETHAmount,

      vol,
      ethVol,
      k,
      c,
    }
  }

  abstract balanceOf(address: string): Promise<BigNumber>
  abstract totalSupply(): Promise<BigNumber>
  abstract getValuePerETH(): Promise<BigNumber>
  abstract getValuePerUSDT(): Promise<BigNumber>
  abstract allowance(spender: string): Promise<boolean>
  abstract approve(spender: string): Promise<any>
}

export default Token
