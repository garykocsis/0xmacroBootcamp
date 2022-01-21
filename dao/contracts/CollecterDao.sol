// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import "./test/PriceLessNft.sol";

contract CollectorDao {

      // The EIP-712 typehash for the contract's domain
    bytes32 public constant DOMAIN_TYPEHASH = keccak256("EIP712Domain(string name,uint256 chainId,address verifyingContract)");
    // The EIP-712 typehash for the ballot struct used by the contract
    bytes32 public constant BALLOT_TYPEHASH = keccak256("Ballot(uint256 proposalId,uint8 support)");

    bool execution;
    
    uint public proposalCount; //total number of proposalls
    uint public members;       // number of members in the Dao - used to get quorom 

    string public constant name = "Collector Dao";

    mapping (address => bool) public voterBase;    //Addresses of members of the Dao
    mapping (uint256 => Proposal) public proposals;   //Mapping of struct proposals

    //indicates the members who have casted a vote for a particular proposal
    mapping (uint256 => mapping (address => bool)) public voterCnt; 
    
    struct Proposal {
        uint256 id;
        address proposer;
        // the ordered list of target addresses for calls to be made
        address[] targets;
        // The ordered list of values (i.e. msg.value) to be passed to the calls to be made
        uint256[] values;
        // The ordered list of function signatures to be called
        string[] signatures;
        // The ordered list of calldata to be passed to each call
        bytes[] calldatas;
        // The Time which voting starts: votes can be cast after this time 
        uint256 startTime;
        // The Time which voting ends: votes must be cast prior to this time
        uint256 endTime;
        // Current number of votes in favor of this proposal
        uint256 forVotes;
        // Current number of votes in opposition to this proposal
        uint256 againstVotes;
        // Current number of votes for abstaining for this proposal
        uint256 abstainVotes;
        // Flag marking whether the proposal has been executed
        bool executed;
    }
    
     // Possible states that a proposal may be in
    enum ProposalState {
        Active,
        Defeated,
        Succeeded,
        Executed
    }

    // An event emitted when a new proposal is created
    event ProposalCreated(
        uint id,
        address proposer,
        address[] targets,
        uint[] values, 
        string[] signatures,
        bytes[] calldatas, 
        uint startTime,
        uint endTime,
        string description);

    event VoteCast(
          address voter,
          uint256 proposalId,
          uint256 support);

    // Modifier to check for membership
    modifier onlyMember() {
       require(voterBase[msg.sender],"NON_MEMBER");
     _;
    }

    function propose(
        address[] memory _targets,
        uint256[] memory _values,
        string[] memory _signatures,
        bytes[] memory _calldatas, 
        string memory _description) external onlyMember returns (uint256) {
        require(_targets.length == _values.length && _targets.length == _signatures.length 
                 && _targets.length == _calldatas.length,"MISMATCH_LENGTH");

        //add to the number of proposals
        proposalCount++;    
        
     // build the proposal struct 
        Proposal memory newProposal = Proposal({
          id: proposalCount,
          proposer: msg.sender,
          targets: _targets,
          values: _values,
          signatures: _signatures,
          calldatas: _calldatas,
          startTime: block.timestamp,
          endTime: block.timestamp + 3 days,
          forVotes: 0,
          againstVotes: 0,
          abstainVotes: 0,
          executed: false
        });

        //map the proposal id 
        proposals[newProposal.id] = newProposal;

        emit ProposalCreated(
            newProposal.id,
            msg.sender,
            _targets,
            _values,
            _signatures,
            _calldatas,
            block.timestamp,
            block.timestamp + 3 days, 
            _description);

        return newProposal.id;
    }   

    //determine state of an proposal
    function state(uint proposalId) public view returns (ProposalState) {   
        require(proposalCount >= proposalId && proposalId > 0, "INVALID_PROPOSAL_ID");     
        Proposal storage proposal = proposals[proposalId];
        if (block.timestamp <= proposal.endTime)  
            return ProposalState.Active;
        else if (proposal.forVotes <= proposal.againstVotes || proposal.forVotes < quorumVotes())  
            return ProposalState.Defeated;  
        else if (proposal.executed) 
            return ProposalState.Executed;
        else 
           return ProposalState.Succeeded;
     }

    function buyMembership() external  payable {
        require(!voterBase[msg.sender],"MEMBER_ALREADY");
        require(msg.value == 1 ether, "ONE_ETH_REQUIRED_ONLY");
        // add address to voterBase
        voterBase[msg.sender] = true;
        // Increase the total membership 
        members++;  
    }   

   //Casting vote by bulk (batches) 
   function castVoteByBulk(
        uint[] memory proposalId,
        uint8[] memory support,
        uint8[] memory v,
        bytes32[] memory r,
        bytes32[] memory s
    ) external onlyMember {
         require(proposalId.length == support.length && proposalId.length == v.length 
           && proposalId.length == r.length 
           && proposalId.length == s.length,"MISMATCH_CAST");                 

        for (uint i = 0; i < proposalId.length; i++){           
            castVoteBySig(proposalId[i], support[i], v[i], r[i], s[i]);                 
        }        
    } 
 
    // Casting votes by signature 
    function castVoteBySig(uint proposalId, uint8 support, uint8 v, bytes32 r, bytes32 s) public onlyMember {
          bytes32 domainSeparator = 
          keccak256(abi.encode(DOMAIN_TYPEHASH, keccak256(bytes(name)), getChainIdInternal(), address(this)));
          bytes32 structHash = keccak256(abi.encode(BALLOT_TYPEHASH, proposalId, support));
          bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));          
          address signatory = ecrecover(digest, v, r, s);
          require(signatory != address(0), "invalid signature");
          //emit VoteCast(signatory, proposalId, support, castVoteInternal(signatory, proposalId, support), "");
          castVoteInternal(signatory, proposalId, support);
    }

   function castVoteInternal(address voter, uint proposalId, uint8 support) internal {
        require(state(proposalId) == ProposalState.Active, "VOTING_CLOSED");
        require(!voterCnt[proposalId][voter],"ALREADY_VOTED");  
        require(support <= 2,  "INVALID_VOTE_TYPE");
     
        //retrieve the proposal structure for the id 
        Proposal storage proposal = proposals[proposalId];
        //Cast the vote - one vote per person 
        voterCnt[proposalId][voter] = true;
        if (support == 1)  
            proposal.forVotes = add256(proposal.forVotes, 1);
        else 
           if (support == 0) 
              proposal.againstVotes = add256(proposal.againstVotes,1);           
           else 
              proposal.abstainVotes = add256(proposal.abstainVotes,1);

        emit VoteCast(voter, proposalId, support);         
   }   
     
      // Execute the proposal - call the functions 
      function execute(uint proposalId) external payable onlyMember {
        require(state(proposalId) == ProposalState.Succeeded, "PROPOSAL_NOT_APPROVED_STAGE");
        Proposal storage proposal = proposals[proposalId];
        proposal.executed = true;  // set to executed 
        //loop through the various function calls  
        for (uint i = 0; i < proposal.targets.length; i++) {

            bytes memory callData;

           if (bytes(proposal.signatures[i]).length == 0) 
              callData = proposal.calldatas[i];
           else 
            callData = abi.encodePacked(bytes4(keccak256(bytes(proposal.signatures[i]))), proposal.calldatas[i]);
            execution = true;
        
           (bool success,) = 
                proposal.targets[i].call{value: proposal.values[i]}(callData);
            require(success, "Contract execution Failed"); 
            execution = false;       
       }
     }

    // Test function to test arbitrary functions
    function getBalanceOf(address addr) public pure returns (bool){   
           return true;
    }   
   // Test function to test arbitrary functions
     function getwith(address adr,uint256 y) public pure returns (bool){   
           return true;
    } 

    function buyPriceLess(NftMarketplace market, address nftContract, uint256 nftId, uint256 maxPrice) public {
      require(execution,  "NOT_EXECUTION_STATE");
        uint256 price = market.getPrice(nftContract, nftId);
        require(price <= maxPrice, "INSUFFICIENT_FUNDS");
        (bool success) = market.buy{ value: price }(nftContract, nftId);
         require(success, "FAIL PURCHASE");
  } 

    //Calculates quorom 
    function quorumVotes() private view returns (uint256) {
        return members * 25/100;
    }  
   
   function getChainIdInternal() internal view returns (uint) {
        uint chainId;
        assembly { chainId := chainid() }
        return chainId;
    }

   //Used to addition 
   function add256(uint256 a, uint256 b) internal pure returns (uint256) {
        uint c = a + b;    
        return c;
    } 
  
}