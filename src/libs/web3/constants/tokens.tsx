import {
  TokenCOFI,
  TokenHBTC,
  TokenNEST,
  TokenPETH,
  TokenPUSD,
  TokenUSDC,
  TokenUSDT, TokenWETH
} from 'src/components/Icon'

import { TokenProps } from '../api/Token'
import { Mainnet, Rinkeby } from './chains'

export const USDT: TokenProps = {
  symbol: 'USDT',
  Icon: TokenUSDT,
  addresses: {
    [Mainnet.chainId]: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    [Rinkeby.chainId]: '0x2d750210c0b5343a0b79beff8F054C9add7d2411',
  },
}

export const HBTC: TokenProps = {
  symbol: 'HBTC',
  Icon: TokenHBTC,
  addresses: {
    [Mainnet.chainId]: '0x0316EB71485b0Ab14103307bf65a021042c6d380',
    [Rinkeby.chainId]: '0xaE73d363Cb4aC97734E07e48B01D0a1FF5D1190B',
  },
}

export const PETH: TokenProps = {
  symbol: 'PETH',
  Icon: TokenPETH,
  addresses: {
    [Mainnet.chainId]: '0x53f878Fb7Ec7B86e4F9a0CB1E9a6c89C0555FbbD',
    [Rinkeby.chainId]: '0x4D4B378eFbeb7eE15Aa498F3383C9949391557e0',
  },
}

export const PUSD: TokenProps = {
  symbol: 'PUSD',
  Icon: TokenPUSD,
  addresses: {
    [Mainnet.chainId]: '0xCCEcC702Ec67309Bc3DDAF6a42E9e5a6b8Da58f0',
    [Rinkeby.chainId]: '0x740ed84037E5d2F650b585759623EBC4de849021',
  },
}

export const USDC: TokenProps = {
  symbol: 'USDC',
  Icon: TokenUSDC,
  addresses: {
    [Mainnet.chainId]: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    [Rinkeby.chainId]: '0xB64825a6bA80d65886b5123f5170ddffc935D9DE',
  },
}

export const NEST: TokenProps = {
  symbol: 'NEST',
  Icon: TokenNEST,
  addresses: {
    [Mainnet.chainId]: '0x04abEdA201850aC0124161F037Efd70c74ddC74C',
    [Rinkeby.chainId]: '0xE313F3f49B647fBEDDC5F2389Edb5c93CBf4EE25',
  },
  formatPrecision: 2,
}

export const COFI: TokenProps = {
  symbol: 'COFI',
  Icon: TokenCOFI,
  addresses: {
    [Mainnet.chainId]: '0x1a23a6BfBAdB59fa563008c0fB7cf96dfCF34Ea1',
    [Rinkeby.chainId]: '0x61EA050b28Ccca539F0faf79Fd26F6Df31b9f15B',
  },
}

export const WETH: TokenProps = {
  symbol: 'WETH',
  Icon: TokenWETH,
  addresses: {
    [Mainnet.chainId]: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    [Rinkeby.chainId]: '0xc778417E063141139Fce010982780140Aa0cD5Ab',
  },
}

export const ERC20TokenWhitelist = [USDT, HBTC, PETH, PUSD, USDC, NEST, COFI]
