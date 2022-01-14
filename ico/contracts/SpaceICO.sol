// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import './SpaceCoin.sol';

contract SpaceICO {
    uint constant public GOAL_AMT = 30000 ether;    
    uint constant public MAX_TOTAL_AMT_SEED = 15000 ether;
    uint constant public MAX_IND_AMT_SEED = 1500 ether;
    uint constant public MAX_IND_AMT_GENERAL= 1000 ether;
    uint public totalAmt;  
    address public coinAddress;
    address public owner;      // owner of the project
    bool public paused;        // indicates if the proejct is paused 
    mapping(address => bool) public allowList; 
    mapping(address => uint) public contributions; 
    mapping(address => uint) public genPhaseContr; 
    mapping(address => uint) public redeemed; 

    //keep track of the different phases 
    enum Phase{
        Seed, 
        General,
        Open        
    }
    Phase public phase;    

    constructor() {
        owner = msg.sender;   
    }  

    // Modifier to check  for owner
    modifier onlyOwner() {
        require(msg.sender == owner,"NOT OWNER");
        _;
    }

    //add to allow list - only in the Seed Phase   
    function addAllowList(address[] memory _allowList) external {
        require(phase == Phase.Seed,"NOT SEED PHASE");
        address[] memory allowAddresses = _allowList;

    // add to mapping with indicator true     
        for (uint i = 0; i < _allowList.length; i++) {
           allowList[allowAddresses[i]] = true;  
        }      
    }

    // Move to next phase   
    function nextPhase() external onlyOwner() {
        //require(status !=  Status.Complete, "ICO Complete");
        require(phase != Phase.Open,"Open Phase");

        if (phase == Phase.Seed)
           phase = Phase.General;
        else 
           phase = Phase.Open;
    }

    //Pause or resume  
    function setPaused(bool _paused) external onlyOwner() { 
        paused = _paused;
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
    function contribute() external payable {
        require(!paused, "PAUSED");  //Cannot contribute while paused 
        require(totalAmt < GOAL_AMT,"GOAL MET");

        uint checkTotal;
        
        if (phase == Phase.Seed) {
            require(allowList[msg.sender] == true,"NOT ON ALLOW LIST");
            checkTotal = totalAmt + msg.value;
           // Check max total private contributions limit of 15000 ETHER
            require(checkTotal <= MAX_TOTAL_AMT_SEED,"MAX SEED TOTAL MET"); 
           // Check individual  total private contributions limit of 1500 ETHER
            checkTotal = contributions[msg.sender] + msg.value;
            require(checkTotal <= MAX_IND_AMT_SEED,"MAX INDIVIDUAL MET");
        } else if (phase == Phase.General) {
                // Check max total private contributions limit of 15000 ETHER
                  checkTotal = totalAmt + msg.value;
                  require(checkTotal <= GOAL_AMT,"MAX GENERAL TOTAL MET"); 
              // Check individual  total private contributions limit of 1500 ETHER
                 checkTotal = genPhaseContr[msg.sender] + msg.value;                
                 require(checkTotal <= MAX_IND_AMT_GENERAL,"MAX INDIVIDUAL MET");
                 genPhaseContr[msg.sender] += msg.value;                 
                }  

        // add the contributions to the senders mapping
        contributions[msg.sender] += msg.value;
        totalAmt += msg.value;
    }  

  // Can only redeem if in Open Phase   
  function redeem() external {        
        require(phase == Phase.Open,"PHASE NOT OPEN"); 
        // calculate coins to redeem  
        uint totalTokens = contributions[msg.sender] * 5 - redeemed[msg.sender];        
        if (totalTokens > 0) {            
           redeemed[msg.sender] += totalTokens;
           transfer(msg.sender,totalTokens);
        }         
    } 

    function setCoinAddress(address _addr) external onlyOwner() {
        coinAddress = _addr;
    }

    // returns token amount available for address to be redeemed in Open Phase
    // Based on 5 tokens for every 1 ETH contributed 
    // This is without any consideration to any taxes applied   
     
        function getTokensPurchased() external view returns (uint) {        
          uint totalTokens = (contributions[msg.sender] * 5) / 1e18;
          return totalTokens;                
    }

    function transfer(address recipient, uint256 amount) private {        
        SpaceCoin(coinAddress).transfer(recipient,amount);
    }
}