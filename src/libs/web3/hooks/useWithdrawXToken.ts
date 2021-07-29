import { useCallback } from 'react'
import { toBigNumber } from '../util'
import useTransaction, { TransactionWithdrawXTokenContent, TransactionType } from './useTransaction'
import useWeb3 from './useWeb3'

const useWithdrawXToken = (content: TransactionWithdrawXTokenContent) => {
  const { api } = useWeb3()
  const { push } = useTransaction()

  const handler = useCallback(async () => {
    return push(
      {
        type: TransactionType.WithdrawXToken,
        content,
      },
      async () => {
        if (!api) {
          return
        }
        const address = content.token1
          ? api.CoFiXPairs[content.token0][content.token1].address
          : api.CoFixAnchorPools[content.token0].xtokens[content.token0].address

        if (!address) {
          return
        }

        return api.Contracts.CoFiXVaultForStaking.contract?.withdraw(
          address,
          toBigNumber(content.amount).shiftedBy(18).toFixed(0)
        )
      }
    )
  }, [api, content.amount, content.token0, content.token1])

  return { handler }
}

export default useWithdrawXToken
