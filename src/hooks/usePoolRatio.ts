import BigNumber from 'bignumber.js'
import { useEffect, useState } from 'react'
import useWeb3 from 'src/libs/web3/hooks/useWeb3'

const usePoolRatio = (token0: string, token1: string) => {
  const { api } = useWeb3()
  const [ratio, setRatio] = useState<BigNumber>()

  useEffect(() => {
    if (!api || !token0 || !token1) {
      setRatio(undefined)
      return
    }

    const pair = api.CoFiXPairs[token0][token1]
    if (!pair) {
      setRatio(undefined)
      return
    }

    pair
      .getPoolRatio()
      .then((ratio) => {
        if (!ratio) {
          setRatio(undefined)
          return
        }

        setRatio(ratio)
      })
      .catch((e) => {
        console.error(e)
      })
  }, [api, token0, token1])

  return ratio
}

export default usePoolRatio
