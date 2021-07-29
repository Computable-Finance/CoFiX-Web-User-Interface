import { useMemo } from 'react'
import useWeb3 from './useWeb3'

const useXToken = (token0: string, token1?: string) => {
  const { api } = useWeb3()

  return useMemo(() => {
    if (!token0) {
      return
    }
    return token1 ? api?.CoFiXPairs[token0][token1] : api?.CoFixAnchorPools[token0].xtokens[token0]
  }, [api, token0, token1])
}

export default useXToken
