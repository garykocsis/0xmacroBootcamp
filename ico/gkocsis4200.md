The following is a micro audit of https://github.com/Hacker-DAO/student.gkocsis4200/tree/70f625b71f072df1453e3e756e2c113750b5bd10/ico by Melvillian

## Design Exercise

Cool, that'll work for a vesting "cliff" before which 0% of the SPC is redeemable, and after which 100% is. However, this design exercise asked how you could implement a "linear" vesting schedule. So that for example, a user would be able to redeem 35% of their total SPC if it was 35% of the way past the starting date and before the full redemption date. I gave you half points because I think you only answered half the question.

## General Comments

1. I wasn't able to `npx hardhat compile` or `npx hardhat test` your code because of some problem with the `hardhat-upgrades` dependency. You should remove that dependency for future projects, because it's purpose is to help you work with OpenZeppelin's upgradeable contracts, but you don't actually work with any of those. Once I removed it and re-installed dependencies, I ran the tests and had multiple failing. I've copied the failing output below:

```
  3 failing

  1) SpaceCoin
       ERC functions
         transfer:

      AssertionError: Expected "149995000000000000000000" to be equal 995000000000000000000
      + expected - actual

       {
      -  "_hex": "0x35f0661c4399ac0000"
      +  "_hex": "0x1fc33ec8406e2ccc0000"
         "_isBigNumber": true
       }

      at Context.<anonymous> (test/SpaceCoin.js:129:65)

  2) SpaceCoin
       ERC functions
         transferfrom:

      AssertionError: Expected "149995000000000000000000" to be equal 995000000000000000000
      + expected - actual

       {
      -  "_hex": "0x35f0661c4399ac0000"
      +  "_hex": "0x1fc33ec8406e2ccc0000"
         "_isBigNumber": true
       }

      at Context.<anonymous> (test/SpaceCoin.js:166:65)

  3) SpaceICO
       redeem :
     Uncaught Error: Transaction reverted: function call to a non-contract account
      at SpaceICO.transfer (contracts/SpaceICO.sol:135)
      at SpaceICO.redeem (contracts/SpaceICO.sol:117)
      at HardhatNode._mineBlockWithPendingTxs (node_modules/hardhat/src/internal/hardhat-network/provider/node.ts:1650:23)
      at HardhatNode.mineBlock (node_modules/hardhat/src/internal/hardhat-network/provider/node.ts:459:16)
      at EthModule._sendTransactionAndReturnHash (node_modules/hardhat/src/internal/hardhat-network/provider/modules/eth.ts:1496:18)
      at HardhatNetworkProvider.request (node_modules/hardhat/src/internal/hardhat-network/provider/provider.ts:117:18)
      at EthersProviderWrapper.send (node_modules/@nomiclabs/hardhat-ethers/src/internal/ethers-provider-wrapper.ts:13:20)
```

2. SpaceCoin.sol looks good!

3. Word of advice, instead of the ambiguous `uint`, use `uint256`, it is more readable and its unambiguous how many bits it can hold. I wish they got rid of `uint`...

4. In line 26, it makes it difficult to read your contract when you do not group all of your storage variables all together at the top of the contract. Your `phase` contract is declared after the bulk of storage variables, and so I am likely to miss it unless I am carefully reading it.

5. I love your heavy commenting in SpaceICO.sol, they contribute to overall readability, but are not over-doing it. Nice job!

## Specific Code Comments

### issue-1

**[High]** `SpaceCoin.addAllowList` is not protected by `onlyOwner`

So anyone can add themselves as a whitelisted user.

### issue-2

**[Medium]** `SpaceCoin.redeem` does not have a check for `pause`

Usually we want the pause logic to lock down all non-owner functions, so that an owner can come in and upgrade the system in the event of a bug or a protocol upgrade. `redeem` is useable by anyone, so it should be locked down when the contrat is paused

### issue-3

**[Lack of Understanding of Technical Requirement]** in the `SpaceCoin.contribute` You use the `genPhaseContr` variable to distinguish between funds added in the Seed phase vs. the General phase. However, this is not part of the spec; the 1000 ETH limit in the General phase is inclusive of the 1500 ETH limit in the Seed phase. The code would be simpler if you didn't distinguish.

### issue-4

**[Lack of testing]** Several code paths are not covered sufficiently in your tests. I am afraid of software, so untested code == broken code.

1. need to test that `SpaceCoin.transfer` handles taxation correctly
2. `redeem` code path is never tested to see if it transfer SPC successfully

### issue-5

**[gas efficiency]** The `_treasury` argument in your `SpaceCoin.mint` call is redundant, since you already have the storage variable `treasury` on the account. This isn't a security problem so I won't take off points, but it does needlessly waste gas by increasing the size of your calldata.

### issue-6

**[gas efficiency]** The `allowAddresses` in `SpaceCoin.addAllowList` is redundant and can be removed. You can just use `_allowList` directly without creating a copy of it in-memory.

### issue-7

**[gas efficiency]** the `checkTotal` in-memory variable is redundant and costs more gas. Plus I don't think it helps with readability because, as a smart contract engineer, I'm used to the existence of in-memory variables signifying that this is a variable that will be used to store some aggregate information, like the sum of all balances in a set of accounts.

## Score

| Reason | Score |
|-|-|
| Late                       | -   |
| Unfinished features        | -   |
| Extra features             | 1   |
| Vulnerability              | 5   |
| Lack of Testing            | 2   |
| Unanswered design exercise | 0.5 |

Total: 8.5
Good Effort!
