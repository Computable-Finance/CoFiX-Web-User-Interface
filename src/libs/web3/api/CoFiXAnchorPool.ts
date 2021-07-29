import { CoFiXAnchorPool__factory, CoFiXAnchorPool as TypeCoFiXAnchorPool } from 'src/abis/types/cofix'
import { TokenXToken } from 'src/components/Icon'
import API from '.'
import { ADDRESS_ZERO, BLOCK_DAILY, TIME_TO_NEXT_BLOCK } from '../constants/constant'
import Contract, { ContractProps } from './Contract'
import ERC20Token from './ERC20Token'
import BigNumber from 'bignumber.js'
import { toBigNumber } from '../util'
import { BigNumberish } from 'ethers'

export type CoFiXAnchorPoolProps = ContractProps & {
  title: string
  anchorToken: string
  tokens: Array<string>
  cofiAmountPerBlock: number
}

export type AnchorPoolInfo = {
  totalFunds: BigNumber
  amount: BigNumber
  formatAmount: string
  miningSpeed: number
  apr: string

  emptyLiquidity: boolean
  myPoolRatio: string
  myPoolAmount: BigNumber
  myPoolFormatAmount: string
  xtokenTotalSupply: {
    value: BigNumber
    amount: BigNumber
    formatAmount: string
  }

  xtokenTotalSupplys: Array<{
    symbol: string
    totalSupply: {
      value: BigNumber
      amount: BigNumber
      formatAmount: string
    }
  }>
}

