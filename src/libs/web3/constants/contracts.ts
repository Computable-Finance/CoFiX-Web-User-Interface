import { UniswapQuoterProps } from '../api/UniswapQuoter'
import { CoFiXControllerProps } from '../api/CoFiXController'
import { CoFiXDAOProps } from '../api/CoFixDAO'
import { CoFiXRouterProps } from '../api/CoFiXRouter'
import { CoFiXVaultForStakingProps } from '../api/CoFiXVaultForStaking'
import { NestPriceFacadeProps } from '../api/NestPriceFacade'
import { Mainnet, Rinkeby } from './chains'

export const NestPriceFacade: NestPriceFacadeProps = {
  addresses: {
    [Mainnet.chainId]: '0xB5D2890c061c321A5B6A4a4254bb1522425BAF0A',
    [Rinkeby.chainId]: '0x40C3EB032f27fDa7AdcF1B753c75B84e27f26838',
  },
}

export const UniswapQuoter: UniswapQuoterProps = {
  addresses: {
    [Mainnet.chainId]: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
    [Rinkeby.chainId]: '',
  },
}

export const CoFiXDAO: CoFiXDAOProps = {
  addresses: {
    [Mainnet.chainId]: '0x2Cf06Aa521DD979Bc1b50ce44590A09db21d6A74',
    [Rinkeby.chainId]: '0x2720dF961723568062A96F9f5310d8ab408bfFfc',
  },
}

export const CoFiXRouter: CoFiXRouterProps = {
  addresses: {
    [Mainnet.chainId]: '0x57F0A4ef374B35eb32B61Dd8bc68C58e886CFC84',
    [Rinkeby.chainId]: '0x9f7997EFb0aF6f5e370dea99b1941D73330825C9',
  },
}

export const CoFiXVaultForStaking: CoFiXVaultForStakingProps = {
  addresses: {
    [Mainnet.chainId]: '0x7Bd4546DEdB397a0f0D7593A7Fa7f2Ceb3ff32E6',
    [Rinkeby.chainId]: '0x11839c81beBBC82686b0052Cb6F03E9Ae58A9704',
  },
}

export const CoFiXController: CoFiXControllerProps = {
  addresses: {
    [Mainnet.chainId]: '0x8eFFbf9CA7dB20481cE9C25EA4B410b3B835D70E',
    [Rinkeby.chainId]: '0x59c2EAF8FC22C10C2EB79Be3c23c2916BD0ec81e',
  },
}
