// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import './SpaceICO.sol';
import './LP.sol';
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract SpaceCoin is ERC20 {

    uint constant public MAX_SUPPLY = 500000 * 10**18;  
    uint public initialSupply = 150000 * 10**18;  //30000 ETH  * 5 SPC   5:1 ration
    bool public taxable;  // Will indicate if transfer is taxable
    
    address public ico;       // address of the ico contract
    address public lp;        // address of the lquidity Pool Contract       
    address public treasury;  // account used to keep revenue  
    address public owner;

    event ContractAddress(
        address ico, 
        address lp
    );

    constructor(address _treasury) ERC20("SPACECOIN", "SPC") {    
        treasury = _treasury;
        owner = msg.sender;

       ico = address(new SpaceICO(owner, this, _treasury)); // deploy the ico contract
       lp = address(new LP(this));   // deploy the Liquidity Pool 

        _mint(ico, initialSupply);  // mint initial supply to the ico contract address
        _mint(_treasury,MAX_SUPPLY - initialSupply); // mint remaining tokens to treasury   

        emit ContractAddress(address(ico), address(lp));   
    }

    function toggleTax(bool _taxable) external {
        require(msg.sender == owner,"NOT OWNER");
        taxable = _taxable;
    }
            
//Override the _transfer function to calculate the tax
    function _transfer(address sender, address recipient, uint amount) internal  virtual override {    
       
       if (taxable) {    
          uint tax = amount * 2/100;  //Tax is 2 %
          amount = amount - tax;
          // reduce the tax amount from sender balance and add to treasury balance
          super._transfer(sender, treasury, tax);
       }   
        // reduce remaining amount from sender balance and add to recipent balance
        super._transfer(sender, recipient, amount);
    }  
}