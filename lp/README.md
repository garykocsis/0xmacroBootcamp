Project: SpaceCoin Pool
In this project you're going to extend your previous project by writing a liquidity pool contract. In doing so you will:

Learn how liquidity pools work
Write a Uniswap v2 style liquidity pool contract
Deploy to a testnet
Update your Space ICO contract to move its funds to your pool contract
Extend a frontend for liquidity providers to manage their ETH-SPC LP tokens

The SpaceCoin Liquidity Pool
Previously, you wrote an ERC-20 contract for SPC and an ICO contract to get the token off the ground.

Now, it's time to finish bootstrapping your token's ecosystem by writing a liquidity pool contract so your users can buy and sell SPC at will.

ERC-20 & ICO Updates
You may have noticed that your ICO contract spec had nothing to say about its invested ETH funds. With a liquidity contract now in the picture, that's going to change.

Update your contracts to:

Add a withdraw function to your ICO contract that allows you to move the invested funds to your liquidity contract. How exactly you do this is up to you; just make sure it's possible to deposit an even worth of each asset.

Liquidity Pool Contract
Implement a liquidity pool for ETH-SPC. You will need to:

Write an ERC-20 contract for your pool's LP tokens.
Write a liquidity pool contract that:
Mints LP tokens for liquidity deposits (ETH + SPC tokens)
Burns LP tokens to return liquidity to holder
Accepts trades with a 1% fee

SpaceRouter
Transferring tokens to an LP pool requires two transactions:

Trader grants allowance to contract X for Y tokens
Trader invokes contract X to make the transfer
Write a router contract to handles these transactions. Be sure it can:

Add / remove liquidity
Swap tokens, rejecting if the slippage is above a given amount
Frontend
Extend the given frontend code (coming soon) to enable:

LP Management
Allow users to deposit ETH and SPC for LP tokens (and vice-versa)
Trading
Allow users to trade ETH for SPC (and vice-versa)
Configure max slippage
Show the estimated trade value they will be receiving

Design Exercises
How would you extend your LP contract to award additional rewards – say, a separate ERC-20 token – to further incentivize liquidity providers to deposit into your pool?

    I would allow Liquidity providers to accrue rewards based on the percentage share of the overall liquidity pool.  The rewards would be paid in a new special ERC-20 token that would be minted to every liquidity provider that locks ETH and SPC on this liquidy pool for at least one month. These rewards are in addition to the normal 1% fee liquidity providers automatically accrue from the LP transactions. 
    To participate in this program, I would require the liquidity provider to whitelist their address and add liquidity to the pool.  To receive the reward, the liquidity would have to stay in the pool for at least 30 un-interrupted days. If liquidity is removed within the 30 day period, then no reward. Each liquidity provider would accrue rewards based on the percentage of liquidity they provide and paid out at the end of the month.  

    Notes on the design of SpacCoin liquidity project:  
      - SpaceCoin contract
         * In constructor, added the deployment of the new LP contract
      - SpaceICO contract
         * Added new function to set the address of the router contract (onlyOwner)
         * Added new function to withdraw the funds (ETH) by calling the addLiquidity function in the SpaceRouter contract which would add to the LP by calling mint function in the LP contract
             - Required that the ICO contract be in the open phase. 
             - Only owner can invoke the withdraw function
             - Prior to calling this function, the treasury is expected to approve the transfer to the LP
             - Note that the ETH will be coming out of this contract, while the SPC tokens will be provided by the treasury SPC token balances
      - SpaceRouter Contract (new) 
             - Will be deployed in the LP contract
             - Will interact with the LP contract to add/reduce liquidity and swap ETH/SPC
             - Functions:
               * addLiquidity - will accept ETH and SPC tokens  and transfer these assets to the LP contract(pool)
               * removeLiquidity - will accept the LP tokens and determine the appropriate ratio of ETH/SPC to transfer back to the caller (out of the LP). It would then send the LP tokens to the LP contract to burn
               * Two separate SWAP function - one for ETH to SPC swap, and the other for SPC to ETH swap.
                  - This funtion would receive the asset to swap with, along with a minimum amount of the other asset that they expect to receive back.
                  - The function will calculate the amount of the other asset based on the liquidity formula.  If it is less than expected, then no assets will be swapped
                  - The function will send the swapped asset to the LP contract to update balances and reserves
      - LP contract(Liquidity Pool) - New
             - This function is where the reserves of the Eth and Spc are stored. These are used  to calculate the amount of liquidity
             - This function contains functions to mint and burn LP tokens, and to swap ERC/SPC toekns.
             - The ETH transferred to the Pool contract will also be kept as a state variable. Cannot rely on the balance of the ETH in the contract, as ETH could be added to the contract outside the router and would not be added with an appropriate ratio of SPC.

    
