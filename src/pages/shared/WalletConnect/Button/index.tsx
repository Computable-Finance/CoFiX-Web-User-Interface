import { Trans } from '@lingui/macro'
import { FC, useRef } from 'react'
import Popup from 'reactjs-popup'
import Button, { Props as ButtonProps } from 'src/components/Button'

import Modal from './Modal'

type Props = ButtonProps
const WalletConnectButton: FC<Props> = ({ children, ...buttonProps }) => {
  const modal = useRef<any>()

  return (
    <Popup
      modal
      ref={modal}
      trigger={
        <Button className="cofi-wallet-connect-button" {...buttonProps}>
          {children || <Trans>Connect Wallet</Trans>}
        </Button>
      }
    >
      <Modal onClose={() => modal.current.close()} />
    </Popup>
  )
}

export default WalletConnectButton
