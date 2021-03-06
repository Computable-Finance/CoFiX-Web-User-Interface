import BNJS from 'bignumber.js/bignumber';
import { BigNumber, BigNumberish, ethers } from 'ethers';
import { ETHER_DECIMALS } from '../constants';

export function parseUnits(amount: string, unit: number) {
  const bnAmount = new BNJS(amount);
  try {
    return ethers.utils.parseUnits(bnAmount.toFixed(unit), unit);
  } catch (e) {
    return BigNumber.from(bnAmount.times(Math.pow(10, unit)).toFixed(0));
  }
}

export function parseEthers(amount: string) {
  return parseUnits(amount, ETHER_DECIMALS);
}

export function unitsOf(amount: BigNumberish, decimals: BigNumberish) {
  return ethers.utils.formatUnits(amount, decimals);
}

export function ethersOf(amount: BigNumberish) {
  return ethers.utils.formatEther(amount);
}

export function truncate(amount: string, precision: number) {
  if (!/^(-?\d+)(.\d+)?$/.test(amount)) {
    throw new Error('Not a number!');
  }

  const dotIndex = amount.indexOf('.');
  if (dotIndex < 0) {
    return amount;
  } else {
    return amount.slice(0, dotIndex + precision + 1);
  }
}

export function isValidNumberForTx(amount: string | number) {
  if (!amount) {
    return false;
  }

  try {
    const bn = new BNJS(amount);
    return bn.gt(0);
  } catch (e) {
    return false;
  }
}
