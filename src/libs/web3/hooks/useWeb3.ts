import { Web3Provider } from '@ethersproject/providers'
import { useWeb3React } from '@web3-react/core'
import { useEffect, useState } from 'react'
import API from '../api'
import { Connector } from '../connectors'
import { createContainer } from 'unstated-next'
import { ERC20TokenWhitelist } from '../constants/tokens'
import { CoFiXPairWhitelist } from '../constants/pairs'
import { AnchorPoolWhitelist } from '../constants/anchor-pool'
import { CoFiXController, CoFiXDAO, CoFiXRouter, CoFiXVaultForStaking, NestPriceFacade, UniswapQuoter } from '../constants/contracts'

const _useWeb3 = <T extends Web3Provider>() => {
  const core = useWeb3React<T>()
  const [activeConnector, setActiveConnector] = useState<Connector | null>(null)
  const [api, setAPI] = useState<API>()
  const [inited, setInited] = useState(false)

  const activate = (connector: Connector, onError?: (error: Error) => void, throwErrors?: boolean) => {
    setActiveConnector(connector)
    core.activate(connector.connector, onError, throwErrors)
  }
  const deactivate = () => {
    setActiveConnector(null)
    core.deactivate()
  }

  const refresh = () => {
    if (activeConnector) {
      core.activate(activeConnector.connector, () => null, false)
    }
  }

  useEffect(() => {
    const api = new API({
      provider: core.library as any,
      chainId: core.chainId || 4,
      account: core.account || undefined,

      ERC20Tokens: ERC20TokenWhitelist,
      CoFiXPairs: CoFiXPairWhitelist,
      CoFixAnchorPools: AnchorPoolWhitelist,

      NestPriceFacade: NestPriceFacade,
      CoFiXController: CoFiXController,
      CoFiXRouter: CoFiXRouter,
      CoFiXDAO: CoFiXDAO,
      CoFiXVaultForStaking: CoFiXVaultForStaking,
      UniswapQuoter: UniswapQuoter
    })
    api.init().then(async () => {
      setAPI(api)
      setInited(true)
    })
  }, [core.library, core.chainId, core.account])

  return { ...core, activate, deactivate, activeConnector, api, inited, refresh }
}

const Web3 = createContainer(_useWeb3)
export const Provider = Web3.Provider

const useWeb3 = () => {
  return Web3.useContainer()
}

export default useWeb3
