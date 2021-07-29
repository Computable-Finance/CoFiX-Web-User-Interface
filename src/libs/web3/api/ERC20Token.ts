import { CoFiXERC20, ERC20LIB as ERC20, ERC20LIB__factory as ERC20__factory } from 'src/abis/types/cofix'
import API from '.'
import Token, { TokenProps } from './Token'
import { toBigNumber } from '../util'
import BigNumber from 'bignumber.js'

export type ERC20TokenProps = TokenProps

class ERC20Token extends Token {
  contract?: ERC20 | CoFiXERC20
  private _allowance: {
    [symbol: string]: boolean
  }

  constructor(api: API, props: ERC20TokenProps) {
    super(api, props)

    if (this.address && this.api.provider) {
      this.contract = ERC20__factory.connect(this.address, this.api.provider.getSigner() || this.api.provider)
    }
    this._allowance = {}
  }

  async init() {
    await super.init()

    if (this.contract) {
      this.decimals = (await this.contract.decimals()) || 18
    }
    if (this.address && this.isXToken) {
      const channelInfo = await this.api.Contracts.CoFiXVaultForStaking.contract?.getChannelInfo(this.address)
      if (channelInfo) {
        this.cofiAmountPerBlock = this.api.Tokens.COFI.amount(channelInfo.cofiPerBlock).toNumber()
      }
    }
  }

  async balanceOf(address: string) {
    if (this.contract) {
      const value = await this.contract.balanceOf(address)
      return toBigNumber(value)
    }

    return toBigNumber(-1)
  }

  async totalSupply() {
    if (this.contract) {
      const value = await this.contract.totalSupply()
      return toBigNumber(value)
    }

    return toBigNumber(0)
  }

  async getValuePerETH() {
    if (!this.address) {
      return new BigNumber(0)
    }

    try {
      // try to get price from nest
      const value = await this.api.Contracts.NestPriceFacade.contract?.lastPriceListAndTriggeredPriceInfo(
        this.address,
        1
      )
      if (value) {
        const v = toBigNumber(value.prices[1])
        if (!v.isZero()) {
          return v
        }
      }
    } catch (e) {
      console.warn(e)
    }

    // NOTICE: this is only used for debug
    switch (this.symbol) {
      case 'USDT':
        return this.parse(2700)
      case 'COFI':
        return this.parse(3000)
      case 'WETH':
        return this.parse(1)
      case 'PETH':
        return this.parse(1)
      default:
        return this.parse(2700)
    }
  }

  async getValuePerUSDT() {
    const [valuePerETH, usdtValuePerETH] = await Promise.all([
      this.getValuePerETH(),
      this.api.Tokens.USDT.getValuePerETH(),
    ])

    if (!valuePerETH || !usdtValuePerETH) {
      return new BigNumber(0)
    }

    return valuePerETH.div(usdtValuePerETH).shiftedBy(this.api.Tokens.USDT.decimals)
  }

  async allowance(spender: string) {
    if (!this.contract || !this.api.account) {
      return false
    }

    if (this._allowance[spender]) {
      return true
    }
    const allowance = await this.contract.allowance(this.api.account, spender)
    const ok = allowance && toBigNumber(allowance).gt(0)
    if (ok) {
      this._allowance[spender] = ok
    }

    return ok
  }

  async approve(spender: string) {
    if (!this.contract || !this.api.account) {
      throw new Error('no contract or account')
    }

    return this.contract.approve(spender, '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF')
  }
}

export default ERC20Token
