// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract Crowdfundr {

    address[] public deployedProjects;
    event ProjectAdded(
        address sender,
        address project
    );

    /*  This function acts as a factory in creating instances of the Project contract
        Creators will call registerProject function to create their Crowdfunder projects
        They will pass in the goal amount
        The function will create a new instance of the Project contract and add the new projects address into
        an array - so that the number of project contracts are tracked  
        It will also emit an event when the Project is added  */
    
    function registerProject(uint projectGoal) external  {
        address NewProject = address(new Project(projectGoal, msg.sender));
        deployedProjects.push(NewProject);
        emit ProjectAdded(
              msg.sender,
              NewProject
         );
    }

    function getDeployedProjects() public view returns (address[] memory) {
        return deployedProjects;
    }
}

/* An instance of Project contract is created whenever a creator requests a new project to fund in the Crowdfunder
   factory contract. 
   It inherits fronm ERC721 contract as it mints token for  every 1 ETH a contributor contributes to the project as reward.
   A contributor can contribute multiple times as long as the contract is open for contributions, and must at least 
   contribute 0.1 ETH each time
   THe project is open at least for 30 days for contribution, unless the following occurs:
      a) the creator cancels the project
      b) the project meets it contribution goal before 30 days
    After 30 days, the project fails and no more contributions are allowed
   If the project fails or is cancelled, the contributor can withdraw their funds
   If the project is successful, the creator can withdraw the funds. THe funds could ve withdrawn multiple times until it is
   fully withdrawn */

contract Project is ERC721 {

    // minimum amt that can be contributed is .01 ETH 
    uint constant public MIN_CONTRIB = .01 ether;
    uint public goal;          // the goal amt for the project
    uint public endDate;       // 30 days from the date the project was created
    uint public tokenIds;      // the unique ids of each token - will be incremented each time     
    address public owner;      // owner of the project
    mapping(address => uint) public contributions;   // mapping the contains the amt of contributions for each person
       
 // The folowing is a enum that keeps track of the status of the project
 // Status.Open = Project open for contributions
 // Status.Success = Project met its goal - no more contributions  - Creator can withdrawl some or all the contributions 
 // Status.Fail = Project did not meet its goal - no more contributions - Contributors can withdraw their contributions
 // Status.Cancel = Project cancelled by creator - no mor contributions - Contributors can withdraw theru contributions 
    enum Status {
        Open, 
        Success,
        Fail,
        Cancel
    }

    Status public status;
   
    /* Constructor is called each time an instance of the project is created
     parameters:  projectGoal:  Goal amt of the project
                  projectCreator:  address that requested the new project funding 
    Since this is an ERC721 contract, the name and token acronym is passed 
    endDate of the project is determined by the current block time and adding 30 days. */
    
    constructor(uint projectGoal, address projectCreator) ERC721("Project Badge", "BDG") {     
        owner = projectCreator;
        goal = projectGoal;
        endDate= block.timestamp + 30 days;
    }

        // Modifire to check  for owner
    modifier onlyOwner() {
        require(msg.sender == owner,"not owner");
        _;
    }

       // Modifire to check  for open status 
    modifier openStatus() {
        require(status == Status.Open, "project status must be open");
        _;
    }

    /*  This function allows anyone to contribute to the project as long as the status of project is open
        Minimum contribution is 0.1 ETH 
        Once goal is met, status is updated to Success*/
    
    function contribute() external payable openStatus {
        require(msg.value >= MIN_CONTRIB, "minimum contribution not met");
 
        // if the contibutions puts the contract over its goal, then mark project as succss
        // if the contribution is past the enddate - accept the contribution, but then mark the contract as fail
        if (address(this).balance >= goal){
          status = Status.Success; 
        }
        else if (block.timestamp > endDate){
            status = Status.Fail; 
        }
        
        // add the contributions to the senders mapping
        contributions[msg.sender] += msg.value;
       
        // call function to determine if and how may badges to award 
        determineReqToken();
    }

    /* functon that contributors call to withdraw their contributions when the project fails or is cancelled  
        allow user to withdraw if the project is still in open status and past the 30 days endDate */
    function withdraw() external payable {
        if (status == Status.Open && block.timestamp > endDate)   // set status to fail   
           status = Status.Fail;
        
        require(status == Status.Fail ||  status == Status.Cancel,  "project not open for withdrawals");

        // reduce their contributions prior to making the call to prevent rentrancy 
        contributions[msg.sender] = 0;

        (bool sent, ) = msg.sender.call{value: contributions[msg.sender]} ("");
        require(sent, "Failed to send Ether");
    }
    
    /* this function is called by the owner of the project once the project met its goal 
       the owner can withdraw multiple times until the contract balance is zero  */ 
    function creatorWithdraw(uint _amt) external payable onlyOwner {
        require(status == Status.Success, "project not open to withdraw");
         require(_amt <= address(this).balance, "withdraw amt request exceeds total");
        
        (bool sent, ) = msg.sender.call{value: _amt} ("");
        require(sent, "Failed to send Ether");
    }

    /* cancel is called only by owner to cancel the project prior to success or failure  */ 
    function cancel() external onlyOwner openStatus {
        status = Status.Cancel;
    }

    /* Does the Math to determine how many tokens to mint  */ 
    function determineReqToken() private {

        //  divide the total senders contributions by 1 ETH
        uint totalNeeded = contributions[msg.sender] / 1000000000000000000;
        
        uint tokensToMint;  // variable used to determine number of tokens(badge) to mint 

        // get number of badges(tokens) for the contributor has so far
        uint currentTotal = balanceOf(msg.sender);

        // determine how many additional badges are needed to be awarded to the person
        // checks the desired total for the contributor against the number of exisitng tokens for the contributor.
        // The difference will be the new amount to be rewarded  
        if (totalNeeded > 0 && totalNeeded >= currentTotal) {        
          tokensToMint = totalNeeded  - currentTotal;
            awardToken(tokensToMint);         
        }       
    }

    /*  function to call the mint function from ERC721
         Will mint the number of tokens passed into it using a while loop */
     function awardToken(uint _numToCreate) private {
         // for loop  until all the tokens are minted    
         uint j = _numToCreate;
         while (j > 0) {
             tokenIds++;    // increment tokenId each time - this is the unique identifier for each token 
             _mint(msg.sender,tokenIds);
             j--;
         }
     }
}