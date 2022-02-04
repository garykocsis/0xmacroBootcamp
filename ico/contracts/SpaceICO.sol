// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import './SpaceCoin.sol';

contract SpaceICO {
    uint128 constant public GOAL_AMT = 30000 ether;    
    uint128 constant public MAX_TOTAL_AMT_SEED = 15000 ether;
    uint128 constant public MAX_IND_AMT_SEED = 1500 ether;
    uint128 constant public MAX_IND_AMT_GENERAL= 1000 ether;

    uint256 public totalAmt;  

    bool public paused;        // indicates if the proejct is paused 

    address public treasury;   // treasury account which holds SPC tokens 
    address public owner;      // owner of the project

    SpaceCoin spaceCoin;       // address to SpaceCoin contract
    
    Phase public phase; 

    mapping(address => bool) public allowList; 
    mapping(address => uint) public contributions; 
    mapping(address => uint) public redeemed; 

    //keep track of the different phases 
    enum Phase{
        Seed, 
        General,
        Open        
    }
   
    event Paused(
        bool pausedInd
     );  

    event Withdraw(
        uint tokenAmt, 
        uint ethAmt
    );

    constructor(address _owner, SpaceCoin _spaceCoin, address _treasury) {
        owner = _owner;
        treasury = _treasury;
        spaceCoin = _spaceCoin;

    }  

    // Modifier to check  for owner
    modifier onlyOwner() {
        require(msg.sender == owner,"NOT OWNER");
        _;
    }

    // Modifier to check  if contract is paused
    modifier notPaused() {
        require(!paused, "PAUSED"); 
        _;
    }

    //add to allow list - only in the Seed Phase   
    function toggleAllowList(address[] calldata addresses, bool toggle) onlyOwner public {
        require(phase == Phase.Seed,"NOT SEED PHASE");
    // add to mapping with indicator true     
        for (uint i = 0; i < addresses.length; i++) {
           allowList[addresses[i]] = toggle;  
        }      
    }

    // Move to next phase   
    function nextPhase() external onlyOwner {
        require(phase != Phase.Open,"Open Phase");

        if (phase == Phase.Seed)
           phase = Phase.General;
        else 
           phase = Phase.Open;        
    }

    //Pause or resume  
    function setPaused(bool _paused) external onlyOwner { 
        paused = _paused;
        emit Paused(
              paused
        );
    }
    
    //contribute - based on rules
    // Seed Phase       - max total private contribution = 15,000 ether
    //                  - max individual contribution = 1,500 ether
    // General Phase    - max total contribution = 30,000 ether (inclusive of Seed amt) 
    //                  - max individual contribution = 1,000
    // Open Phase       - max total contribution = 30,000 ether (inclusive of previous phases)
    //                  - No individual limit 
    // Needs contract not to be paused
    // Cannot contribute once Goal of 30,000 is met  
    function contribute() external payable notPaused {
        require(totalAmt < GOAL_AMT,"GOAL MET");

        if (phase == Phase.Seed) {
           require(allowList[msg.sender],"NOT ON ALLOW LIST");
            // Check max total private contributions limit of 15000 ETHER
           require((totalAmt + msg.value) <= MAX_TOTAL_AMT_SEED,"MAX SEED TOTAL MET"); 
           // Check individual  total private contributions limit of 1500 ETHER
           require((contributions[msg.sender] + msg.value) <= MAX_IND_AMT_SEED,"MAX INDIVIDUAL MET");
        } else if (phase == Phase.General) {
                // Check max total private contributions limit of 15000 ETHER
                 require((totalAmt + msg.value) <= GOAL_AMT,"MAX GENERAL TOTAL MET"); 
              // Check individual  total private contributions limit of 1500 ETHER
                 require((contributions[msg.sender] + msg.value) <= MAX_IND_AMT_GENERAL,"MAX INDIVIDUAL MET");                               
              }  

        // add the contributions to the senders mapping
        contributions[msg.sender] += msg.value;
        totalAmt += msg.value;
    }  

  // Can only redeem if in Open Phase   
    function redeem() external notPaused {        
        require(phase == Phase.Open,"PHASE NOT OPEN"); 
        // calculate coins to redeem  
        uint totalTokens = contributions[msg.sender] * 5 - redeemed[msg.sender]; 
        require(totalTokens > 0,"NOTHING TO REDEEM");
         
        redeemed[msg.sender] += totalTokens;
        spaceCoin.transfer(msg.sender,totalTokens);
   } 

    // returns token amount available for address to be redeemed in Open Phase
    // Based on 5 tokens for every 1 ETH contributed 
    // This is without any consideration to any taxes applied   
     
    function getTokensPurchased() external view returns (uint) {        
        uint totalTokens = (contributions[msg.sender] * 5) / 1e18;
        return totalTokens;                
    }
}