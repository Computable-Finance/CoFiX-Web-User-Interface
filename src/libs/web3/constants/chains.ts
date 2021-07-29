// https://chainid.network/

type Chain = {
  name: string
  chainId: number
  shortName: string
  chain: string
  network: string
  networkId: number
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  rpc: Array<string>
  faucets: Array<string>
  explorers: Array<{
    name: string
    url: string
    standard: string
  }>
  infoURL: string
}

const INFURA_API_KEY = process.env.REACT_APP_INFURA_KEY

export const Mainnet = {
  name: 'Ethereum Mainnet',
  chainId: 1,
  shortName: 'eth',
  chain: 'ETH',
  network: 'mainnet',
  networkId: 1,
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpc: [
    `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
    `wss://mainnet.infura.io/ws/v3/${INFURA_API_KEY}`,
    'https://api.mycryptoapi.com/eth',
    'https://cloudflare-eth.com',
  ],
  faucets: [],
  explorers: [
    {
      name: 'etherscan',
      url: 'https://etherscan.io',
      standard: 'EIP3091',
    },
  ],
  infoURL: 'https://ethereum.org',
}

export const Ropsten = {
  name: 'Ethereum Testnet Ropsten',
  chainId: 3,
  shortName: 'rop',
  chain: 'ETH',
  network: 'ropsten',
  networkId: 3,
  nativeCurrency: {
    name: 'Ropsten Ether',
    symbol: 'ROP',
    decimals: 18,
  },
  rpc: [`https://ropsten.infura.io/v3/${INFURA_API_KEY}`, `wss://ropsten.infura.io/ws/v3/${INFURA_API_KEY}`],
  faucets: ['https://faucet.ropsten.be?${ADDRESS}'],
  explorers: [],
  infoURL: 'https://github.com/ethereum/ropsten',
}

export const Rinkeby = {
  name: 'Ethereum Testnet Rinkeby',
  chainId: 4,
  shortName: 'rin',
  chain: 'ETH',
  network: 'rinkeby',
  networkId: 4,
  nativeCurrency: {
    name: 'Rinkeby Ether',
    symbol: 'RIN',
    decimals: 18,
  },
  rpc: [`https://rinkeby.infura.io/v3/${INFURA_API_KEY}`, `wss://rinkeby.infura.io/ws/v3/${INFURA_API_KEY}`],
  faucets: ['https://faucet.rinkeby.io'],
  explorers: [],
  infoURL: 'https://www.rinkeby.io',
}

export const Goerli = {
  name: 'Ethereum Testnet Görli',
  chainId: 5,
  shortName: 'gor',
  chain: 'ETH',
  network: 'goerli',
  networkId: 5,
  nativeCurrency: {
    name: 'Görli Ether',
    symbol: 'GOR',
    decimals: 18,
  },
  rpc: ['https://rpc.goerli.mudit.blog/', 'https://rpc.slock.it/goerli ', 'https://goerli.prylabs.net/'],
  faucets: ['https://goerli-faucet.slock.it/?address=${ADDRESS}', 'https://faucet.goerli.mudit.blog'],
  explorers: [],
  infoURL: 'https://goerli.net/#about',
}

export const Kovan = {
  name: 'Ethereum Testnet Kovan',
  chainId: 42,
  shortName: 'kov',
  chain: 'ETH',
  network: 'kovan',
  networkId: 42,
  nativeCurrency: {
    name: 'Kovan Ether',
    symbol: 'KOV',
    decimals: 18,
  },
  rpc: [
    `https://kovan.poa.network`,
    `http://kovan.poa.network:8545`,
    `https://kovan.infura.io/v3/${INFURA_API_KEY}`,
    `wss://kovan.infura.io/ws/v3/${INFURA_API_KEY}`,
    `ws://kovan.poa.network:8546`,
  ],
  faucets: ['https://faucet.kovan.network', 'https://gitter.im/kovan-testnet/faucet'],
  explorers: [],
  infoURL: 'https://kovan-testnet.github.io/website',
}

export const SupportedChains: Array<Chain> = [Mainnet, Ropsten, Rinkeby, Goerli, Kovan]
