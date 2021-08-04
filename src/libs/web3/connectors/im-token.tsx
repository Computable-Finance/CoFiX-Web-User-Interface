import { InjectedConnector } from '@web3-react/injected-connector'
import { t } from '@lingui/macro'
import { IMToken } from 'src/components/Icon'
import { SupportedChains } from '../constants/chains'

export const connector = new InjectedConnector({
  supportedChainIds: SupportedChains.map((c) => c.chainId),
})

export const id = 'imtoken'
export const Icon = IMToken
export const name = t`imToken`

export default {
  id,
  connector,
  Icon,
  name,
}
