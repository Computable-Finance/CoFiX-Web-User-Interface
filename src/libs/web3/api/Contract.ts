import { BaseContract } from 'ethers'
import API from '.'

export type ContractProps = {
  addresses: Record<number, string> | string
}

class Contract {
  api: API
  addresses: Record<number, string> | string
  address?: string

  contract?: BaseContract

  constructor(api: API, props: ContractProps) {
    this.api = api
    this.addresses = props.addresses
    if (api.chainId) {
      this.address = typeof props.addresses === 'string' ? props.addresses : props.addresses[api.chainId]
    }
  }

  async init() {
    // comment blank for eslint
  }
}

export default Contract
