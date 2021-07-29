import { useMemo } from 'react'
import useWeb3 from 'src/libs/web3/hooks/useWeb3'
import { Mainnet, Rinkeby } from 'src/libs/web3/constants/chains'

const useEtherScanHost = () => {
  const { api } = useWeb3()

  return useMemo(() => {
    switch (api?.chainId) {
      case Mainnet.chainId:
        return 'https://etherscan.io'
      case Rinkeby.chainId:
        return 'https://rinkeby.etherscan.io'
      default:
        return 'https://etherscan.io'
    }
  }, [api])
}

export default useEtherScanHost
