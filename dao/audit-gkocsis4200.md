**Hey Hi Gary**

Abhishek here
I went through your implementation, and found it of good quality. :tada:
Follwoing are some issues and suggestions.
Feel free to ping me, if you think otherwise on any.


## issue-1

**[High]** Re-entrancy via buyPriceLess()   
```
function buyPriceLess(NftMarketplace market, address nftContract, uint256 nftId, uint256 maxPrice) public { 
    require(execution,  "NOT_EXECUTION_STATE");
    uint256 price = market.getPrice(nftContract, nftId);
    require(price <= maxPrice, "INSUFFICIENT_FUNDS");
    (bool success) = market.buy{ value: price }(nftContract, nftId);
    require(success, "FAIL PURCHASE");
  } 
```
This collectorDao calls .buy    
then the external contract can reenter by calling ``buyPriceLess()`` again,   
Its not even need to by cycle, attacker can call ``N * buyPriceLess()``   
as first condition would hold true ``require(execution,  "NOT_EXECUTION_STATE")`` always.   

Now if you agree with above as a issue.   
There are various resolutions to it,    
**Please consider any of it.**   

1) Make it such that only collector dao can call it, ``msg.sender == address(this)``   
2) Add a reentracy gaurd on buyPriceless, before calling any external non-view function    
   ex.   
    ``` 
       require(!entered)
       entered = true;
        .buy()
       entered = false; 
    ```
Also on same function  
At first seeing ``buyPriceLess()`` we felt, that anybody could call it to make a nft purchase,  
but we understood that you have protected it by ``execution`` which can only be set via ``execute()``     
Please consider explicitely mentioning this there as comment.  

## Gas Optimisations and Code Quality 
 
### Gas Optimisations 

1) Consider using hash for Proposal, so we dont have to store it onchain, would save lot of ``SSTOREs`` ex. Governer by OZ  
2) In proposal struct, consider packing uints

### Code Quality 

1) L251, we feel ``add256(uint256 a, uint256 b)`` is not needed, unless you wanna override standard ``+``, which is not the case as per current code.   
2) On failed external calls of ``execute`` , consider returning user the revert string  
