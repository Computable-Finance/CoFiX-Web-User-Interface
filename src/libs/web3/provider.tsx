import { FC } from 'react'

import { Web3ReactProvider } from '@web3-react/core'
import { Web3Provider as TypeWeb3Provider } from '@ethersproject/providers'
import { Provider as Web3Provider } from './hooks/useWeb3'
import { Provider as TransactionProvider } from './hooks/useTransaction'
import * as ethers from 'ethers'
import useEagerConnect from './hooks/useEagerConnect'
import useInactiveListener from './hooks/useInactiveListener'

function getLibrary(provider: any): TypeWeb3Provider {
  const library = new ethers.providers.Web3Provider(provider)

  return library
}

const Inner: FC = ({ children }) => {
  const triedEager = useEagerConnect()
  useInactiveListener(!triedEager)

  return <>{children}</>
}

const Provider: FC = ({ children }) => {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <Web3Provider>
        <TransactionProvider>
          <Inner>{children}</Inner>
        </TransactionProvider>
      </Web3Provider>
    </Web3ReactProvider>
  )
}

export default Provider
