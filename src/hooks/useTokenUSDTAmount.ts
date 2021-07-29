import BigNumber from 'bignumber.js'
import { useEffect, useState } from 'react'
import useWeb3 from 'src/libs/web3/hooks/useWeb3'
import useInterval from '@use-it/interval'

const useTokenUSDTAmount = (token: string) => {
  const { api } = useWeb3()
  const [amount, setAmount] = useState<{
    value: BigNumber
    amount: BigNumber
    formatAmount: string
  }>()

  const refresh = async () => {
    if (!api) {
      return
    }

    const value = await api.Tokens[token].getUSDTValue()
    if (!amount || !value.eq(amount.value)) {
      setAmount({
        value,
        amount: api.Tokens.USDT.amount(value),
        formatAmount: api.Tokens.USDT.format(api.Tokens.USDT.amount(value)),
      })
    }
  }

  useEffect(() => {
    refresh()
  }, [api, token])
  useInterval(refresh, 1000)

  return amount
}

export default useTokenUSDTAmount
