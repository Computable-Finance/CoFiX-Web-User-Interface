import { FC } from 'react'
import useWeb3 from 'src/libs/web3/hooks/useWeb3'

import Button from './Button'
import Status from './Status'

const WalletConnect: FC = () => {
  const { account } = useWeb3()

  return account ? <Status /> : <Button />
}

export default WalletConnect
