https://github.com/Hacker-DAO/student.gkocsis4200/tree/84156968d5c74aa1280a4515f92de2e6b4a97781/lp by Melvillian

# General Comments

1. Frontend works as expected. Woo! You forgot to fill in the `ico_spc_left` variable, though.

2. Tests have good statement coverage, but I didn't see any tests for when SpaceCoin has its tax turned on. This is an important case to test because it's an easy spot to not implement correctly

3. Some lines in your test are confusing, for instance look here for how the code and comments differ in their numeric values:

```javascript
// lp tokens return 67082.03932499369088227'
let liq = ethers.utils.parseEther("6708.203932499369088227");
```

4. Good job writing your `LP.sol` functions in a way that will make them work with tax-token likes SPC!

5. In several functions you pass in arguments that are redundant (`ethAdded` in `mint` and `swap`, and `liquidity` in `burn`). In `burn`'s it resulted in a High Severity bug (see description down below) that rekted your contract. In the future, consider every single argument you pass to a function, and in particular consider if it's possible to remove it.


# Design Exercise

OK, I can sorta follow what you're describing. But I'm not sure what you mean by "new special ERC-20 token"; how will this token have value? Will it be some well-known token like USDC or a token you make just for liquidity rewards? Also, when you say "To participate in this program, I would require the liquidity provider to whitelist their address and add liquidity to the pool." what token(s) would this liquidity be? Normally from what I've seen the token they provide is the LP token, but were you thinking something else?

# Issues

**[High]** `burn` can be used to drain the entire contents of the pool

`LP.burn` accepts a `liquidity` argument, which ends up being the amount of LP token that gets burned. However, the `liquidityBal` is what gets used to calculate the payout for the user burning `liquidity` amount of LP token. So a malicious user can drain the entire pool by sending an arbitrary amount of LP token (the more LP token the attacker uses, the fewer transactions they need to make) directly to the pool, and then calling `LP.burn(attackerAddress, 0)`.
The fix is to get rid of the user-controlled `liquidity` argument, and use `liquidityBal` for both payout calculation and burn amount. See the test below which reproduces the exploit.

```javascript
it.only("attack lp pool by calling mit", async () => {
    // set to open phase   
    await spaceico.nextPhase();
    await spaceico.nextPhase();

    contribAmt = ethers.utils.parseEther("3000"); 
    await spaceico.connect(addr2).contribute({
    value: contribAmt
    }); 
    expect(await spacecoin.balanceOf(treasury)).to.equal(ethers.BigNumber.from("350000000000000000000000"));

    expect(await provider.getBalance(spaceico.address)).to.equal(contribAmt);
    //let transferAmt = "15000000000000000000000"/ 15000 spc coins 
    let transferAmt = ethers.utils.parseEther("15000"); // "15000000000000000000000"

    //Treasury will approve the Transfer amount for the spacerouter to spend prior to the call in the 
    //SpaceICO to withdraw
    await spacecoin.connect(addr4).approve(spacerouter.address,transferAmt);

    let liq = ethers.utils.parseEther("2236.0"); // lp tokens return 6708.203932499369088227'
    await spaceico.withdrawToLP(transferAmt)

    // treasury will remove liquidity
    // let liq = '6708203932499369088227'

    //Treasury will approve the Transfer amount for the spacerouter to spend prior to the call in the 
    //SpaceRouter to withdraw liquidity (return LP tokens) 

    await lp.connect(addr4).transfer(lp.address,liq);

    console.log(`LP's SPC Balance: ${(await spacecoin.balanceOf(lp.address)).toString()}`)
    console.log(`LP's ETH Balance: ${(await provider.getBalance(lp.address)).toString()}`)
    await lp.burn(addr4.address, 0)

    console.log(`LP's SPC Balance: ${(await spacecoin.balanceOf(lp.address)).toString()}`)
    console.log(`LP's ETH Balance: ${(await provider.getBalance(lp.address)).toString()}`)
    await lp.burn(addr4.address, 0)

    console.log(`LP's SPC Balance: ${(await spacecoin.balanceOf(lp.address)).toString()}`)
    console.log(`LP's ETH Balance: ${(await provider.getBalance(lp.address)).toString()}`)
    await lp.burn(addr4.address, 0)

    console.log(`LP's SPC Balance: ${(await spacecoin.balanceOf(lp.address)).toString()}`)
    console.log(`LP's ETH Balance: ${(await provider.getBalance(lp.address)).toString()}`)

})
```

**[Technical Mistake]** `LP.sol` should calculate a 1% tax, but instead calculates a 0.1% tax

In this line:

`uint balanceSpcAdjusted = balanceSpc * (1000) - (amountSpcIn * (1));`

It should be `100` instead of `1000`

Same thing for the Router's `getAmountOut`

**[Technical Mistake]** `SpaceRouter.addLiquidity` assumes `to` argument is `msg.sender`

The purpose of the `to` argument is to make it so the LP tokens can be sent to a contract that's different than `msg.sender`, however your `addLiquidity` function assumes `to` is equal to `msg.sender` because in line 46
`spaceCoin.transferFrom(to, address(lp), amountToken);`
you pull funds from the `to` address. The idea behind differentiating `msg.sender` and `to` is so that the caller can provide the liquidity (via the `transferFrom`) but then the resulting LP tokens can be sent somewhere else

**[Extra Features]** `lpEthTotal` is an unneeded variable to track ETH balances in.

You already have `reserveEth`, why do you need an extra storage variable? This extra storage variable increases the attack surface of the pool since you can always use `reserveEth` along with `msg.value` to calculate what you're currently using `lpEthTotal` for.

**[Technical Mistake]** `LP.sol` functions do not follow checks-effects-interaction pattern

In this particular case, since all of your `LP.sol` functions are locked down, you are safe. But it is a _really bad idea_ to fail to, by default, write your code in a manner that adhers to [checks-effects-interaction](https://docs.soliditylang.org/en/v0.8.9/security-considerations.html?highlight=checks%20effect#use-the-checks-effects-interactions-pattern). One slip-up, like a failure to `lock` all of your functions, and you could expose your contract to vulnerabilities. Next time please do not update storage variables _after_ making an external function call.

# Nitpicks

- Your reentrancy guard is implemented using the `unlocked` storage variable, which switches between 1 and 0. It would be more efficient to switch between 1 and 2, because SSTORE'ing a variable from 0 to 1 is much more costly than a non-zero value to a non-zero value. See OZ's ReentrancyGuard https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/security/ReentrancyGuard.sol#L29

- the `ethAdded` argument in `LP.mint` is unnecessary. Because of the line `require(msg.value == ethAdded, "ETH_OUT_OF_SYNC");` we know that `ethAdded` is the same as `msg.value`, so we don't even use `ethAdded`, and we shouldn't because it wastes gas by bloating the calldata.

# Score

| Reason | Score |
|-|-|
| Late                       | - |
| Unfinished features        | - |
| Extra features             | 1 |
| Vulnerability              | 3 |
| Unanswered design exercise | - |
| Insufficient tests         | - |
| Technical mistake          | 4 |

Total: 8
Good effort!
