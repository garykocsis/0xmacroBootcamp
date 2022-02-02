// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import './LP.sol';
import './SpaceCoin.sol';
import "hardhat/console.sol";

contract SpaceRouter {
    LP lp;                // address of the LP (liquidity pool) contract
    SpaceCoin spaceCoin;  // address of the SpaceCoin contract 

    event LiquidityAdded(
        uint tokenAmt, 
        uint ethAmt,
        uint liqTokens
    );

    event LiquidityRemoved(
        uint tokenAmt, 
        uint ethAmt,
        uint liqTokens
    );

    event SwapEth(
        uint SpcOut
    );

    event SwapSpc(
        uint EthOut
    );

    // The constructor is passed in the LP and SpaceCoin Contract addresses.
    // This contract calls functions on the LP and SpaceCoin Contracts
    constructor(LP _lp, SpaceCoin _spaceCoin) {
       lp = _lp;
       spaceCoin = _spaceCoin;
    }  

    // This function will add liquidity to the pool - Will be initially set up for 5 SPC tokens for every  1 ETH 
    // amtSpcTokenDep  is the SPC coin, the Eth is sent via payble - msg.value
    // "to" address is the treasury address where the LP tokens will be minted to 
    function addLiquidity(uint amtSpcTokenDep, address to) external payable
                 returns (uint amountToken, uint amountEth, uint liquidity) {
        (amountToken, amountEth) = _addLiquidity(amtSpcTokenDep,msg.value);
        
        spaceCoin.transferFrom(to, address(lp), amountToken);  // transfer(add) the Spc tokens to the LP pool 
        liquidity = lp.mint{value: amountEth}(to,amountEth);   // sent the Eth to the LP pool and mint the LP token    

        emit LiquidityAdded(amountToken, amountEth, liquidity);
    }

  // **** ADD LIQUIDITY ****
    function _addLiquidity(uint amtSpcTokenDepA, uint amtEthDepB) private view returns (uint amountSpc, uint amountEth) {
        //Retrieve the reserves for SPC and ETH in the LP pool 
        (uint reserveSpc, uint reserveEth) = lp.getReserves();
        if (reserveSpc == 0 && reserveEth == 0) {    // Initial deposit   
            (amountSpc, amountEth) = (amtSpcTokenDepA, amtEthDepB); 
        } else {
            //find the optimal amount of SPC coins - keep ETH constant  
             uint amtSpcOptimal = quote(amtEthDepB, reserveEth, reserveSpc);
             (amountSpc, amountEth) = (amtSpcOptimal, amtEthDepB);  
        } 
    }

    // Remove liquidity - EOA will request a number of LP tokens in order to remove liquidity 
    // from the LP pool. It will call the burn function in the LP contract to burn the LP tokens and
    // determine the amount of SPC coins and Eth to return to the "to" address
    // Prior to calling the function, the callee will approve the transfer of the LP tokens 
    function removeLiquidity(uint liquidity, address to) external returns (uint amountToken, uint amountETH) {
         //Transfer the liquidity tokens to the lp contract 
        lp.transferFrom(to, address(lp), liquidity);
        // call function to burn the lp tokens
        (amountToken,amountETH) = lp.burn(to,liquidity);

        emit LiquidityRemoved(amountToken, amountETH, liquidity
        );
    }

     // Swapping ETH for SPC.  Requestor sent Eth to this contract, and requesting SPC coins in return
     function swapEthForSpc(uint spcOutMin, address to) external payable returns (uint amountSpcOut) {
        require(msg.value > 0, "INVALID_ETH_SENT");
        // determine the amout of SPC tokens to send back to 
        amountSpcOut = getSpcOut(msg.value);        
        require(amountSpcOut >= spcOutMin, "INSUFFICIENT_SPC_COINS");  
          
        //SWAP ETH FOR SPC Tokens in the LP contract - send eth 
        lp.swap{value: msg.value}(amountSpcOut,0,msg.value,to); 

        emit SwapEth(amountSpcOut);
      }

    // Swapping Spc for Eth.  Requestor sent Spc to this contract, and requesting ETH in return
    function swapSpcForEth(uint amtSpcIn, uint ethOutMin, address to) external payable returns (uint amountEthOut) {
        // determine the amout of ETH to send back to 
        amountEthOut = getEthOut(amtSpcIn);
        
         require(amountEthOut >= ethOutMin, "INSUFFICIENT_ETH");  
         //Transfer the SPC tokens to the lp contract 
        spaceCoin.transferFrom(to, address(lp), amtSpcIn);
        //SWAP SPC tokens FOR ETH in the LP contract
        lp.swap(0,amountEthOut,0,to);  

        emit SwapSpc(amountEthOut);    
    }

    function getEthOut(uint amountSpcIn) public view returns (uint ethAmtOut){
        (uint reserveSpc, uint reserveEth) = lp.getReserves();
        ethAmtOut = getAmountOut(amountSpcIn,reserveSpc,reserveEth); //Spc is in,  Eth is out amt        
    }  

    function getSpcOut(uint amountEthIn) public view returns (uint spcAmtOut){
        (uint reserveSpc, uint reserveEth) = lp.getReserves();
        spcAmtOut = getAmountOut(amountEthIn,reserveEth,reserveSpc); //Eth is in,  Spc is out amt       
    }

    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) internal pure returns (uint amountOut) {
        require(amountIn > 0, 'INSUFFICIENT_INPUT_AMOUNT');
        require(reserveIn > 0 && reserveOut > 0, 'INSUFFICIENT_LIQUIDITY');
        uint amountInWithFee = amountIn * 999;  // contract takes 1 % fee 
        uint numerator = amountInWithFee * reserveOut;
        uint denominator = reserveIn * 1000 + amountInWithFee;
        amountOut = numerator / denominator;
    }

    // Given amount of Spc and reserves for Spc and Eth, returns an equivalent amount of the Eth
    function quote(uint amountSpc, uint reserveSpc, uint reserveEth) internal pure returns (uint amountEth) {
        require(amountSpc > 0, 'INSUFFICIENT_SPC_TOKENS');
        require(reserveSpc > 0 && reserveEth > 0, 'INSUFFICIENT_LIQUIDITY');
        amountEth = amountSpc * reserveEth / reserveSpc;
    }
}