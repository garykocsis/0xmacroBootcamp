const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SpaceRouter", function () {
    let spaceico;
    let owner;
    let addr1;
    let addr2;
    let addr3;
    let allowList;
    let contribAmt;

    // before each test deploy new instance of contract  
    beforeEach(async () => { 
      // get signers  
        [owner,addr1,addr2,addr3,addr4] = await ethers.getSigners();
        treasury = addr4.address;  

        provider = ethers.provider;
      // deploy SpaceCoin
        const SpaceCoin= await ethers.getContractFactory("SpaceCoin");  
        spacecoin = await SpaceCoin.deploy(treasury);

       // SpaceICO contract deployed inside SpaceCoin
       // To get reference to it, do the following  
        spaceico = await ethers.getContractAt(
            "SpaceICO",
            await spacecoin.ico()
         );
        
        // LP contract deployed inside SpaceCoin
        // To get reference to it, do the following
        lp = await ethers.getContractAt(
          "LP",
          await spacecoin.lp()
       );
 
       spacerouter = await ethers.getContractAt(
            "SpaceRouter",
            await lp.router()
         );

        allowList = [addr3.address,addr2.address];      
        await spaceico.toggleAllowList(allowList,true);

      //  const SpaceRouter= await ethers.getContractFactory("SpaceRouter");  
       // spacerouter = await SpaceRouter.deploy();  
        await spaceico.setRouterAddress(spacerouter.address);
        
      });

      describe("Router address", function () {
        it("Should set Router Address", async function () {
            await spaceico.setRouterAddress(spacerouter.address);
        }); 
      }); 

      describe("Add liquidity", function () {
        it("Should add liquidity", async function () {

          // should revert phase not open  
          await expect(spaceico.withdrawToLP("15000000000000000000000")).to.be.revertedWith("PHASE NOT OPEN");

          // set to open phase   
          await spaceico.nextPhase();
          await spaceico.nextPhase();
          contribAmt = ethers.utils.parseEther("3000"); 
          await spaceico.connect(addr2).contribute({
          value: contribAmt
          }); 
          expect(await spacecoin.balanceOf(treasury)).to.equal(ethers.BigNumber.from("350000000000000000000000"));
          expect(await provider.getBalance(spaceico.address)).to.equal(contribAmt);

          //withdraw 15,000 Space coints  - expect to send to SpaceRouter these tokens plus
          //the equivalent amout of ETH, 3,000   (5 to 1 ratio)
          let transferAmt = ethers.utils.parseEther("15000"); // "15000000000000000000000"
          
          //Treasury will approve the Transfer amount for the spacerouter to spend prior to the call in the 
          //SpaceICO to withdraw

          //check to endure ERC token transfer is approved 
          await expect(spaceico.withdrawToLP(transferAmt)).to.be.revertedWith("NOT_APPROVED");

              
          await spacecoin.connect(addr4).approve(spacerouter.address,transferAmt);

           // lp tokens return 67082.03932499369088227'
          let liq = ethers.utils.parseEther("6708.203932499369088227");
          await expect(spaceico.withdrawToLP(transferAmt)).to.emit(spaceico, 'Withdraw').withArgs(transferAmt,contribAmt)
          .to.emit(spacerouter, 'LiquidityAdded').withArgs(transferAmt,contribAmt,liq)
          .to.emit(lp, 'Mint').withArgs(spacerouter.address,transferAmt,contribAmt);

          //Check balance on Spacecoin
          expect(await spacecoin.balanceOf(lp.address)).to.equal(transferAmt);
          
          //check the balance of ether on the LP contract 
          expect (await provider.getBalance(lp.address)).to.equal(contribAmt); // balance of Eth in the LP contract
          expect(await lp.lpEthTotal()).to.equal(contribAmt);

          //expect(await lp.totalSupply()).to.equal(liq);  
          expect(await lp.balanceOf(treasury)).to.equal(liq);
          
          // add second liquidity 

          let contribAmt2 = ethers.utils.parseEther("300"); 
          await spaceico.connect(addr3).contribute({
          value: contribAmt2
          }); 
          // confirm the amount of Eth in the SpaceICO contract equals the contrib amt 
          expect(await provider.getBalance(spaceico.address)).to.equal(contribAmt2);

          //Set up for additional withdraw of 1500 spc tokens and 300 ETH in the SpaceICO contract
          let transferAmt2 = ethers.utils.parseEther("1500"); //"1500000000000000000000"
          //Have the treasury account approve so that the spaceRouter can transfer to the LP contract
          await spacecoin.connect(addr4).approve(spacerouter.address,transferAmt2);  6708.203932499369088227

          let liq2 = ethers.utils.parseEther("670.820393249936908922"); // 6708.20393249936908922' 

         // lp tokens return 670.820393249936908922
         await expect(spaceico.withdrawToLP(transferAmt2)).to.emit(spaceico, 'Withdraw').withArgs(transferAmt2,contribAmt2)
        .to.emit(spacerouter, 'LiquidityAdded').withArgs(transferAmt2,contribAmt2,liq2)
        .to.emit(lp, 'Mint').withArgs(spacerouter.address,transferAmt2,contribAmt2);

          //Check balances
          //Check balance on Spacecoin
          let checkSpc = transferAmt.add(transferAmt2);
          expect(await spacecoin.balanceOf(lp.address)).to.equal(checkSpc);

          let checkEther = contribAmt.add(contribAmt2);         
          //check the balance of ether on the LP contract 
          expect (await provider.getBalance(lp.address)).to.equal(checkEther); // balance of Eth in the LP contract
          expect(await lp.lpEthTotal()).to.equal(checkEther);

          let checkLp = liq.add(liq2);
          //check the balance of the LP tokens in LP contract
          expect(await lp.balanceOf(treasury)).to.equal(checkLp);

          let y = await lp.balanceOf(treasury)
          
         
       }); 
      })

      describe("remove liquidity", function () {
        it("Should remove liquidity", async function () {
            // set to open phase   
            await spaceico.nextPhase();
            await spaceico.nextPhase();

            contribAmt = ethers.utils.parseEther("3000"); 
            await spaceico.connect(addr2).contribute({
            value: contribAmt
            }); 
            expect(await spacecoin.balanceOf(treasury)).to.equal(ethers.BigNumber.from("350000000000000000000000"));
            
            expect(await provider.getBalance(spaceico.address)).to.equal(contribAmt);
            //let transferAmt = "15000000000000000000000"/ 15000 spc coins 
            let transferAmt = ethers.utils.parseEther("15000"); // "15000000000000000000000"
          
            //Treasury will approve the Transfer amount for the spacerouter to spend prior to the call in the 
          //SpaceICO to withdraw
            await spacecoin.connect(addr4).approve(spacerouter.address,transferAmt);

           let liq = ethers.utils.parseEther("6708.203932499369088227"); // lp tokens return 6708.203932499369088227'
          await expect(spaceico.withdrawToLP(transferAmt)).to.emit(spaceico, 'Withdraw').withArgs(transferAmt,contribAmt)
          .to.emit(spacerouter, 'LiquidityAdded').withArgs(transferAmt,contribAmt,liq)
          .to.emit(lp, 'Mint').withArgs(spacerouter.address,transferAmt,contribAmt);

            //Check balances
            expect(await spacecoin.balanceOf(lp.address)).to.equal(transferAmt);
            expect (await provider.getBalance(lp.address)).to.equal(contribAmt);

            // treasury will remove liquidity
           // let liq = '6708203932499369088227'

            //Treasury will approve the Transfer amount for the spacerouter to spend prior to the call in the 
          //SpaceRouter to withdraw liquidity (return LP tokens) 

            await lp.connect(addr4).approve(spacerouter.address,liq);
            let xSpc = ethers.utils.parseEther("14999.999999999999997763")
            let xEth = ethers.utils.parseEther("2999.999999999999999552");

            //Treasury will request liquidity withdraw by calling the spacerouter directly 
           // await spacerouter.connect(addr4).removeLiquidity(liq,treasury)
           await expect(spacerouter.connect(addr4).removeLiquidity(liq,treasury))
           .to.emit(spacerouter, 'LiquidityRemoved').withArgs(xSpc,xEth,liq)
           .to.emit(lp, 'Burn').withArgs(spacerouter.address,xSpc,xEth,treasury);        


           //Check balances
          //Check balance on Spacecoin
          let checkSpc = transferAmt.sub(xSpc);
          expect(await spacecoin.balanceOf(lp.address)).to.equal(checkSpc);

          //check the balance of ether on the LP contract 

          let checkEther = contribAmt.sub(xEth);  
          expect (await provider.getBalance(lp.address)).to.equal(checkEther); // balance of Eth in the LP contract
          expect(await lp.lpEthTotal()).to.equal(checkEther);

          //check the balance of the LP tokens in LP contract
          expect(await lp.balanceOf(treasury)).to.equal(0);
                    
       });
   });
   describe("Swap", function () {
    it("Should swap eth for spc", async function () {
      await spaceico.nextPhase();
      await spaceico.nextPhase();
      contribAmt = ethers.utils.parseEther("3000"); 
      await spaceico.connect(addr2).contribute({
      value: contribAmt
      }); 
      expect(await spacecoin.balanceOf(treasury)).to.equal(ethers.BigNumber.from("350000000000000000000000"));
      
      expect(await provider.getBalance(spaceico.address)).to.equal(contribAmt);
      let transferAmt = "15000000000000000000000"

      await spacecoin.connect(addr4).approve(spacerouter.address,transferAmt);

      await spaceico.withdrawToLP(transferAmt);

      let swapAmt = ethers.utils.parseEther("10"); // 10 eth 
      //  let expMinRtnAmt = "50000000000000000000"; // 50 spc tokens 
      let expMinRtnAmt = "49784218552221103724"; // 50 spc tokens  1 %

      //test for invalid eth amount sent 
      await expect(spacerouter.connect(addr1).swapEthForSpc(expMinRtnAmt,addr1.address)).to.be.revertedWith("INVALID_ETH_SENT");

      //test for insufficient spc tokens
      await expect(spacerouter.connect(addr1).swapEthForSpc('49884218552221103724',addr1.address,{value: swapAmt}))
      .to.be.revertedWith("INSUFFICIENT_SPC_COINS");
      
      await expect(spacerouter.connect(addr1).swapEthForSpc(expMinRtnAmt,addr1.address, {value: swapAmt}))
      .to.emit(spacerouter, 'SwapEth').withArgs('49784218552221103724')

      //Check balances
      //Check balance on Spacecoin      
       expect(await spacecoin.balanceOf(lp.address)).to.equal('14950215781447778896276');

       //check the balance of ether on the LP contract       
       expect (await provider.getBalance(lp.address)).to.equal('3010000000000000000000'); // balance of Eth in the LP contract
       expect(await lp.lpEthTotal()).to.equal('3010000000000000000000');
    }); 

     it("Should swap spc for eth", async function () {
      await spaceico.nextPhase();
      await spaceico.nextPhase();
       
      contribAmt = ethers.utils.parseEther("3000"); 
      await spaceico.connect(addr3).contribute({
      value: contribAmt
      }); 
      expect(await spacecoin.balanceOf(treasury)).to.equal(ethers.BigNumber.from("350000000000000000000000"));
      
      expect(await provider.getBalance(spaceico.address)).to.equal(contribAmt);
      let transferAmt = "1500000000000000000000"
    
      await spacecoin.connect(addr4).approve(spacerouter.address,transferAmt);
      await spaceico.withdrawToLP(transferAmt);

      let expMinRtnAmt = ethers.utils.parseEther("9.7"); // will cause issue 
      let swapAmt = "50000000000000000000"; // 50 spc tokens 

      await spaceico.connect(addr3).redeem();

      await spacecoin.connect(addr3).approve(spacerouter.address,swapAmt);

      //Test for slippage
      await expect(spacerouter.connect(addr3).swapSpcForEth(swapAmt,expMinRtnAmt,addr3.address)).to.be.revertedWith("INSUFFICIENT_ETH");

     expMinRtnAmt = ethers.utils.parseEther("9.5"); //  
      
      await expect(spacerouter.connect(addr3).swapSpcForEth(swapAmt,expMinRtnAmt,addr3.address))
      .to.emit(spacerouter, 'SwapSpc').withArgs('9668053808187360882')

      //Check balances
      //Check balance on Spacecoin      
      expect(await spacecoin.balanceOf(lp.address)).to.equal('1550000000000000000000');

      //check the balance of ether on the LP contract       
      expect (await provider.getBalance(lp.address)).to.equal('290331946191812639118'); // balance of Eth in the LP contract
      expect(await lp.lpEthTotal()).to.equal('290331946191812639118');
   });
  });
});