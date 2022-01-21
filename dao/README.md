Project Spec
You are writing a contract for Collector DAO, a DAO that aims to collect rare NFTs. This DAO wishes to have a contract that:

Allows anyone to buy a membership for 1 ETH
Allows a member to propose an NFT to buy
Allows members to vote on proposals:
With a 25% quorum
If passed, have the contract purchase the NFT in a reasonably automated fashion.
YOU MUST DOCUMENT YOUR VOTING SYSTEM! In this project you have some flexibility on how you implement voting. Because of this, you must document:

The design decisions you made when creating your voting system
The risks and tradeoffs of said system
You must TEST your voting system!
Implementation requirements:

Even though this DAO has one main purpose, write your proposal system to support calling arbitrary functions, then use this to implement the NFT-buying behavior.
Write a function that accepts, validates, and writes vote signatures. Then write a function to do this in bulk.
Here is the interface you can assume exists for buying NFTs:

interface NftMarketplace {
    function getPrice(address nftContract, uint nftId) external returns (uint price);
    function buy(address nftContract, uint nftId) external payable returns (bool success);
}
DO NOT use third party libraries for this project. You are free to reference other governance contract implementations, but you must write your own from scratch.


Designing the system:  I model the proposal and voting system based off the Compound Governance Dao. 
Propsal system: Only members can propose
                Proposal requires the signature function of the called NFT marketplace
                Only 4 stages for each proposal
                   1. Active 
                   2. Defeated 
                   3. Approved
                   4. Executed 
Voting system:   Token base voting (although not using tokens - Based on membership of 1 ETH     
                  Need quorum of 25% and majority votes for to be approved and executed
                  Voting is available for 3 days after a member makes a proposal
                  Members need to vote by signature (Only members can vote - and one vote per member  - No delegation allowed
                  To save on guess fees, members can sign a vote and provide it to another member, for bulk voting (ie- send in batches)) 
                  Members can abstain - which will be counted for the quorumm   
                

Shortfall of token voting are:
Whales have a large influence. A few people end up making deciding swings in most proposals.
Shortsighted voting. If the token is tradable, holders may vote to make the price of the token go up at the expense of the project's longetivity.
Lopsided voting interest. Other parts of the community may not get the same voting power.
One way to mitigate the second point is to have a separate, non-tradable token for voting. But that introduces complexity.          



Design Exercises
Per project specs, there is no vote delegation. This means for someone's vote to count, they must manually participate every time. How would you design your contract to allow for non-transitive vote delegation?

  I would design the system to prevent votes to be automatically delegated to someone who you did request.
  Example would be when A -> B,  Then B -> C.  A's vote should not be automatically delegated to C.  I would set up system for the vote to return back to A. 

What are some problems with implementing transitive vote delegation on-chain? (Transitive means: If A delegates to B, and B delegates to C, then C gains voting power from both A and B, while B has no voting power).
Issues with implementing transitive vote delegation is keeping track of who delegated to who. Issues can arise when votes are transfered like  A ->  B    Then B -> C,  Then system needs to make sure that C -> A doesn't occur  (C doesn't send the votes back to A because the cycle will start again and go in circles. System needs to prevent C of delegating votes back to A)    Also, need to come up with design decision, on when B -> C, then A -> B (ie after B delegated his/her votes to C)  B will need to be allowed to vote unless there was a time frame set up for allowing B to keep on delegating his/her votes to C  after B delegated his/her vote previously.

