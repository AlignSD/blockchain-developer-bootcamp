const { default: Web3 } = require('web3')
import { ether, tokens, EVM_REVERT, ETHER_ADDRESS } from "./helpers"
const Token = artifacts.require("./Token")
const Exchange = artifacts.require("./Exchange")

require('chai').use(require('chai-as-promised')).should()

contract('Exchange', ([deployer, feeAccount, user1, user2]) => {
  let exchange
  let feePercent = 10
  let token

  beforeEach(async () => {
    //deploy token
    token = await Token.new()
    //Transfer tokens to user1
    token.transfer(user1, tokens(100), { from: deployer })
    //Fetch token form blockchain
    exchange = await Exchange.new(feeAccount, feePercent) //pass feeAccount to exchange constructor
  })

  describe("deployment", () => {
    it("tracks the fee account", async () => {
      const result = await exchange.feeAccount()
      result.should.equal(feeAccount);
    })

    it("tracks the fee percent", async () => {
      const result = await exchange.feePercent()
      result.toString().should.equal(feePercent.toString());
    })
  })

  describe('fallback', () => {
      it('reverts when Ether is sent', async () => {
          await exchange.sendTransaction({ value: 1, from: user1}).should.be.rejectedWith(EVM_REVERT)
      })
  })

  describe('depositing Ethereum', async () => {
      let result
      let amount
      beforeEach(async () => {
        amount = ether(1)
        result = await exchange.depositEther({ from: user1, value: amount})
      })
      it('tracks the Ether deposit amount', async () => {
          const balance = await exchange.tokens(ETHER_ADDRESS, user1)
          balance.toString().should.equal(amount.toString());
      })
      it('emits a deposit event', async () => {
        const log = result.logs[0]
        log.event.should.equal('Deposit')
        const event = log.args
        event.token.toString().should.equal(ETHER_ADDRESS, "token address is correct")
        event.user.should.equal(user1, "user address is correct")
        event.amount.toString().should.equal(amount.toString(), 'amount is correct')
        event.balance.toString().should.equal(amount.toString(), 'balance is correct')

    })
  })

  describe('withdrawing Ether', async () => {
    let result
    let amount

    beforeEach(async () => {
      amount = ether(1)
      await exchange.depositEther({ from: user1, value: amount})
    })

    describe('success', async () => {
      beforeEach(async () => {
        result = await exchange.withdrawEther(amount, { from: user1 })
      })

      it('withdrawws Ether funds', async () => {
        const balance = await exchange.tokens(ETHER_ADDRESS, user1)
        balance.toString().should.equal('0')
      })

      it('emits a "withdraw" event', async () => {
        const log = result.logs[0]
        log.event.should.eq("Withdraw")
        const event = log.args
        event.token.should.equal(ETHER_ADDRESS)
        event.user.should.equal(user1)
        event.amount.toString().should.equal(amount.toString())
        event.balance.toString().should.equal('0')
      })
    })

    describe('failure', async () => {
      it('rejects withdraws for inssufficient funds', async () => {
        await exchange.withdrawEther(ether(100), { from: user1 }).should.be.rejectedWith(EVM_REVERT)
      })
    })
  })

  describe("depositing tokens", () => {
      let result
      let amount
      
  describe('success', () => {
    beforeEach(async () => {
        amount = tokens(10)
        await token.approve(exchange.address, tokens(10), { from: user1 })
        result = await exchange.depositToken(token.address, tokens(10), { from: user1 })
        })

    it("tracks the fee account", async () => {
    let balance 
    balance = await token.balanceOf(exchange.address)
    balance.toString().should.equal(amount.toString())

    //check tokens on exchange
    balance = await exchange.tokens(token.address, user1)
    balance.toString().should.equal(amount.toString())
})

    it('emits a deposit event', async () => {
        const log = result.logs[0]
        log.event.should.equal('Deposit')
        const event = log.args
        event.token.toString().should.equal(token.address, "token address is correct")
        event.user.should.equal(user1, "user address is correct")
        event.amount.toString().should.equal(amount.toString(), 'amount is correct')
        event.balance.toString().should.equal(amount.toString(), 'balance is correct')

    })
})

  describe('failure', () => {
    it('rejects Ether Deposit', async () => {
        // TODO fill me in....
    await exchange.depositToken(ETHER_ADDRESS, tokens(10), { from: user1}).should.be.rejectedWith(EVM_REVERT)
    })

    it("fails when no tokens are approved", async () => {
    //Dont approve any tokens before depositing them
    await exchange.depositToken(token.address, tokens(10), { from: user1 }).should.be.rejectedWith(EVM_REVERT)
    })
    })  
  })

  describe('withdrawing Tokens', async () => {
  let result
  let amount

  describe('success', async () => {
    beforeEach(async () => {
      amount = tokens(10)
      await token.approve(exchange.address, amount, { from: user1 })
      await exchange.depositToken(token.address, amount, { from: user1 })

      //withdraw Tokens
      result = await exchange.withdrawToken(token.address, amount, { from: user1 })
    })

    it('withdraws Token funds', async () => {
      const balance = await exchange.tokens(token.address, user1)
      balance.toString().should.equal('0')
    })

    it('emits a "withdraw" event', async () => {
      const log = result.logs[0]
      log.event.should.eq("Withdraw")
      const event = log.args
      event.token.should.equal(token.address)
      event.user.should.equal(user1)
      event.amount.toString().should.equal(amount.toString())
      event.balance.toString().should.equal('0')
    })
  })

  describe('failure', async () => {
    it('rejects withdraws for inssufficient token funds', async () => {
      await exchange.withdrawToken(token.address, tokens(10), { from: user1 }).should.be.rejectedWith(EVM_REVERT)
    })

    it('rejects Ether  withdraws ', async () => {
      await exchange.withdrawToken(ETHER_ADDRESS, tokens(10), { from: user1 }).should.be.rejectedWith(EVM_REVERT)
    })
  })
  })

  describe('checking balances', async () => {
    beforeEach(async () => {
      exchange.depositEther({ from: user1, value: ether(1)})
    })

    it('returns user balance', async () => {
      const result = await exchange.balanceOf(ETHER_ADDRESS, user1)
      result.toString().should.equal(ether(1).toString())
    })
  })

  describe('making orders', async () => {
    let result;

    beforeEach(async() => {
      result = await exchange.makeOrder(token.address, tokens(1), ETHER_ADDRESS, ether(1), { from: user1 })
    })

    it(" tracks the newly created order", async () => {
      const orderCount = await exchange.orderCount()
      orderCount.toString().should.equal('1')
      const order = await exchange.orders('1')
      order.id.toString().should.equal('1', 'id is correct')
      order.user.should.equal(user1, 'user is correct')
      order.tokenGet.should.equal(token.address, 'tokenGet is correct')
      order.amountGet.toString().should.equal(tokens(1).toString(), 'amountGet is correct')
      order.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is correct')
      order.amountGive.toString().should.equal(ether(1).toString(), 'amountGive is correct')
      order.timestamp.toString().length.should.be.at.least(1, 'timestamp is present')
    })

    it('emits an Order event', async () => {
      const log = result.logs[0]
      log.event.should.eq('Order')
      const event = log.args
      event.id.toString().should.equal('1', 'id is correct')
      event.user.should.equal(user1, 'user is correct')
      event.tokenGet.should.equal(token.address, 'tokenGet is correct')
      event.amountGet.toString().should.equal(tokens(1).toString(), 'amountGet is correct')
      event.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is correct')
      event.amountGive.toString().should.equal(ether(1).toString(), 'amountGive is correct')
      event.timestamp.toString().length.should.be.at.least(1, 'timestamp is present')
    })
  })

  describe('order actions', async () => {

    beforeEach(async() => {
      await exchange.depositEther({ from: user1, value: ether(1)})
      await exchange.makeOrder(token.address, tokens(1), ETHER_ADDRESS, ether(1), { from: user1 })
    })

    describe('cancelling orders', async () => {
      let result

      describe('success', async () => {
        beforeEach(async() => {
          result = await exchange.cancelOrder('1', { from: user1})
        })

        it('updates cancelled orders', async () => {
          const orderCancelled = await exchange.orderCancelled(1)
          orderCancelled.should.equal(true)
        })

        it('emits a "cancel" event', async () => {
          const log = result.logs[0]
          log.event.should.eq('Cancel')
          const event = log.args
          event.id.toString().should.equal('1', 'id is correct')
          event.user.should.equal(user1, 'user is correct')
          event.tokenGet.should.equal(token.address, 'tokenGet is correct')
          event.amountGet.toString().should.equal(tokens(1).toString(), 'amountGet is correct')
          event.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is correct')
          event.amountGive.toString().should.equal(ether(1).toString(), 'amountGive is correct')
          event.timestamp.toString().length.should.be.at.least(1, 'timestamp is present')
        })
      })

      describe('Failure', async () => {
        it('rejects invalid order ids', async () => {
          const invalidOrderId = 99999;
          await exchange.cancelOrder(invalidOrderId, { from: user1 }).should.be.rejectedWith(EVM_REVERT)
        })

        it('rejects unauthorized cancelations', async () => {
          await exchange.cancelOrder('1', { from: user2 }).should.be.rejectedWith(EVM_REVERT)
        })
      })
    })
  })
})