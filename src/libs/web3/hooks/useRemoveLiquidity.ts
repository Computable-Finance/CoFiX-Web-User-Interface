import BigNumber from 'bignumber.js'
import { useCallback, useEffect, useState } from 'react'
import useSlippageTolerance from 'src/hooks/useSlippageTolerance'
import { toBigNumber, deadline } from '../util'
import useTransaction, { TransactionRemoveLiquidityContent, TransactionType } from './useTransaction'
import useWeb3 from './useWeb3'

const useRemoveLiquidity = (content: TransactionRemoveLiquidityContent) => {
  const { api } = useWeb3()
  const { push } = useTransaction()
  const { ratio: slippageTolerance } = useSlippageTolerance()

  const [args, setArgs] = useState<{
    pool: string
    token: string
    liquidity: string
    amountETHMin: string
    to: string
    oracleCallFee: string
    sendETHValue: string

    receive?: Array<{
      symbol: string
      amount: string
    }>
  }>()

  useEffect(() => {
    ;(async () => {
      if (!api || !api.account) {
        return
      }

      if (content.token0 && content.token1) {
        // find pair
        const pair = api.CoFiXPairs[content.token0][content.token1]
        const [poolInfo, ratio] = await Promise.all([pair.getPoolInfo(), pair.getPoolRatio()])
        if (!poolInfo || !ratio) {
          return
        }

        const liquidity = toBigNumber(content.liquidity)
        const ethAmountOut = liquidity.multipliedBy(poolInfo.nav)

        if (!liquidity.isNaN()) {
          // TODO: calaculate real receive
          content.receive = [
            {
              symbol: pair.pair[0].symbol,
              amount: pair.pair[0].format(ethAmountOut),
            },
            {
              symbol: pair.pair[1].symbol,
              amount: pair.pair[1].format(ethAmountOut.multipliedBy(ratio)),
            },
          ]
        } else {
          content.receive = [
            {
              symbol: pair.pair[0].symbol,
              amount: '--',
            },
            {
              symbol: pair.pair[1].symbol,
              amount: '--',
            },
          ]
        }

        const newArgs = {
          pool: pair.address || '',
          token: pair.pair[1].address || '',
          liquidity: liquidity.shiftedBy(18).toFixed(0),
          amountETHMin: api.Tokens.ETH.parse(ethAmountOut.multipliedBy(1 - slippageTolerance)).toFixed(0),
          to: api.account || '',
          oracleCallFee: api.Tokens.ETH.parse(0.01).toFixed(0),
          sendETHValue: api.Tokens.ETH.parse(0.01).toFixed(0),
          receive: content.receive,
        }

        if (JSON.stringify(newArgs) !== JSON.stringify(args)) {
          setArgs(newArgs)
        }
      } else if (content.token0) {
        // find Single-Sided Pool
        const pool = api.CoFixAnchorPools[content.token0]
        const token = api.Tokens[content.token0]

        if (!pool || !token) {
          return
        }

        const liquidity = toBigNumber(content.liquidity)

        if (!liquidity.isNaN()) {
          const poolInfo = await pool.getAnchorPoolInfo(token.symbol)
          if (!poolInfo) {
            return
          }

          const sortedTotalSupply = poolInfo.xtokenTotalSupplys.sort((a, b) => {
            if (a.symbol === token.symbol) {
              return -1
            } else if (b.symbol === token.symbol) {
              return 1
            } else {
              return a.totalSupply.amount.minus(b.totalSupply.amount).gt(0) ? -1 : 1
            }
          })

          content.receive = []
          let remain = liquidity
          for (let i = 0; i < sortedTotalSupply.length && remain.gt(0); i++) {
            const out = BigNumber.minimum(remain, sortedTotalSupply[i].totalSupply.amount)
            remain = remain.minus(out)
            if (out.gt(0)) {
              content.receive.push({
                symbol: sortedTotalSupply[i].symbol,
                amount: api.Tokens[sortedTotalSupply[i].symbol].format(out),
              })
            }
          }
        } else {
          content.receive = [
            {
              symbol: token.symbol,
              amount: '--',
            },
          ]
        }

        const newArgs = {
          pool: pool.address || '',
          token: token.address || '',

          liquidity: liquidity.shiftedBy(18).toFixed(0),
          amountETHMin: '0',
          to: api.account || '',
          oracleCallFee: api.Tokens.ETH.parse(0).toFixed(0),
          sendETHValue: api.Tokens.ETH.parse(0).toFixed(0),
          receive: content.receive,
        }

        if (JSON.stringify(newArgs) !== JSON.stringify(args)) {
          setArgs(newArgs)
        }
      }
    })()
  }, [api, content.token0, content.token1, content.liquidity])

  const handler = useCallback(() => {
    push(
      {
        type: TransactionType.RemoveLiquidity,
        content,
      },
      async () => {
        if (!args || !api) {
          return
        }

        return api.Contracts.CoFiXRouter.contract?.removeLiquidityGetTokenAndETH(
          args.pool,
          args.token,
          args.liquidity,
          args.amountETHMin,
          args.to,
          deadline(),
          {
            value: args.sendETHValue,
          }
        )
      }
    )
  }, [args])

  return { ...args, handler }
}

export default useRemoveLiquidity
