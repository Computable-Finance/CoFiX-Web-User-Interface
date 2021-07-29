import loadable from '@loadable/component'
import React from 'react'
import { HashRouter as Router, Redirect, Route, Switch } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import Footer from 'src/pages/shared/Footer'
import Header from 'src/pages/shared/Header'
import TransactionModal from 'src/pages/shared/TransactionModal'

import RiskModal from './shared/RiskModal'

const Swap = loadable(() => import('./Swap'))
const Pool = loadable(() => import('./Pool'))
const Mining = loadable(() => import('./Mining'))
const Repurchase = loadable(() => import('./Repurchase'))

function App() {
  return (
    <main>
      <TransactionModal />
      <RiskModal />
      <ToastContainer />

      <Router>
        <Header />

        <Switch>
          <Route path="/swap">
            <Swap />
          </Route>

          <Route path="/pool">
            <Pool />
          </Route>

          <Route path="/mining">
            <Mining />
          </Route>

          <Route path="/repurchase">
            <Repurchase />
          </Route>

          <Redirect to="/swap" />
        </Switch>

        <Footer />
      </Router>
    </main>
  )
}

export default App