export type AnchorStakeInfo = {
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

class CoFiXAnchorPool extends Contract {
  contract?: TypeCoFiXAnchorPool
  tokens: Array<string>
  anchorToken: string
  title: string
  cofiAmountPerBlock: number

  xtokens: {
    [symbol: string]: ERC20Token
  }

  theta = toBigNumber(20)
  impactCostVOL = toBigNumber(1)
  nt = toBigNumber(3000)

  constructor(api: API, props: CoFiXAnchorPoolProps) {
    super(api, props)

    if (this.address && this.api.provider) {
      this.contract = CoFiXAnchorPool__factory.connect(
        this.address,
        this.api.provider?.getSigner() || this.api.provider
      )
    }

    this.tokens = props.tokens
    this.anchorToken = props.anchorToken
    this.xtokens = {}
    this.title = props.title
    this.cofiAmountPerBlock = props.cofiAmountPerBlock
  }

  async init() {
    await super.init()
    const xtokens = await Promise.all(
      this.tokens.map(async (t) => {
        if (!this.contract) {
          return
        }
        const token = this.api.Tokens[t]
        if (!token.address) {
          return
        }

        const xtoken = await this.contract.getXToken(token.address)
        if (xtoken !== ADDRESS_ZERO) {
          return {
            symbol: t,
            address: xtoken,
          }
        }
      })
    )

    for (const t of xtokens) {
      if (t) {
        const xtoken = new ERC20Token(this.api, {
          symbol: `X${t.symbol}`,
          Icon: TokenXToken,
          decimals: 18,
          addresses: t.address,
          isXToken: true,
        })

        this.api.Tokens[xtoken.symbol] = xtoken
        this.xtokens[t.symbol] = xtoken
      }
    }

    await Promise.all(Object.values(this.xtokens).map((t) => t.init()))

    if (!this.contract) {
      return
    }
    const config = await this.contract.getConfig()
    this.theta = toBigNumber(config.theta)
    this.impactCostVOL = toBigNumber(config.impactCostVOL)
    this.nt = toBigNumber(config.nt)
  }

  async getAnchorPoolInfo(symbol: string): Promise<AnchorPoolInfo | undefined> {
    const xtoken = this.xtokens[symbol]
    const token = this.api.Tokens[symbol]
    const anchorToken = this.api.Tokens[this.anchorToken]

    if (!this.address || !this.contract || !xtoken) {
      return
    }

    const [balance, usdtAmount, cofiUSDTAmount, xtokenTotalSupplys] = await Promise.all([
      token.balanceOf(this.address),
      anchorToken.getUSDTAmount(),
      this.api.Tokens.COFI.getUSDTAmount(),
      Promise.all(
        Object.values(this.xtokens).map(async (xt) => {
          const totalSupply = await xt.totalSupply()
          return {
            symbol: xt.symbol,
            totalSupply: {
              value: totalSupply,
              amount: xt.amount(totalSupply),
              formatAmount: xt.format(xt.amount(totalSupply)),
            },
          }
        })
      ),
    ])

    const info: Partial<AnchorPoolInfo> = {}

    info.amount = token.amount(balance)
    info.formatAmount = token.format(info.amount)
    info.totalFunds = info.amount.multipliedBy(usdtAmount)
    info.miningSpeed = xtoken.cofiAmountPerBlock
    info.xtokenTotalSupplys = xtokenTotalSupplys
    info.xtokenTotalSupply = xtokenTotalSupplys.find((x) => x.symbol === xtoken.symbol)?.totalSupply
    info.apr = '--'
    if (!info.totalFunds.isZero()) {
      info.apr =
        toBigNumber(xtoken.cofiAmountPerBlock || 0)
          .multipliedBy(cofiUSDTAmount)
          .multipliedBy(60 * 60 * 24)
          .div(TIME_TO_NEXT_BLOCK)
          .div(info.totalFunds)
          .multipliedBy(365)
          .multipliedBy(100)
          .toFixed(2) + '%'
    }

    info.emptyLiquidity = true
    if (this.api.account && xtoken.address) {
      const [walletBalance, vaultBalance] = await Promise.all([
        xtoken.balanceOf(this.api.account),
        this.api.Contracts.CoFiXVaultForStaking.balanceOf(xtoken.address, this.api.account),
      ])
      const myBalance = walletBalance.plus(vaultBalance)
      info.emptyLiquidity = myBalance.isZero()
      if (info.xtokenTotalSupply && !info.xtokenTotalSupply.value.isZero()) {
        info.myPoolRatio = myBalance.div(info.xtokenTotalSupply.value).multipliedBy(100).toFixed(2) + '%'
      }
      info.myPoolAmount = xtoken.amount(myBalance)
      info.myPoolFormatAmount = xtoken.format(info.myPoolAmount)
    }

    return info as AnchorPoolInfo
  }

  async getStakeInfo(symbol: string) {
    const info: Partial<AnchorStakeInfo> = {}
    if (!this.address || !this.api.account) {
      return
    }

    const xtoken = this.xtokens[symbol]
    const [xTokenInPool, stakedXToken] = await Promise.all([
      xtoken.balanceOf(this.api.Contracts.CoFiXVaultForStaking.address || ''),
      this.api.Contracts.CoFiXVaultForStaking.balanceOf(xtoken.address || '', this.api.account),
    ])
    info.dailyMined = toBigNumber(xtoken.cofiAmountPerBlock || 0).multipliedBy(BLOCK_DAILY)
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

    return info as AnchorStakeInfo
  }

  async earenedCOFI(symbol: string) {
    const xtoken = this.xtokens[symbol]

    const earenedCOFI = await this.api.Contracts.CoFiXVaultForStaking.earned(
      xtoken.address || '',
      this.api.account || ''
    )
    return {
      value: earenedCOFI,
      amount: this.api.Tokens.COFI.amount(earenedCOFI),
      formatAmount: this.api.Tokens.COFI.format(this.api.Tokens.COFI.amount(earenedCOFI)),
    }
  }

  async swap(src: string, dest: string, amount: BigNumber | BigNumberish) {
    const amountIn = toBigNumber(amount)
    const fee = amountIn.multipliedBy(this.theta).div(10000)
    const amountOut = amountIn.minus(fee)

    return {
      fee: {
        symbol: dest,
        amount: fee,
      },
      oracleOut: amountIn,
      amountOut: amountOut,
      oracleFee: toBigNumber(0),
    }
  }
}

export default CoFiXAnchorPool
