//SPDX-License-Identifier: Unlicense
	pragma solidity ^0.8.3;
     
	import "./NftMarketplace.sol";
	import "hardhat/console.sol";
    
	
	contract PriceLessNft is NftMarketplace {
	  mapping (uint => address) public tokens; 
	  uint price = 2 ether;

	  constructor(){     
        console.log("PriceLess new");
    
    }
	// retreives price of an NFT 
	  function getPrice(address _addr, uint256 _tokenId) override external view returns (uint256) {
       
	    return price;
	  }
 
    // Makes a purchase to the NFT in the market place
	//
	  function buy(address _addr, uint256 _tokenId) override external payable returns (bool success){
	    require(msg.value >= price, "Need More Ether");
	    tokens[_tokenId] = msg.sender;  //associate owner to tokenid 
	    return true;
	  }
	
    }