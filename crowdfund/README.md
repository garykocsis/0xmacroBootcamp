Initial Project Spec:

A non-technical client hires you to build them a "kickstarter clone". They give you the following spec:

Build a smart contract that allows creators to register their projects. Other people can contribute ETH to that project. Once the goal has been met, the creators can withdraw the funds. When someone contributes 1 ETH, they receive a contributor badge NFT, which is tradable.

If you don't think this is a great spec, you're on the right track. As a security engineer, you should immediately be trying to figure out everything that could possibly go wrong with a new project's description.

You should be asking yourself questions such as:

Is this spec complete? What use cases are missing?
What edge cases does this spec not cover?
Are the incentives properly aligned with the goal of the project?
What are the upper and lower bounds ol all values in the system?
What additional rules or constraints must be implemented to prevent hackers from exploiting the system?
Project Deliverables
Ask your assigned roleplay non-technical client questions about the spec during day 1.
During day 2, staff will reveal all the "secret" requirements that were not mentioned in the original spec, as well as additional constraints and requirements that must be written into the contract for proper security.

Based on the questions asked, the following are additional requirements:

- The smart contract is reusable; multiple projects can be registered and accept ETH concurrently.
  - Specifically, you should use the factory contract pattern.
- The goal is a preset amount of ETH.
  - This cannot be changed after a project gets created.
- Regarding contributing:
  - The contribute amount must be at least 0.01 ETH.
  - There is no upper limit.
  - Anyone can contribute to the project, including the creator.
  - One address can contribute as many times as they like.
  - No one can withdraw their funds until the project either fails or gets cancelled.
- Regarding contributer badges:
  - An address receives a badge if their **total contribution** is at least 1 ETH.
  - One address can receive multiple badges, but should only receive 1 badge per 1 ETH.
- If the project is not fully funded within 30 days:
  - The project goal is considered to have failed.
  - No one can contribute anymore.
  - Supporters get their money back.
  - Contributor badges are left alone. They should still be tradable.
- Once a project becomes fully funded:
  - No one else can contribute (however, the last contribution can go over the goal).
  - The creator can withdraw any amount of contributed funds.
- The creator can choose to cancel their project before the 30 days are over, which has the same effect as a project failing.


Additional Design exercise.
Design Exercises
Smart contracts have a hard limit of 24kb. Crowdfundr hands out an NFT to everyone who contributes. However, consider how Kickstarter has multiple contribution tiers. How would you design your contract to support this, without creating three separate NFT contracts?
     -  I would make the token unique for each tier. 
     -  the tokenID that was created could be manipulated to indicate each tier
     -  Bit manipulation could make it unique
     -  Shift bits to left by 2 positions and replace the last two bits with a tier indicator
     -  Can create new method to be able to identify a token by its tier.