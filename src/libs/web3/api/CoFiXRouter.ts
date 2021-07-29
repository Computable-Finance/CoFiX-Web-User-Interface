import { CoFiXRouter__factory, CoFiXRouter as TypeCoFiXRouter } from 'src/abis/types/cofix'
import API from '.'
import Contract, { ContractProps } from './Contract'

export type CoFiXRouterProps = ContractProps

class CoFiXRouter extends Contract {
  contract?: TypeCoFiXRouter

  private _pairFor: {
    [symbol: string]: {
      [symbol: string]: string
    }
  }

  private _routerPath: {
    [symbol: string]: {
      [symbol: string]: Array<string>
    }
  }

  constructor(api: API, props: CoFiXRouterProps) {
    super(api, props)

    if (this.address && this.api.provider) {
      this.contract = CoFiXRouter__factory.connect(this.address, this.api.provider?.getSigner() || this.api.provider)
    }

    this._pairFor = {}
    this._routerPath = {}
  }

  async pairFor(token0: string, token1: string) {
    if (!this.contract) {
      return
    }

    if (!this._pairFor[token0]) {
      this._pairFor[token0] = {}
    }

    if (!this._pairFor[token0][token1]) {
      if (token0 === 'ETH' || token1 === 'ETH') {
        this._pairFor[token0][token1] = [token0, token1].join('-')
      } else {
        const address = await this.contract.pairFor(
          this.api.Tokens[token0].address || '',
          this.api.Tokens[token1].address || ''
        )

        this._pairFor[token0][token1] = address
      }
    }

    return this._pairFor[token0][token1]
  }

  async getRouterPath(src: string, dest: string) {
    if (!this.contract) {
      return
    }

    if (!this._routerPath[src]) {
      this._routerPath[src] = {}
    }
    if (!this._routerPath[src][dest]) {
      try {
        const address = await this.contract.getRouterPath(
          this.api.Tokens[src].address || '',
          this.api.Tokens[dest].address || ''
        )

        this._routerPath[src][dest] = address
      } catch (e) {
        console.error(e)
      }
    }

    return this._routerPath[src][dest]
  }
}

export default CoFiXRouter
