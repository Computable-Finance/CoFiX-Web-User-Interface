import { TokenETH } from 'src/components/Icon'
import Token from './Token'
import { toBigNumber } from '../util'
import API from '.'
import BigNumber from 'bignumber.js'
import { ADDRESS_ZERO } from '../constants/constant'

class ETHToken extends Token {
  constructor(api: API) {
    super(api, {
      symbol: 'ETH',
      Icon: TokenETH,
      addresses: ADDRESS_ZERO,
      decimals: 18,
      formatPrecision: 8,
    })
  }

  async balanceOf(address: string): Promise<BigNumber> {
    const value = await this.api.provider?.getBalance(address)
    return toBigNumber(value || -1)
  }

  async totalSupply(): Promise<BigNumber> {
    // NOTICE: this is not real supply
    return new BigNumber(Infinity)
  }

  async getValuePerETH() {
    return this.parse(1)
  }

  async getValuePerUSDT() {
    return this.api.Tokens.USDT.getETHValue()
  }

  async allowance(_spender: string) {
    return Promise.resolve(true)
  }

  async approve(_spender: string) {
    return Promise.resolve()
  }
}

export default ETHToken
