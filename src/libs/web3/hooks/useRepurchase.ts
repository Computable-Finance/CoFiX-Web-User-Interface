import { useCallback, useEffect, useState } from 'react'
import { toBigNumber } from '../util'
import useTransaction, { TransactionRepurchaseContent, TransactionType } from './useTransaction'
import useWeb3 from './useWeb3'
import BigNumber from 'bignumber.js'

const useRepurchase = (content: TransactionRepurchaseContent) => {
  const { api } = useWeb3()
  const { push } = useTransaction()

  const [loading, setLoading] = useState(false)
  const [args, setArgs] = useState<{
    symbol: string
    amount: BigNumber
    ethAmount: {
      value: BigNumber
      amount: BigNumber
      formatAmount: string
    }
    usdtAmount: {
      value: BigNumber
      amount: BigNumber
      formatAmount: string
    }
    oracleFee: {
      value: BigNumber
      amount: BigNumber
      formatAmount: string
    }
  }>()

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        if (!api) {
          return
        }

        const [ethAmount, usdtAmount] = await Promise.all([
          api.Tokens.COFI.getETHAmount(),
          api.Tokens.COFI.getUSDTAmount(),
        ])

        const amount = toBigNumber(content.amount)
        const anchorPool = api.CoFixAnchorPools[content.symbol]

        const oracleFee = anchorPool.anchorToken === 'ETH' ? toBigNumber(0.001) : toBigNumber(0.002)
        const newArgs: Partial<typeof args> = {
          symbol: content.symbol,
          amount,
          oracleFee: {
            value: api.Tokens.ETH.parse(oracleFee),
            amount: oracleFee,
            formatAmount: api.Tokens.ETH.format(oracleFee),
          },
        }

        if (!amount.isNaN()) {
          const eth = ethAmount.multipliedBy(amount)
          const usdt = usdtAmount.multipliedBy(amount)

          newArgs.usdtAmount = {
            value: api.Tokens.USDT.parse(usdt),
            amount: usdt,
            formatAmount: api.Tokens.USDT.format(usdt),
          }
          newArgs.ethAmount = {
            value: api.Tokens.ETH.parse(eth),
            amount: eth,
            formatAmount: api.Tokens.ETH.format(eth),
          }
        }

        if (JSON.stringify(newArgs) !== JSON.stringify(args)) {
          setArgs(newArgs as typeof args)
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [api, content.amount, content.symbol])

  const handler = useCallback(async () => {
    if (!args || !api || !api.account) {
      return
    }

    return push(
      {
        type: TransactionType.Repurchase,
        content,
      },
      async () => {
        if (args.symbol === 'ETH') {
          return api.Contracts.CoFiXDAO.contract?.redeem(
            api.Tokens.ETH.parse(content.amount).toFixed(0),
            api.account || '',
            {
              value: args.oracleFee.value.toFixed(0),
            }
          )
        } else {
          return api.Contracts.CoFiXDAO.contract?.redeemToken(
            api.Tokens[content.symbol].address || '',
            api.Tokens.ETH.parse(content.amount).toFixed(0),
            api.account || '',
            {
              value: args.oracleFee.value.toFixed(0),
            }
          )
        }
      }
    )
  }, [args])

  return {
    ...args,

    handler,
    loading,
  }
}

export default useRepurchase
