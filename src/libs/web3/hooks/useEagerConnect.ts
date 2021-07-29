import { useEffect, useState } from 'react'
import useWeb3 from './useWeb3'
import injected from '../connectors/injected'

const useEagerConnect = () => {
  const { activate, active } = useWeb3()

  const [tried, setTried] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const isAuthorized = await injected.connector.isAuthorized()
        if (isAuthorized) {
          activate(injected, undefined, true)
        }
      } finally {
        setTried(true)
      }
    })()
  }, [])

  useEffect(() => {
    if (!tried && active) {
      setTried(true)
    }
  }, [tried, active])

  return tried
}

export default useEagerConnect
