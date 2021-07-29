import { useEffect, useState } from 'react'
import useWeb3 from 'src/libs/web3/hooks/useWeb3'
import { StakeInfo } from 'src/libs/web3/api/CoFiXPair'
import useInterval from '@use-it/interval'
import { AnchorStakeInfo } from 'src/libs/web3/api/CoFiXAnchorPool'

const useStakeInfo = (token0: string, token1?: string) => {
  const { api } = useWeb3()
  const [info, setInfo] = useState<StakeInfo | AnchorStakeInfo>()

  const refresh = async () => {
    if (!api || !token0) {
      setInfo(undefined)
      return
    }

    if (token1) {
      const pair = api.CoFiXPairs[token0][token1]
      if (!pair) {
        setInfo(undefined)
        return
      }

      const i = await pair.getStakeInfo()
      if (JSON.stringify(i) !== JSON.stringify(info)) {
        setInfo(i)
      }
    } else {
      const pool = api.CoFixAnchorPools[token0]
      if (!pool) {
        setInfo(undefined)
        return
      }

      const i = await pool.getStakeInfo(token0)
      if (JSON.stringify(i) !== JSON.stringify(info)) {
        setInfo(i)
      }
    }
  }

  useEffect(() => {
    refresh()
  }, [api, token0, token1])
  useInterval(refresh, 3000)

  return info
}

export default useStakeInfo
