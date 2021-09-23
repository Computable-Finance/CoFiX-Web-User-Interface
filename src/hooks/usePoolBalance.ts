import { toBigNumber } from '../libs/web3/util'
import useSwap from '../libs/web3/hooks/useSwap'
import useWeb3 from '../libs/web3/hooks/useWeb3'
import { useState } from 'react'

const usePoolBalance = (src: string, dest: string) => {
  const { api } = useWeb3()
  const [balance, setBalance] = useState('0')
  const [loading, setLoading] = useState(true)

  const pair = {
    src: { symbol: src, amount: '' },
    dest: { symbol: dest, amount: '' },
  }

  const swap = useSwap(pair)
  if (swap.swapInfo) {
    src = swap.swapInfo.path.slice(-2)[0]
    dest = swap.swapInfo.path.slice(-2)[1]

    if (
      (src === 'ETH' && dest === 'PETH') ||
      (src === 'PETH' && dest === 'ETH') ||
      (src === 'USDT' && dest === 'PUSD') ||
      (src === 'PUSD' && dest === 'USDT') ||
      (src === 'USDT' && dest === 'USDC') ||
      (src === 'USDC' && dest === 'USDT') ||
      (src === 'USDC' && dest === 'PUSD') ||
      (src === 'PUSD' && dest === 'USDC')
    ) {
      const anchorPool = api?.CoFixAnchorPools[dest]

      anchorPool?.getAnchorPoolInfo(dest).then((res) => {
        if (res?.formatAmount) {
          setBalance(res.formatAmount)
          setLoading(false)
        }
      })
    } else if (src === 'ETH') {
      const pool = api?.CoFiXPairs[src][dest]

      pool?.getPoolInfo().then((res) => {
        if (res?.formatAmounts) {
          setBalance(res.formatAmounts[1])
          setLoading(false)
        }
      })
    }
  } else {
    return {
      balance: {
        amount: toBigNumber(balance),
        value: toBigNumber(balance),
        formatAmount: balance,
      },
    }
  }

  return {
    loading: loading,
    balance: {
      amount: toBigNumber(balance),
      value: toBigNumber(balance),
      formatAmount: balance,
    },
  }
}

export default usePoolBalance
