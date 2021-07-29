import { useEffect } from 'react'

import useWeb3 from './useWeb3'

const useInactiveListener = (suppress = false) => {
  const { active, error, activate, refresh } = useWeb3()

  useEffect(() => {
    const { ethereum } = window

    if (!ethereum || !ethereum.on) {
      return
    }

    if (active || error || suppress) {
      return
    }

    ethereum.on('chainChanged', refresh)
    ethereum.on('accountsChanged', refresh)

    return () => {
      if (ethereum.removeListener) {
        ethereum.removeListener('chainChanged', refresh)
        ethereum.removeListener('accountsChanged', refresh)
      }
    }
  }, [active, error, suppress, activate])
}

export default useInactiveListener
