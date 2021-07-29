import './styles'

import { FC } from 'react'
import { MenuButton } from 'src/pages/shared/Menu'
import WalletConnect from 'src/pages/shared/WalletConnect'

const Footer: FC = () => {
  const classPrefix = 'cofi-footer'
  return (
    <footer className={`${classPrefix}`}>
      <WalletConnect />
      <MenuButton modal />
    </footer>
  )
}

export default Footer
