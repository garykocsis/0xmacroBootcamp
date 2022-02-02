// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import "hardhat/console.sol";
import './SpaceCoin.sol';
import './SpaceRouter.sol';
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
//import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract LP is ERC20 {

    uint public constant MINIMUM_LIQUIDITY = 10**3;
    uint private reserveSpc;  //Space token reserve
    uint private reserveEth;  // ETH reserve 
    uint public lpEthTotal;  // amount of ETH in the contract   
    uint private unlocked = 1;
    address public router;  
    SpaceCoin spaceCoin;

    event Mint(
        address indexed sender,
        uint amountSpc,
        uint amountEth);

    event Burn(
         address indexed sender,
         uint amount0,
         uint amount1,
         address indexed to);
       
    constructor(SpaceCoin _spaceCoin) ERC20("LPOOL", "LP") {  
        spaceCoin = _spaceCoin;  //assign the address to the spaceCoin ERC contract 
        router = address(new SpaceRouter(this, spaceCoin)); //Deploy the router contract
    }

    // modifer to prevent reentrancy 
    modifier lock() {
        require(unlocked == 1, 'LP_LOCKED');
        unlocked = 0;
        _;
        unlocked = 1;
    }

    // retrieve reserves - can used by EOA or external contracts to see the reserves 
    function getReserves() external view returns (uint _reserveSpc, uint _reserveEth) {
        _reserveSpc = reserveSpc;
        _reserveEth = reserveEth;
    }

    // This function determines the amount of liquidity (LP tokens) to mint.  It is passed the address to mint the
    // liquidity to, and the amount of ethAdded 
    function mint(address to, uint ethAdded) external payable lock returns (uint liquidity) {
        require(ethAdded > 0, "INVALID_ETH_SENT");
        require(msg.value == ethAdded, "ETH_OUT_OF_SYNC");
                
        lpEthTotal += ethAdded;
        uint _reserveSpc = reserveSpc;
        uint _reserveEth = reserveEth;
         
        uint balanceSpc = spaceCoin.balanceOf(address(this)); // amt of Spc tokens the LP has
        uint balanceEth = lpEthTotal; // the Amount of ETH the LP contract has 

        uint amountSpc = balanceSpc - _reserveSpc;
        uint amountEth = balanceEth - _reserveEth;
         
        uint _totalSupply = totalSupply();   // get total supply of LP tokens  - totalSupply() is an override    
        if (_totalSupply == 0) {
           liquidity = sqrt(amountSpc * amountEth) - MINIMUM_LIQUIDITY;
           _mint(address(1), MINIMUM_LIQUIDITY); // permanently lock the first MINIMUM_LIQUIDITY tokens
        } else {
            liquidity = min(amountSpc * _totalSupply / _reserveSpc, amountEth * _totalSupply / _reserveEth);
        }
        require(liquidity > 0, "INSUFFICIENT_LIQUIDITY_MINTED");
         _mint(to, liquidity);

        // update the reserves with the new balances 
        reserveSpc = balanceSpc;
        reserveEth = balanceEth;

        emit Mint(msg.sender, amountSpc, amountEth);
    }

    // This function burns the liquidity tokens and determines the amount of SPC and ETH to return, then
    // returns the SPC and ETH to the "to" address 
    function burn(address to, uint liquidity) external lock returns (uint amountSpc, uint amountEth) {                 
        uint balanceSpc = spaceCoin.balanceOf(address(this));  //Balance of the spc coin in LP 
        uint balanceEth = lpEthTotal; // balance of ETH in LP contract
        uint liquidityBal = balanceOf(address(this));   // Balance of the LP tokens in LP contract
        uint _totalSupply = totalSupply(); 
                
        amountSpc = liquidityBal * balanceSpc / _totalSupply; // using balances ensures pro-rata distribution
        amountEth = liquidityBal * balanceEth / _totalSupply; // using balances ensures pro-rata distribution
        require(amountSpc > 0 && amountEth > 0, 'INSUFFICIENT_LIQUIDITY_BURNED');
        _burn(address(this), liquidity);
        spaceCoin.transfer(to, amountSpc);
        lpEthTotal -= amountEth;
        (bool sent,) = to.call{value: amountEth}("");
        require(sent, "FAILURE_SENDING_ETHER");
        
        reserveSpc = spaceCoin.balanceOf(address(this));
        reserveEth = lpEthTotal;
        
        emit Burn(msg.sender, amountSpc, amountEth, to);
    }

  // This functions swaps either ETH for SPC  or SPC for ETH depending what was sent to it 
  // when amount0Out > 0 && amount1OUT = 0  swapping Eth For Spc  amount0Out is Spc tokens being sent to 'to' address
  // when amount1Out = 0 && amount1Out > 0  swapping Spc for Eth  amount1Out is the ETH being sent back to 'to"    
  function swap(uint amount0Out, uint amount1Out, uint ethAdded, address to) external payable lock {
        require(amount0Out > 0 || amount1Out > 0, "INSUFFICIENT_OUTPUT_AMOUNT");
        require(amount0Out == 0 || amount1Out == 0, "INCORRECT_VALUES_SENT");
        //get the reserves 
        uint _reserveSpc = reserveSpc;
        uint _reserveEth = reserveEth;
       
        require(amount0Out < _reserveSpc && amount1Out < _reserveEth, 'INSUFFICIENT_LIQUIDITY');
   
        //swapping Eth for Spc
        //ensure eth was sent and values are equal 
        //transfer spc tokens to requestor  
        uint amountSpcOut;
        uint amountEthOut;
        if (amount0Out > 0) {  
           require(ethAdded > 0, "INVALID_ETH_SENT");
           require(msg.value == ethAdded, "ETH_OUT_OF_SYNC");
           lpEthTotal += ethAdded;   // add the eth sent to the eth totals 
           amountSpcOut = amount0Out;
           spaceCoin.transfer(to, amountSpcOut);  // transfer spc tokens to the "to" address  
        }
        // send Eth back to the 'to" address 
        if (amount1Out > 0) {
            amountEthOut = amount1Out;
            lpEthTotal -= amountEthOut;  //subtract the eth to be sent out 
             (bool sent,) = to.call{value: amountEthOut}("");
             require(sent, "FAILURE_SENDING_ETHER_ON_SWAP");
        }

        //update balance
        uint balanceSpc = spaceCoin.balanceOf(address(this));
        uint balanceEth = lpEthTotal;

        uint amountSpcIn = balanceSpc > _reserveSpc - amountSpcOut ? balanceSpc - (_reserveSpc - amountSpcOut) : 0;
        uint amountEthIn = balanceEth > _reserveEth - amountEthOut ? balanceEth - (_reserveEth - amountEthOut) : 0;
        require(amountSpcIn > 0 || amountEthIn > 0, 'INSUFFICIENT_INPUT_AMOUNT');

        uint balanceSpcAdjusted = balanceSpc * (1000) - (amountSpcIn * (1));
        uint balanceEthAdjusted = balanceEth * (1000) - (amountEthIn * (1));

        require(balanceSpcAdjusted * balanceEthAdjusted >=  _reserveSpc * _reserveEth * (1000**2), "ERROR_K");

        reserveSpc = balanceSpc;
        reserveEth = balanceEth;
    }
  

    function min(uint x, uint y) private pure returns (uint z) {
        z = x < y ? x : y;
    }

    function sqrt(uint y) private pure returns (uint z) {
        if (y > 3) {
            z = y;
            uint x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
}