import { useEffect, useState } from 'react'
import useWeb3 from 'src/libs/web3/hooks/useWeb3'
import { PoolInfo } from 'src/libs/web3/api/CoFiXPair'
import useInterval from '@use-it/interval'
import { AnchorPoolInfo } from 'src/libs/web3/api/CoFiXAnchorPool'

const usePoolInfo = <T extends PoolInfo | AnchorPoolInfo>(token0: string, token1?: string) => {
  const { api } = useWeb3()
  const [info, setInfo] = useState<T>()
  const [loading, setLoading] = useState(false)

  const refresh = async () => {
    try {
      setLoading(true)

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

        const i = await pair.getPoolInfo()
        if (JSON.stringify(info) !== JSON.stringify(i)) {
          setInfo(i as T)
        }
      } else {
        const pool = api.CoFixAnchorPools[token0]
        if (!pool) {
          setInfo(undefined)
          return
        }

        const i = await pool.getAnchorPoolInfo(token0)
        if (JSON.stringify(info) !== JSON.stringify(i)) {
          setInfo(i as T)
        }
      }
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    refresh()
  }, [api, token0, token1])

  useInterval(refresh, 1000)

  return { info, loading }
}

export default usePoolInfo
