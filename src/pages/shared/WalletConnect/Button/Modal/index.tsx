import './styles'

import { Trans } from '@lingui/macro'
import { FC } from 'react'
import Button from 'src/components/Button'
import Card from 'src/components/Card'
import { CoFiXLogo } from 'src/components/Icon'
import { SupportedConnectors } from 'src/libs/web3/connectors'
import useWeb3 from 'src/libs/web3/hooks/useWeb3'

type Props = {
  onClose?: () => void
}

const Modal: FC<Props> = (props) => {
  const { activate } = useWeb3()

  const classPrefix = 'cofi-wallet-connect-button-modal'

  return (
    <Card closable className={`${classPrefix}`} onClose={props.onClose}>
      <CoFiXLogo />

      <div className={`${classPrefix}-title`}>
        <Trans>Connect to CoFiX</Trans>
      </div>

      <div className={`${classPrefix}-content`}>
        <Trans>Click the button below to connect to CoFiX DApp</Trans>
      </div>

      <ul>
        {SupportedConnectors.map((p) => (
          <li key={p.id} onClick={() => activate(p)}>
            <Button className={`${classPrefix}-button`}>
              <p.Icon />

              {p.name}
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export default Modal
