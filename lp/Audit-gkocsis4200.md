## **Liquidity Pool Audit**

By Brian

Comments: Great job! Overall very clean, secure, and readable. No major vulnerabilities, just some considerations for style and gas optimizations.

## **Nitpicks**

***LP.sol***

- Consider not using a separate storage variable for the contract's ETH total (`lpEthTotal`). 1) saves on gas, and 2) when you're re-reading ETH balance with `address(this).balance` you ensure the value is always up to date and the cache isn't invalidated.
- Consider using interfaces instead of importing contract files directly to save gas.
- In `mint()`: I wasn't sure what purpose `uint ethAdded` served as a function parameter. Is this just a mental check for users to ensure they sent the amount they thought they did? If so, would that better belong in the router vs. LP contract?
- On lines 146/147 you multiply amountSpcIn and amountEthIn by 1. This could be ommitted.

***SpaceRouter.sol***

- Consider not using the functions `getSPCOut()` and `getEthOut()`. It's possible to just call `getAmountOut()` with the correct arguments.
- `_addLiquidity()`: you may not need this function. It checks for a correct ratio of SPC/ETH for adding liquidity, but the LP.sol contract will do this as well. In effect, you're checking twice. In addition, you may not need to force a static initial exchange rate between SPC/ETH as the market will quickly find equilibrium via arbitrage. It could be that conditions have changed by the time an LP is making an initial deposit (press about the token, etc), where a different exchange rate would be more appropriate.

Overall: awesome work, no vulnerabilites I could find!