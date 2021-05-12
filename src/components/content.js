import React, { Component } from "react";
import { connect } from "react-redux";
import { exchangeSelector } from "../store/selectors";
import { loadAllOrders, subscribeToEvents } from "../store/interactions";
import OrderBook from "./orderbook";
import Trades from "./trades";
import MyTransactions from "./myTransactions";
import PriceChart from "./priceChart";
import Balance from "./Balance";
import NewOrder from "./NewOrder";
// import Balance from './Balance'
// import NewOrder from './NewOrder'

class Content extends Component {
  componentWillMount() {
    this.loadBlockchainData(this.props);
  }

  async loadBlockchainData(props) {
    const { dispatch, exchange } = props;
    await loadAllOrders(exchange, dispatch);
    await subscribeToEvents(exchange, dispatch);
  }

  render() {
    return (
      <div className="content">
        <div className="vertical-split">
          <Balance />
          <NewOrder />
        </div>
        <OrderBook />
        <div className="vertical-split">
          <PriceChart />
          <MyTransactions />
        </div>
        <Trades />
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    exchange: exchangeSelector(state),
  };
}

export default connect(mapStateToProps)(Content);
