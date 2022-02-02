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
        [owner,addr1,addr2,addr3,addr4] = await ethers.getSigners();
        treasury = addr4.address;  

        const SpaceCoin= await ethers.getContractFactory("SpaceCoin");  
        spacecoin = await SpaceCoin.deploy(treasury);

        spaceico = await ethers.getContractAt(
            "SpaceICO",
            await spacecoin.ico()
          );
                    
       allowList = [addr3.address,addr2.address];      
       await spaceico.toggleAllowList(allowList,true);

        expect(await spaceico.allowList(addr3.address)).to.equal(true); 
        expect(await spaceico.allowList(addr2.address)).to.equal(true);
      
      });

      describe("ALlow list", function () {

        it("Should remove allow list", async function () {
          await spaceico.toggleAllowList(allowList,false);

          expect(await spaceico.allowList(addr3.address)).to.equal(false); 
          expect(await spaceico.allowList(addr2.address)).to.equal(false);           
        });  
    });  

    describe("Next phases", function () {
       it("should set next phase", async function () {
         await spaceico.nextPhase();  
         expect(await spaceico.phase()).to.equal(1);  
         await spaceico.nextPhase();  
         expect(await spaceico.phase()).to.equal(2);
         await expect(spaceico.nextPhase()).to.be.revertedWith("Open Phase");
      }); 
    }); 

    describe("puase/resume", function () {

      it("should set pause", async function () {
        pause = true;
        await spaceico.setPaused(pause);
        expect(await spaceico.paused()).to.equal(true);       
        pause = false;
        await spaceico.setPaused(pause);
        expect(await spaceico.paused()).to.equal(false);   
      }); 
    }); 

    describe("tokens purchases:", function () {      
      it("should get tokens purchased  ", async function () {
        await spaceico.nextPhase();          
        contribAmt = ethers.utils.parseEther("5"); 
        await spaceico.connect(addr2).contribute({
           value: contribAmt
        });
        expect(await spaceico.connect(addr2).getTokensPurchased()).to.equal("25"); 
                 
      });
    });

    describe("contributions:", function () {  

      it("contribute revert paused", async function () {
         pause = true;        
         await spaceico.setPaused(pause);
         contribAmt = ethers.utils.parseEther("5");
         await expect(spaceico.contribute({value: contribAmt})).to.be.revertedWith("PAUSED");
       });  

    it("should revert no on list ", async function () {
        contribAmt = ethers.utils.parseEther("5"); 
       await expect(spaceico.connect(owner).contribute({value: contribAmt})).to.be.revertedWith("NOT ON ALLOW LIST");
    });     

     it("contribute revert not on list1 ", async function () {
         contribAmt = ethers.utils.parseEther("5"); 
        
       await expect(spaceico.connect(owner).contribute({value: contribAmt})).to.be.revertedWith("NOT ON ALLOW LIST");
     }); 
      
    }); 
    /* it("contribute revert overall goal met ", async function () {

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

});   */   
   describe("phase open", function () {  
     it("redeem revert not open", async function () {
        await spaceico.nextPhase();
        contribAmt = ethers.utils.parseEther("13"); 
        await spaceico.connect(addr2).contribute({
          value: contribAmt
        });   
        await expect(spaceico.connect(addr2).redeem()).to.be.revertedWith("PHASE NOT OPEN");
     });  
    }); 

describe("redeem", function () {  
   it("should redeem ", async function () {

    await spaceico.nextPhase();
    await spaceico.nextPhase();
    contribAmt = ethers.utils.parseEther("15"); 
    await spaceico.connect(addr2).contribute({
       value: contribAmt
    }); 
   await spaceico.connect(addr2).redeem();

   expect(await spacecoin.balanceOf(addr2.address)).to.equal(ethers.BigNumber.from("75000000000000000000"));
   expect(await spacecoin.balanceOf(spaceico.address)).to.equal(ethers.BigNumber.from("149925000000000000000000"));
   });  
});  
});