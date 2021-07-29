import { useCallback, useEffect, useState } from 'react'
import useSlippageTolerance from 'src/hooks/useSlippageTolerance'

import { deadline, toBigNumber } from '../util'
import useTransaction, { TransactionAddLiquidityContent, TransactionType } from './useTransaction'
import useWeb3 from './useWeb3'

const useAddLiquidity = (content: TransactionAddLiquidityContent) => {
  const { api } = useWeb3()
  const { push } = useTransaction()

  const [liquidity, setLiquidity] = useState<string>()
  const { ratio: slippageTolerance } = useSlippageTolerance()

  const [args, setArgs] = useState<{
    pool: string
    token: string
    amountETH: string
    amountToken: string
    liquidity: string
    liquidityMin: string
    to: string
    oracleCallFee?: string
    sendETHValue?: string
  }>()

  useEffect(() => {
    ;(async () => {
      if (!api) {
        return
      }

      if (content.token0.symbol && content.token1?.symbol) {
        // find pair
        const pair = api.CoFiXPairs[content.token0.symbol][content.token1.symbol]
        const poolInfo = await pair.getPoolInfo()
        if (!poolInfo) {
          return
        }

        const liquidity = toBigNumber(content.token0.amount).div(poolInfo.nav)
        if (!liquidity.isNaN()) {
          content.liquidity = liquidity.toFixed(6)
          setLiquidity(content.liquidity)
        }

        const newArgs = {
          pool: pair.address || '',
          token: pair.pair[1].address || '',
          amountETH: pair.pair[0].parse(content.token0.amount).toFixed(0),
          amountToken: pair.pair[1].parse(content.token1.amount).toFixed(0),
          liquidity: liquidity.toFixed(6),
          liquidityMin: liquidity
            .multipliedBy(1 - slippageTolerance)
            .shiftedBy(18)
            .toFixed(0),
          to: api.account || '',
          oracleCallFee: '0.01',
          sendETHValue: api.Tokens.ETH.parse(toBigNumber(0.01).plus(content.token0.amount)).toFixed(0),
        }

        if (JSON.stringify(newArgs) !== JSON.stringify(args)) {
          setArgs(newArgs)
        }
      } else if (content.token0.symbol) {
        // find Single-Sided Pool
        const pool = api.CoFixAnchorPools[content.token0.symbol]

        const token = api.Tokens[content.token0.symbol]

        const liquidity = toBigNumber(content.token0.amount)
        if (!liquidity.isNaN()) {
          content.liquidity = liquidity.toFixed(6)
          setLiquidity(content.liquidity)
        }

        const newArgs = {
          pool: pool.address || '',
          token: token.address || '',
          amountETH: '0',
          amountToken: token.parse(content.token0.amount).toFixed(0),
          liquidity: liquidity.toFixed(6),
          liquidityMin: liquidity
            .multipliedBy(1 - slippageTolerance)
            .shiftedBy(18)
            .toFixed(0),
          to: api.account || '',
          sendETHValue: api.Tokens.ETH.parse(toBigNumber(0).plus(content.token0.amount)).toFixed(0),
        }
        if (JSON.stringify(args) !== JSON.stringify(newArgs)) {
          setArgs(newArgs)
        }
      } else {
        setArgs(undefined)
      }
    })()
  }, [
    api,
    content.token0.amount,
    content.token0.symbol,
    content.token1?.amount,
    content.token1?.symbol,
    content.autoStake,
  ])

  const handler = useCallback(async () => {
    const transaction = await push(
      {
        type: TransactionType.AddLiquidity,
        content: {
          ...content,
          liquidity: args?.liquidity,
        },
      },
      async () => {
        if (!api || !api.Contracts.CoFiXRouter.contract || !args) {
          return
        }

        if (content.autoStake) {
          return api.Contracts.CoFiXRouter.contract.addLiquidityAndStake(
            args.pool,
            args.token,
            args.amountETH,
            args.amountToken,
            args.liquidityMin,
            args.to,
            deadline(),
            {
              value: args.sendETHValue,
            }
          )
        } else {
          return api.Contracts.CoFiXRouter.contract.addLiquidity(
            args.pool,
            args.token,
            args.amountETH,
            args.amountToken,
            args.liquidityMin,
            args.to,
            deadline(),
            {
              value: args.sendETHValue,
            }
          )
        }
      }
    )

    return transaction
  }, [args, content.autoStake])

  return { liquidity, handler, oracleCallFee: args?.oracleCallFee }
}

export default useAddLiquidity
