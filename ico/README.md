Project: Space Coin ICO
In this project you're going to create your token and ICO. In doing so you will:

Write your own ERC-20 token
Write an ICO contract
Deploy to a testnet
Write a frontend for investors to send ETH to a contract
Getting Started
Use hardhat to create a new project, then write the following contracts.

The Space Coin Token
OpenZeppelin has a contract library for ERC-20 (docs). Use this library when creating your token.

This token should have:

500,000 max total supply
A 2% tax on every transfer that gets put into a treasury account
A flag that toggles this tax on/off, controllable by owner, initialized to false
The ICO Contract
Here's the spec:

The smart contract aims to raise 30,000 Ether by performing an ICO. The ICO should only be available to whitelisted private investors starting in Phase Seed with a maximum total private contribution limit of 15,000 Ether and an individual contribution limit of 1,500 Ether. The ICO should become available to the general public during Phase General, with a total contribution limit equal to 30,000 Ether, inclusive of funds raised from the private phase. During this phase, the individual contribution limit should be 1,000 Ether, until Phase Open, at which point the individual contribution limit should be removed. At that point, the ICO contract should immediately release ERC20-compatible tokens for all contributors at an exchange rate of 5 tokens to 1 Ether. The owner of the contract should have the ability to pause and resume fundraising at any time, as well as move a phase forwards (but not backwards) at will.

Deployment
Once you complete these contracts, deploy to the Rinkeby testnet https://hardhat.org/tutorial/deploying-to-a-live-network.html

The Frontend
Your frontend should be a web page that:

Displays how many tokens the user has purchased
Allows the user to deposit ETH into your ICO contract
Shows error messages when user makes an invalid request (i.e. attempting to deposit beyond the limit)

Design Exercises
The base requirements give contributors their SPC tokens immediately. How would you design your contract to vest the awarded tokens instead, i.e. award tokens to users over time, linearly? 

 I would allow user to be able to redeem quaterly for up to 4 quarters.  25% of their total SPC for each quarter. It would be based on their starting date of purchase. Thus, I would need to keep track of the starting date of each purchase and calculate the quarterly time period they are allowed to redeem.  The contract would need to keep track of the total amt allowed for each quarter, and keep total of the SPC that each user has redeemed for the quarter and the total in all.  
   
