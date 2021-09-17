import BigNumber from 'bignumber.js'
import { BigNumberish } from 'ethers'
import { CoFiXPair as TypeCoFiXPair, CoFiXPair__factory } from 'src/abis/types/cofix'
import { TIME_TO_NEXT_BLOCK } from 'src/constants/parameter'

import API from '.'
import { BLOCK_DAILY } from '../constants/constant'
import {formatETH, formatUSDT, toBigNumber} from '../util'
import ERC20Token, { ERC20TokenProps } from './ERC20Token'
import Token from './Token'
import {USDT, WETH} from "../constants/tokens";

export type PoolInfo = {
  totalFunds: BigNumber
  amounts: Array<BigNumber>
  formatAmounts: Array<string>
  nav: BigNumber
  miningSpeed: number
  apr: string

  emptyLiquidity: boolean
  myPoolRatio: string
  myPoolAmounts: Array<string>
  xtokenTotalSupply: {
    value: BigNumber
    amount: BigNumber
    formatAmount: string
  }
  xtokenBalance: {
    value: BigNumber
    amount: BigNumber
    formatAmount: string
  }
}

export type StakeInfo = {
  xTokenInPool: {
    value: BigNumber
    amount: BigNumber
    formatAmount: string
  }
  dailyMined: BigNumber
  stakedXToken: {
    value: BigNumber
    amount: BigNumber
    formatAmount: string
  }
  stakedRatio: string
}

export type CoFiXPairProps = ERC20TokenProps & {
  pair: [string, string]

  cofiAmountPerBlock: number
  cofiRewardPercentage: number
}

class CoFiXPair extends ERC20Token {
  contract?: TypeCoFiXPair

  pair: [Token, Token]
  cofiAmountPerBlock: number
  cofiRewardPercentage: number

  poolInfo?: PoolInfo
  stakeInfo?: StakeInfo

  theta = toBigNumber(20)
  impactCostVOL = toBigNumber(1)
  nt = toBigNumber(3000)

  constructor(api: API, props: CoFiXPairProps) {
    super(api, {
      isXToken: true,
      ...props,
    })

    if (this.address && this.api.provider) {
      this.contract = CoFiXPair__factory.connect(this.address, this.api.provider?.getSigner() || this.api.provider)
    }

    this.pair = [api.Tokens[props.pair[0]], api.Tokens[props.pair[1]]]
    this.cofiAmountPerBlock = props.cofiAmountPerBlock
    this.cofiRewardPercentage = props.cofiRewardPercentage
    this.api.Tokens[this.symbol] = this
  }

  async init() {
    super.init()

    if (!this.contract) {
      return
    }

    const [config, channelInfo] = await Promise.all([
      this.contract.getConfig(),
      this.api.Contracts.CoFiXVaultForStaking.contract?.getChannelInfo(this.address || ''),
    ])
    this.theta = toBigNumber(config.theta)
    this.impactCostVOL = toBigNumber(config.impactCostVOL)
    this.nt = toBigNumber(config.nt)

    if (channelInfo?.cofiPerBlock) {
      this.cofiAmountPerBlock = this.api.Tokens.COFI.amount(channelInfo?.cofiPerBlock).toNumber()
    }
  }

