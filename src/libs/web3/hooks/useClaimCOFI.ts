import { useCallback, useEffect, useState } from 'react'
import useTransaction, { TransactionType, TransasctionClaimCOFIContent } from './useTransaction'
import useWeb3 from './useWeb3'

const useClaimCOFI = (content: TransasctionClaimCOFIContent) => {
  const { api } = useWeb3()
  const { push } = useTransaction()

  const [args, setArgs] = useState<{
    address: string
  }>()
  useEffect(() => {
    if (!api) {
      return
    }

    if (content.token1) {
      const pair = api.CoFiXPairs[content.token0][content.token1]
      if (pair.address) {
        const newArgs = {
          address: pair.address,
        }
        if (JSON.stringify(newArgs) !== JSON.stringify(args)) {
          setArgs(newArgs)
        }
      }
    } else {
      const pool = api.CoFixAnchorPools[content.token0]
      const xtoken = pool.xtokens[content.token0]
      if (xtoken?.address) {
        const newArgs = {
          address: xtoken.address,
        }
        if (JSON.stringify(newArgs) !== JSON.stringify(args)) {
          setArgs(newArgs)
        }
      }
    }
  }, [api, content.token0, content.token1, content.amount])

  const handler = useCallback(async () => {
    return push(
      {
        type: TransactionType.ClaimCOFI,
        content,
      },
      async () => {
        if (!args || !api) {
          return
        }

        return api.Contracts.CoFiXVaultForStaking.contract?.getReward(args.address)
      }
    )
  }, [args, api, content])

  return { handler }
}

export default useClaimCOFI
