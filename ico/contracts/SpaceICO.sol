// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;


import './SpaceCoin.sol';

contract SpaceICO{

    uint intialSupply = 500000;

    constructor(){
        new SpaceCoin(intialSupply);

    }

}