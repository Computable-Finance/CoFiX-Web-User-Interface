import { InjectedConnector } from '@web3-react/injected-connector'
import { t } from '@lingui/macro'
import { Metamask } from 'src/components/Icon'
import { SupportedChains } from '../constants/chains'

export const connector = new InjectedConnector({
  supportedChainIds: SupportedChains.map((c) => c.chainId),
})

export const id = 'metamask'
export const Icon = Metamask
export const name = t`MetaMask`

export default {
  id,
  connector,
  Icon,
  name,
}
