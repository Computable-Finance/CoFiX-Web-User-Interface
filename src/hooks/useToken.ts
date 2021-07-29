import { useMemo } from 'react'
import useWeb3 from 'src/libs/web3/hooks/useWeb3'

const useToken = (symbol: string) => {
  const { api, inited } = useWeb3()

  return useMemo(() => {
    if (!api) {
      return
    }

    return api.Tokens[symbol]
  }, [api, inited, symbol])
}

export default useToken
