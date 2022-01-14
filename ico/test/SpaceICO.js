const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SpaceICO", function () {
    let spaceico;
    let owner;
    let addr1;
    let addr2;
    let addr3;
    let allowList;
    let pause;
    let contribAmt;

    // before each test deploy new instance of contract  
    beforeEach(async () => { 
        [owner,addr1,addr2,addr3] = await ethers.getSigners();
        allowList = [addr3.address,addr2.address];
            
        const SpaceICO= await ethers.getContractFactory("SpaceICO");  
        //spaceico = await SpaceICO.deploy([addr3.address,addr2.address]);
        spaceico = await SpaceICO.deploy();
    
        await spaceico.addAllowList(allowList);

        expect(await spaceico.allowList(addr3.address)).to.equal(true); 
        //console.log("SpaceICO addr3 ind", await spaceico.allowList(addr3.address));
        //console.log("SpaceICO addr2 ind", await spaceico.allowList(addr2.address));
        expect(await spaceico.allowList(addr2.address)).to.equal(true);
      
      });

      /*it("add allow list", async function () {

        await spaceico.addAllowList(allowList);

        expect(await spaceico.allowList(addr3.address)).to.equal(true); 
        console.log("SpaceICO addr3 ind", await spaceico.allowList(addr3.address));
        console.log("SpaceICO addr2 ind", await spaceico.allowList(addr2.address));
        expect(await spaceico.allowList(addr2.address)).to.equal(true);

           
      });  */


      it("next phase", async function () {
        await spaceico.nextPhase();          
      }); 

      it("set pausex", async function () {
        pause = true;
        await spaceico.setPaused(pause);
        expect(await spaceico.paused()).to.equal(true);          
      }); 

      
      it("get tokens purchased  ", async function () {
        await spaceico.nextPhase(); 
         
        contribAmt = ethers.utils.parseEther("5"); 
        await spaceico.connect(addr2).contribute({
           value: contribAmt
        });
        expect(await spaceico.connect(addr2).getTokensPurchased()).to.equal("25"); 
                 
      });

    it("contribute revert paused", async function () {
        pause = true;        
        await spaceico.setPaused(pause);
        contribAmt = ethers.utils.parseEther("5");
        await expect(spaceico.contribute({value: contribAmt})).to.be.revertedWith("PAUSED");
    }); 

    /*it("contribute revert no on list ", async function () {

        contribAmt = ethers.utils.parseEther("5"); 
        await spaceico.connect(owner).contribute({
           value: contribAmt
       });
       //await expect(spaceico.contribute({value: contribAmt})).to.be.revertedWith("NOT ON ALLOW LIST");

        //expect(await spaceico.contributions(addr2.address)).to.equal(contribAmt); 

   }); */

    it("contribute revert not on list1 ", async function () {
         contribAmt = ethers.utils.parseEther("5"); 
         /*await spaceico.connect(owner).contribute({
            value: contribAmt
        }); */
       
         await expect(spaceico.connect(owner).contribute({value: contribAmt})).to.be.revertedWith("NOT ON ALLOW LIST");
         //expect(await spaceico.contributions(addr2.address)).to.equal(contribAmt); 
         //await expect(project.connect(addr1).creatorWithdraw(withdrawAmt)).to.be.revertedWith("not owner");

    }); 

    /*it("contribute revert overall goal met ", async function () {

        contribAmt = ethers.utils.parseEther("15"); 
        await spaceico.connect(addr2).contribute({
           value: contribAmt
       }); 
      
        await expect(spaceico.connect(addr3).contribute({value: contribAmt})).to.be.revertedWith("GOAL MET");
        //expect(await spaceico.contributions(addr2.address)).to.equal(contribAmt); 
        //await expect(project.connect(addr1).creatorWithdraw(withdrawAmt)).to.be.revertedWith("not owner");

   }); */

   /*it("contribute revert seed total goal met ", async function () {

    contribAmt = ethers.utils.parseEther("14"); 
    await spaceico.connect(addr2).contribute({
       value: contribAmt
   }); 
  
    await expect(spaceico.connect(addr3).contribute({value: contribAmt})).to.be.revertedWith("MAX TOTAL MET");

}); */

 /*it("contribute revert seed ind goal met ", async function () {

    contribAmt = ethers.utils.parseEther("14"); 
    await spaceico.connect(addr2).contribute({
       value: contribAmt
   }); 
  
    await expect(spaceico.connect(addr2).contribute({value: contribAmt})).to.be.revertedWith("MAX TOTAL MET");

}); */

/*it("contribute revert Gen total goal met ", async function () {

    contribAmt = ethers.utils.parseEther("13"); 
    await spaceico.connect(addr2).contribute({
       value: contribAmt
   }); 

   await spaceico.nextPhase();
  
    await expect(spaceico.connect(addr3).contribute({value: contribAmt})).to.be.revertedWith("MAX GENERAL TOTAL MET");

}); */ 

/*it("contribute revert Gen total ind met ", async function () {

    await spaceico.nextPhase();

    contribAmt = ethers.utils.parseEther("13"); 
    await spaceico.connect(addr2).contribute({
       value: contribAmt
   }); 

  
    await expect(spaceico.connect(addr2).contribute({value: contribAmt})).to.be.revertedWith("MAX INDIVIDUAL MET");

}); */

it("set coin address ", async function () {
    await spaceico.setCoinAddress(owner.address);
    expect(await spaceico.coinAddress()).to.equal(owner.address); 
});

it("redeem revert not open", async function () {
    await spaceico.nextPhase();
    contribAmt = ethers.utils.parseEther("13"); 
    await spaceico.connect(addr2).contribute({
       value: contribAmt
   });   
    await expect(spaceico.connect(addr2).redeem()).to.be.revertedWith("PHASE NOT OPEN");
}); 

it("redeem ", async function () {

    await spaceico.nextPhase();
    await spaceico.nextPhase();
    await spaceico.setCoinAddress(owner.address);

    contribAmt = ethers.utils.parseEther("15"); 
    await spaceico.connect(addr2).contribute({
       value: contribAmt
   }); 
   spaceico.connect(addr2).redeem();
   //expect(spaceico.connect(addr2).redeem()).to.equal(.address); 

   contribAmt = ethers.utils.parseEther("111"); 
    await spaceico.connect(addr2).contribute({
       value: contribAmt
   }); 
    spaceico.connect(addr2).redeem(); 
}); 
});