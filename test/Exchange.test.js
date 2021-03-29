const { default: Web3 } = require('web3')
import { ether, tokens, EVM_REVERT, ETHER_ADDRESS } from "./helpers"
const Token = artifacts.require("./Token")
const Exchange = artifacts.require("./Exchange")

require('chai').use(require('chai-as-promised')).should()

contract('Exchange', ([deployer, feeAccount, user1]) => {
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

})