import BigNumber from 'bignumber.js'
import { useCallback, useEffect, useState } from 'react'
import useSlippageTolerance from 'src/hooks/useSlippageTolerance'

import { SwapInfo } from '../api'
import { ADDRESS_ZERO } from '../constants/constant'
import { deadline, toBigNumber } from '../util'
import useTransaction, { TansactionSwapContent, TransactionType } from './useTransaction'
import useWeb3 from './useWeb3'

const useSwap = (content: TansactionSwapContent) => {
  const { api, inited } = useWeb3()
  const { push } = useTransaction()
  const { ratio: slippageTolerance } = useSlippageTolerance()
  const [loading, setLoading] = useState(false)

  const [result, setResult] = useState<{
    swapInfo: SwapInfo

    ratio?: BigNumber
    amount: {
      oracle: BigNumber
      oracleFormat: string
      final: BigNumber
      finalFormat: string
      spread: BigNumber
      spreadFormat: string
    }

    oracleCallFee: {
      value: BigNumber
      amount: BigNumber
      format: string
    }
  }>()

  const [args, setArgs] = useState<{
    paths: Array<string>
    amountIn: string
    amountOutMin: string
    amountOutMinFormat: string
    src: string
    dest: string
    account: string
    ethValue: string
  }>()

  const refetch = async () => {
    try {
      setLoading(true)

      if (!api) {
        return
      }

      if (content.src.symbol === content.dest.symbol) {
        return
      }

      const srcToken = api.Tokens[content.src.symbol]
      const destToken = api.Tokens[content.dest.symbol]
      if (!srcToken || !destToken) {
        return
      }

      let amountIn = toBigNumber(content.src.amount)
      if (amountIn.isNaN() || amountIn.eq(0)) {
        amountIn = toBigNumber(1)
      }

      const swapInfo = await api.getSwapInfo(content.src.symbol, content.dest.symbol, amountIn)
      if (!swapInfo) {
        return
      }

      const oracleCallFee = api.Tokens.ETH.parse(swapInfo.oracleFee)

      const newResult = {
        swapInfo,

        ratio: swapInfo.amountOut.div(amountIn),
        amount: {
          oracle: swapInfo.oracleOut.div(amountIn),
          oracleFormat: destToken.format(swapInfo.oracleOut.div(amountIn)),
          final: swapInfo.amountOut.div(amountIn),
          finalFormat: destToken.format(swapInfo.amountOut.div(amountIn)),
          spread: swapInfo.oracleOut.minus(swapInfo.amountOut).div(amountIn),
          spreadFormat: destToken.format(swapInfo.oracleOut.minus(swapInfo.amountOut).div(amountIn)),
        },
        oracleCallFee: {
          value: oracleCallFee,
          amount: api.Tokens.ETH.amount(oracleCallFee),
          format: api.Tokens.ETH.amount(oracleCallFee).toFixed(2),
        },
      }

      if (JSON.stringify(newResult) !== JSON.stringify(result)) {
        setResult(newResult)
      }

      let ethValue = oracleCallFee
      if (srcToken.symbol === 'ETH') {
        ethValue = ethValue.plus(srcToken.parse(content.src.amount))
      }

      const amountOutMin = toBigNumber(
        destToken
          .parse(content.dest.amount)
          .multipliedBy(1 - slippageTolerance)
          .toFixed(0)
      )
      const newArgs = {
        paths: swapInfo.path.map((p: string) => api.Tokens[p].address || ADDRESS_ZERO),
        amountIn: srcToken.parse(content.src.amount).toFixed(0),
        amountOutMin: amountOutMin.toFixed(0),
        amountOutMinFormat: destToken.format(destToken.amount(amountOutMin)),
        // amountOutMin: '0',

        account: api.account || '',
        src: srcToken.address || '',
        dest: destToken.address || '',
        ethValue: ethValue.toFixed(0),
      }
      if (JSON.stringify(newArgs) !== JSON.stringify(args)) {
        setArgs(newArgs)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    ;(async () => {
      if (api && inited) {
        refetch()
      }
    })()
  }, [api, inited, content.src.amount, content.src.symbol, content.dest.amount, content.dest.symbol])

  const handler = useCallback(async () => {
    if (!api || !args) {
      return
    }

    return push(
      {
        type: TransactionType.Swap,
        content,
      },
      async () => {
        return api.Contracts.CoFiXRouter.contract?.swapExactTokensForTokens(
          args.paths,
          args.amountIn,
          args.amountOutMin,
          args.account,
          args.account,
          deadline(),
          {
            value: args.ethValue,
          }
        )
      }
    )
  }, [args])

  return { ...result, handler, paths: args?.paths, amountOutMinFormat: args?.amountOutMinFormat, loading }
}

export default useSwap
