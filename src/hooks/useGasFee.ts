import { useEffect, useState } from 'react'
import BigNumber from 'bignumber.js'
import useWeb3 from 'src/libs/web3/hooks/useWeb3'

const useGasFee = () => {
  const { api } = useWeb3()
  const [fee, setFee] = useState<{
    value: BigNumber
    amount: BigNumber
    formatAmount: string
  }>()

  useEffect(() => {
    async function update() {
      if (!api) {
        setFee(undefined)
        return
      }

      const gp = await api.getGasFee()
      setFee(gp)
    }

    update()

    const intervalId = setInterval(update, 5000)
    return () => clearInterval(intervalId)
  }, [api])

  return fee
}

export default useGasFee