  async getPoolInfo(): Promise<PoolInfo | undefined> {
    if (!this.address || !this.contract) {
      return
    }

    const tokens = [this.api.Tokens[this.pair[0].symbol], this.api.Tokens[this.pair[1].symbol]]

    const [balances, ethAmounts, usdtAmounts, cofiUSDTAmount, pairBalance, pairTotalSupply, vaultBalance] =
      await Promise.all([
        Promise.all([this.contract.ethBalance(), tokens[1].balanceOf(this.address)]),
        Promise.all([tokens[0].getValuePerETH(), tokens[1].getValuePerETH()]),
        Promise.all([tokens[0].getUSDTAmount(), tokens[1].getUSDTAmount()]),
        this.api.Tokens.COFI.getUSDTAmount(),

        this.balanceOf(this.api.account || ''),
        this.totalSupply(),

        this.api.Contracts.CoFiXVaultForStaking.balanceOf(this.address, this.api.account || ''),
      ])

    const amounts = [tokens[0].amount(balances[0] || 0), tokens[1].amount(balances[1] || 0)]
    const formatAmounts = [
      tokens[0].format(tokens[0].amount(balances[0] || 0)),
      tokens[1].format(tokens[1].amount(balances[1] || 0)),
    ]

    if (!ethAmounts[0] || !ethAmounts[1] || !usdtAmounts[0] || !usdtAmounts[1] || !cofiUSDTAmount) {
      return
    }

    const totalFunds = amounts[0].multipliedBy(usdtAmounts[0]).plus(amounts[1].multipliedBy(usdtAmounts[1]))

    let nav = new BigNumber(1)
    if (!totalFunds.isZero()) {
      const navPerShare = await this.contract.getNAVPerShare(ethAmounts[0].toFixed(0), ethAmounts[1].toFixed(0))

      nav = new BigNumber(navPerShare.toString()).div(new BigNumber(10).pow(18))
    }

    let apr = '--'
    if (!totalFunds.isZero()) {
      apr =
        toBigNumber(this.cofiAmountPerBlock)
          .multipliedBy(cofiUSDTAmount)
          .multipliedBy(60 * 60 * 24)
          .div(TIME_TO_NEXT_BLOCK)
          .div(totalFunds)
          .multipliedBy(365)
          .multipliedBy(100)
          .toFixed(2) + '%'
    }

    let myPoolRatio = new BigNumber(0)
    let myPoolAmounts = ['0.0', '0.0']
    if (!pairTotalSupply.isZero()) {
      myPoolRatio = pairBalance.plus(vaultBalance).div(pairTotalSupply)

      myPoolAmounts = [
        tokens[0].format(amounts[0].multipliedBy(myPoolRatio)),
        tokens[1].format(amounts[1].multipliedBy(myPoolRatio)),
      ]
    }

    this.poolInfo = {
      totalFunds,
      amounts,
      formatAmounts,
      nav,
      miningSpeed: toBigNumber(this.cofiAmountPerBlock).toNumber(),
      apr,

      emptyLiquidity: myPoolRatio.isZero(),
      myPoolRatio: `${myPoolRatio.multipliedBy(100).toFixed(2)} %`,
      myPoolAmounts,
      xtokenBalance: {
        value: pairBalance,
        amount: pairBalance.div(new BigNumber(10).pow(18)),
        formatAmount: pairBalance.div(new BigNumber(10).pow(18)).toString(),
      },
      xtokenTotalSupply: {
        value: pairTotalSupply,
        amount: pairTotalSupply.div(new BigNumber(10).pow(18)),
        formatAmount: pairTotalSupply.div(new BigNumber(10).pow(18)).toString(),
      },
    }

    return this.poolInfo
  }

  async getPoolRatio() {
    if (!this.contract) {
      return
    }

    const value = await this.contract.getInitialAssetRatio()

    const token0 = this.api.Tokens[this.pair[0].symbol]
    const token1 = this.api.Tokens[this.pair[1].symbol]

    return token1.amount(token1.parse(value.initToken1Amount)).div(token0.amount(token1.parse(value.initToken0Amount)))
  }

  async getStakeInfo() {
    const info: Partial<StakeInfo> = {}
    if (!this.address || !this.api.account) {
      return
    }

    const [xTokenInPool, stakedXToken] = await Promise.all([
      this.balanceOf(this.api.Contracts.CoFiXVaultForStaking.address || ''),
      this.api.Contracts.CoFiXVaultForStaking.balanceOf(this.address, this.api.account),
    ])
    info.dailyMined = toBigNumber(this.cofiAmountPerBlock).multipliedBy(BLOCK_DAILY)
    info.stakedRatio = '--'
    if (!xTokenInPool.isZero()) {
      info.stakedRatio = `${stakedXToken.div(xTokenInPool).multipliedBy(100).toFixed(2)} %`
    }

    info.xTokenInPool = {
      value: xTokenInPool,
      amount: xTokenInPool.shiftedBy(-18),
      formatAmount: toBigNumber(xTokenInPool.shiftedBy(-18).toFixed(4)).toFormat(4),
    }
    info.stakedXToken = {
      value: stakedXToken,
      amount: stakedXToken.shiftedBy(-18),
      formatAmount: toBigNumber(stakedXToken.shiftedBy(-18).toFixed(4)).toFormat(4),
    }

    return info as StakeInfo
  }

