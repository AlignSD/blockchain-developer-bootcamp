import React, { Component } from 'react';
import './App.css';
import { connect } from 'react-redux';
import { 
  loadWeb3, 
  loadAccount, 
  loadToken, 
  loadExchange 
} from '../store/interactions';
import { accountSelector } from '../store/selectors'
import Navbar from './navbar'
import Content from './content'
import { contractsLoadedSelector } from '../store/selectors'

class App extends Component {
  componentWillMount() {
    this.loadBlockchainData(this.props.dispatch)
  }

  async loadBlockchainData(dispatch) {
    if (window.ethereum.request({ method: 'eth_requestAccounts' })){
    const web3 = await loadWeb3(dispatch)
    const networkId = await web3.eth.net.getId()
    await loadAccount(web3, dispatch)
    const token = await loadToken(web3, networkId, dispatch)
    if(!token) {
      window.alert('Token smart contract not detected on the current network. Please select another network with Metamask.')
      return
    }
    const exchange = await loadExchange(web3, networkId, dispatch)
    if(!exchange) {
      window.alert('Exchange smart contract not detected on the current network. Please select another network with Metamask.')
      return
    }
  }
}

  render() {
    console.log(this.props.account)
    return (
      <div>
        <Navbar />
        {this.props.contractsLoaded ? <Content /> : <div className='content'></div>}  
        
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    // account: accountSelector(state)
    // TODO fill me in
    contractsLoaded: contractsLoadedSelector(state)
  }
}

export default connect(mapStateToProps)(App);
