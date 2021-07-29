import { useEffect, useState } from 'react'
import useWeb3 from 'src/libs/web3/hooks/useWeb3'
import BigNumber from 'bignumber.js'
import useInterval from '@use-it/interval'

const useEarnedCOFI = (token0: string, token1?: string) => {
  const { api } = useWeb3()
  const [val, setVal] = useState<{
    value: BigNumber
    amount: BigNumber
    formatAmount: string
  }>()

  const refresh = async () => {
    if (!api || !api.account || !token0) {
      setVal(undefined)
      return
    }

    if (token1) {
      const pair = api.CoFiXPairs[token0][token1]
      if (!pair) {
        setVal(undefined)
        return
      }

      const v = await pair.earenedCOFI()
      if (JSON.stringify(v) !== JSON.stringify(val)) {
        setVal(v)
      }
    } else {
      const pool = api.CoFixAnchorPools[token0]
      if (!pool) {
        setVal(undefined)
        return
      }

      const v = await pool.earenedCOFI(token0)
      if (JSON.stringify(v) !== JSON.stringify(val)) {
        setVal(v)
      }
    }
  }

  useEffect(() => {
    refresh()
  }, [api, token0, token1])
  useInterval(refresh, 1000)

  return val
}

export default useEarnedCOFI
