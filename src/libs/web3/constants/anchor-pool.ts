import { t } from '@lingui/macro'

import { CoFiXAnchorPoolProps } from '../api/CoFiXAnchorPool'
import { Mainnet, Rinkeby } from './chains'

export const ETH: CoFiXAnchorPoolProps = {
  title: t`ETH Anchor`,
  addresses: {
    [Mainnet.chainId]: '0xD7E54D936ca1e7F0ed097D4Ec6140653eC60f85D',
    [Rinkeby.chainId]: '0xD93F55F65316de63497163e4d2FD0390A1805c35',
  },
  anchorToken: 'ETH',
  tokens: ['ETH', 'PETH'],
  cofiAmountPerBlock: 3,
}

export const USD: CoFiXAnchorPoolProps = {
  title: t`USD Anchor`,
  addresses: {
    [Mainnet.chainId]: '0x31Aa5da47Cf6FBB203531D88e3FC47d46AE6D46b',
    [Rinkeby.chainId]: '0xdCa0d07422691f286f5CE641FF4F40D5979BC0D7',
  },
  anchorToken: 'USDT',
  tokens: ['USDT', 'PUSD', 'USDC'],
  cofiAmountPerBlock: 3,
}

export const AnchorPoolWhitelist = [ETH, USD]
