import { SupportedChains } from '../constants/chains'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import { t } from '@lingui/macro'
import { WalletConnect } from 'src/components/Icon'

export const connector = new WalletConnectConnector({
  rpc: SupportedChains.reduce((m, c) => {
    m[c.chainId] = c.rpc[0]
    return m
  }, Object.create(null)),
  supportedChainIds: SupportedChains.map((c) => c.chainId),
  qrcode: true,
})
export const id = 'wallet-conect'
export const Icon = WalletConnect
export const name = t`Wallet Connect`

export default {
  id,
  name,
  Icon,
  connector,
}
