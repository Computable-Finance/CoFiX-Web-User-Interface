import { TokenCOFI, TokenHBTC, TokenNEST, TokenUSDT } from 'src/components/Icon'

import { CoFiXPairProps } from '../api/CoFiXPair'
import { Mainnet, Rinkeby } from './chains'

export const ETHUSDT: CoFiXPairProps = {
  symbol: 'ETH-USDT',
  Icon: TokenUSDT,
  pair: ['ETH', 'USDT'],
  addresses: {
    [Mainnet.chainId]: '0xFa8055B3e0C36605bB31e23bC565C31eb3Dca386',
    [Rinkeby.chainId]: '0xf749fA2B6E75F9EfBa8427eA86036f38A7173F9C',
  },
  cofiAmountPerBlock: 3,
  cofiRewardPercentage: 0.9,
}

export const ETHHBTC: CoFiXPairProps = {
  symbol: 'ETH-HBTC',
  Icon: TokenHBTC,
  pair: ['ETH', 'HBTC'],
  addresses: {
    [Mainnet.chainId]: '0xd312E8374fF2B0260A32aF5f91BA8d8EaFAE856B',
    [Rinkeby.chainId]: '0xB042c57997a561FB93C510BA1811927B78452EAF',
  },
  cofiAmountPerBlock: 3,
  cofiRewardPercentage: 0.9,
}

export const ETHNEST: CoFiXPairProps = {
  symbol: 'ETH-NEST',
  Icon: TokenNEST,
  pair: ['ETH', 'NEST'],
  addresses: {
    [Mainnet.chainId]: '0x2FA6F2d5e42630e872cD0F33C69D1c2708FF79Fd',
    [Rinkeby.chainId]: '0x6FAc11eE801713460B2b9Fe089f473c48756D45d',
  },
  cofiAmountPerBlock: 3,
  cofiRewardPercentage: 0.9,
}

export const ETHCOFI: CoFiXPairProps = {
  symbol: 'ETH-COFI',
  Icon: TokenCOFI,
  pair: ['ETH', 'COFI'],
  addresses: {
    [Mainnet.chainId]: '0x711EA25b70Bb580a7cb19DeBd0ab40A016c3fCbb',
    [Rinkeby.chainId]: '0x45579827334583680c33ae9110C6a65806DB6EC7',
  },
  cofiAmountPerBlock: 3,
  cofiRewardPercentage: 0.9,
}

export const CoFiXPairWhitelist = [ETHNEST, ETHHBTC, ETHCOFI, ETHUSDT]
