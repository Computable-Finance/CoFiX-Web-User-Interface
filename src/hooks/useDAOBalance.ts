import { useEffect, useState } from 'react'
import useWeb3 from 'src/libs/web3/hooks/useWeb3'
import BigNumber from 'bignumber.js'
// import useInterval from '@use-it/interval'

const useDAOBalance = () => {
  const { api } = useWeb3()
  const [balance, setBalance] = useState<{
    [symbol: string]: {
      value: BigNumber
      amount: BigNumber
      formatAmount: string
    }
  }>()

  const refresh = async () => {
    if (!api) {
      setBalance(undefined)
      return
    }

    const i = await api.Contracts.CoFiXDAO.getDAOBalance()
    if (JSON.stringify(i) !== JSON.stringify(balance)) {
      setBalance(i)
    }
  }
  useEffect(() => {
    refresh()
  }, [api])
  // useInterval(refresh, 3000)

  return balance
}

export default useDAOBalance
