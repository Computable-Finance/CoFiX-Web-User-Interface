import { BigNumberish } from '@ethersproject/bignumber'
import BigNumber from 'bignumber.js'

export const toBigNumber = (n: BigNumberish | BigNumber) => {
  if (typeof n === 'undefined') {
    return new BigNumber(NaN)
  }

  if (n instanceof BigNumber) {
    return n
  }

  if (typeof n === 'string') {
    return new BigNumber(n)
  }

  if (n.toString) {
    return new BigNumber(n.toString())
  }

  return new BigNumber(NaN)
}

export const formatNumber = (n: BigNumber | BigNumberish, decimals = 18, formatPrecision = 4) => {
  return toBigNumber(toBigNumber(n).toFixed(decimals))
    .toFormat(formatPrecision)
    .replace(/(\.\d*?[1-9])0+$/, '$1')
    .replace(/\.0+$/, '')
}

export function deadline(seconds = 60 * 10) {
  return Math.ceil(Date.now() / 1000) + seconds
}
