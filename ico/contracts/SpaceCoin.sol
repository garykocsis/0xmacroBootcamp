// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract SpaceCoin is ERC20 {

    uint constant public MAX_SUPPLY = 500000 * 10**18;  
    uint public initialSupply = 150000 * 10**18;  
    bool public taxable;          // Will indicate if transfer is taxable
    address public treasury;     // account used to keep tax revenue  
    address public owner;

    constructor(address _treasury, address _owner) ERC20("SPACECOIN", "SPC") {    
        _mint(msg.sender, initialSupply);
        treasury = _treasury;
        owner = _owner;
    }

    function toggleTax(bool _taxable) external {
        require(msg.sender == owner,"NOT OWNER");
        taxable = _taxable;
    }
    
    // Check to make sure tokens minted does not exceed and only treasury account can mint
    function mint(address _treasury, uint256 amount) external {  
        // treasury can only mint additional mint request after initial nimt  
        
        require(msg.sender == treasury && _treasury == treasury,"ONLY TREASURY CAN MINT");
        uint total = super.totalSupply() + amount;
        require(total <= MAX_SUPPLY,"MAX TOKENS");
        super._mint(_treasury, amount);
    }
    
//Override the _transfer function to calculate the tax
    function _transfer(address sender, address recipient, uint amount) internal override {    
       uint tax; // used to calculate tax 
       if (taxable) {      
          tax = uint(amount * 2/100);  //Tax is 2 %
          amount = uint(amount - tax);
          // reduce the tax amount from sender balance and add to treasury balance
          super._transfer(sender, treasury, tax);
       }   
        // reduce remaining amount from sender balance and add to recipent balance
        super._transfer(sender, recipient, amount);
    }  
}