  async earenedCOFI() {
    const earenedCOFI = await this.api.Contracts.CoFiXVaultForStaking.earned(this.address || '', this.api.account || '')
    return {
      value: earenedCOFI,
      amount: this.api.Tokens.COFI.amount(earenedCOFI),
      formatAmount: this.api.Tokens.COFI.format(this.api.Tokens.COFI.amount(earenedCOFI)),
    }
  }

  async swap(src: string, dest: string, amount: BigNumber | BigNumberish) {
    if (!this.impactCostVOL) {
      throw new Error(`cofix pair ${this.symbol} not init`)
    }

    if (!this.contract) {
      throw new Error(`coifx pair ${this.symbol} not found`)
    }

    if (src === "ETH" && dest === "USDT" || src === "USDT" && dest === "ETH") {
      const amountIn = toBigNumber(amount)
      if (src === "ETH"){
        const realPrice = await this.api.Contracts.UniswapQuoter.quoteExactInputSingle(WETH.addresses[this.api.chainId!], USDT.addresses[this.api.chainId!], this.api.Tokens.ETH.parse(amountIn).toFixed(0))
        const oraclePrice = await this.api.Contracts.UniswapQuoter.quoteExactInputSingle(WETH.addresses[this.api.chainId!], USDT.addresses[this.api.chainId!], this.api.Tokens.ETH.parse(1).toFixed(0))

        return {
          fee: {
            symbol: "ETH",
            amount: toBigNumber(0),
          },
          oracleOut: toBigNumber(formatUSDT(oraclePrice)).multipliedBy(amountIn),
          amountOut: toBigNumber(formatUSDT(realPrice)),
          oracleFee: toBigNumber(0)
        }

      }else{
        const realPrice = await this.api.Contracts.UniswapQuoter.quoteExactInputSingle(USDT.addresses[this.api.chainId!], WETH.addresses[this.api.chainId!], this.api.Tokens.USDT.parse(amountIn).toFixed(0))
        const oraclePrice = await this.api.Contracts.UniswapQuoter.quoteExactInputSingle(USDT.addresses[this.api.chainId!], WETH.addresses[this.api.chainId!], this.api.Tokens.USDT.parse(1).toFixed(0))

        return {
          fee: {
            symbol: "ETH",
            amount: toBigNumber(0),
          },
          oracleOut: toBigNumber(formatETH(oraclePrice)).multipliedBy(amountIn),
          amountOut: toBigNumber(formatETH(realPrice)),
          oracleFee: toBigNumber(0)
        }
      }

    }else{
      const { k, tokenAmount } = await this.api.Tokens[this.pair[1].symbol].queryOracle()
      const amountIn = toBigNumber(amount)
      if (src === 'ETH' && dest === this.pair[1].symbol) {
        const fee = amountIn.multipliedBy(this.theta).div(10000)
        const c = toBigNumber(
          await this.contract.impactCostForSellOutETH(this.api.Tokens.ETH.parse(amountIn).toFixed(0))
        ).shiftedBy(-18)
        const amountOut = amountIn.minus(fee).multipliedBy(tokenAmount).div(toBigNumber(1).plus(k).plus(c))
        return {
          fee: {
            symbol: 'ETH',
            amount: fee,
          },
          oracleOut: amountIn.multipliedBy(tokenAmount),
          amountOut: amountOut,
          oracleFee: toBigNumber(0.01),
        }
      } else if (src === this.pair[1].symbol && dest === 'ETH') {
        let amountOut = amountIn.div(tokenAmount)

        const c = toBigNumber(
          await this.contract.impactCostForBuyInETH(this.api.Tokens.ETH.parse(amountOut).toFixed(0))
        ).shiftedBy(-18)

        amountOut = amountOut.div(toBigNumber(1).plus(k).plus(c))
        const fee = amountOut.multipliedBy(this.theta).div(10000)
        amountOut = amountOut.minus(fee)

        return {
          fee: {
            symbol: 'ETH',
            amount: fee,
          },
          oracleOut: amountIn.div(tokenAmount),
          amountOut: amountOut,
          oracleFee: toBigNumber(0.01),
        }
      } else {
        throw new Error(`can not swap ${src} to ${dest}`)
      }
    }
  }
}

export default CoFiXPair
