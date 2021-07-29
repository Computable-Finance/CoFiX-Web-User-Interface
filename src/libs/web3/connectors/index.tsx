import { TokenETH } from 'src/components/Icon'
import injected from './injected'
import walletConnect from './wallet-connect'
import { AbstractConnector } from '@web3-react/abstract-connector'

export type Connector = {
  id: string
  name: string
  Icon: typeof TokenETH
  connector: AbstractConnector
}

export const SupportedConnectors: Array<Connector> = [injected, walletConnect]
