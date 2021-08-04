import { AbstractConnector } from '@web3-react/abstract-connector'
import { TokenETH } from 'src/components/Icon'

import imToken from './im-token'
import injected from './injected'
import walletConnect from './wallet-connect'

export type Connector = {
  id: string
  name: string
  Icon: typeof TokenETH
  connector: AbstractConnector
}

export const SupportedConnectors: Array<Connector> = [injected, walletConnect, ...(window.imToken ? [imToken] : [])]
