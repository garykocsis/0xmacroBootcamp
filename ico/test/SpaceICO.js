const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SpaceICO", function () {
    let spaceico;
    let owner;
    let addr1;
    let addr2;
    let addr3;
    let addr4;
    let addr5;
    let addr6;
    let addr7;
    let addr8;
    let addr9;
    let addr10;
    let allowList;
    let pause;
    let contribAmt;

    // before each test deploy new instance of contract  
    beforeEach(async () => { 
        [owner,addr1,addr2,addr3,addr4,addr5,addr6,addr7,addr7,addr8,addr9,addr10,addr11]
           = await ethers.getSigners();
        treasury = addr4.address;  

        const SpaceCoin= await ethers.getContractFactory("SpaceCoin");  
        spacecoin = await SpaceCoin.deploy(treasury);

        spaceico = await ethers.getContractAt(
            "SpaceICO",
            await spacecoin.ico()
          );

       provider = ethers.provider;
                    
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

      describe("ALlow list", function () {
        it("Should revert not owner", async function () {
          await expect(spaceico.connect(addr2).toggleAllowList(allowList,true)).to.be.revertedWith("NOT OWNER");
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

    describe("Next phases", function () {
      it("should revert not owner", async function () {
        
        await expect(spaceico.connect(addr3).nextPhase()).to.be.revertedWith("NOT OWNER");  
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

      it("should revert not onwer", async function () {
        pause = true;
        await expect(spaceico.connect(addr2).setPaused(pause)).to.be.revertedWith("NOT OWNER"); 
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

    it("should revert not on list ", async function () {
        contribAmt = ethers.utils.parseEther("5"); 
       await expect(spaceico.connect(owner).contribute({value: contribAmt})).to.be.revertedWith("NOT ON ALLOW LIST");
    });     

     it("should revert - contribute revert not on list1 ", async function () {
         contribAmt = ethers.utils.parseEther("5"); 
        
       await expect(spaceico.connect(owner).contribute({value: contribAmt})).to.be.revertedWith("NOT ON ALLOW LIST");
     }); 
      
    }); 
     it("should revert - contribute max individual seed met  ", async function () {

        contribAmt = ethers.utils.parseEther("1000"); 
        await spaceico.connect(addr2).contribute({
           value: contribAmt
        }); 
      
        await expect(spaceico.connect(addr2).contribute({value: contribAmt})).to.be.revertedWith("MAX INDIVIDUAL MET");
     
     }); 

     it("should revert - contribute max total seed met  ", async function () {

      allowList = [addr1.address,addr4.address,addr5.address,addr6.address,
        addr7.address,addr8.address,addr9.address,addr10.address,addr11.address];      
       await spaceico.toggleAllowList(allowList,true);

      contribAmt = ethers.utils.parseEther("1500"); 
      await spaceico.connect(addr1).contribute({value: contribAmt}); 
      await spaceico.connect(addr2).contribute({value: contribAmt}); 
      await spaceico.connect(addr3).contribute({value: contribAmt}); 
      await spaceico.connect(addr4).contribute({value: contribAmt}); 
      await spaceico.connect(addr5).contribute({value: contribAmt}); 
      await spaceico.connect(addr6).contribute({value: contribAmt}); 
      await spaceico.connect(addr7).contribute({value: contribAmt}); 
      await spaceico.connect(addr8).contribute({value: contribAmt}); 
      await spaceico.connect(addr9).contribute({value: contribAmt}); 
      await spaceico.connect(addr10).contribute({value: contribAmt}); 
      await expect(spaceico.connect(addr11).contribute({value: contribAmt})).to.be.revertedWith("MAX SEED TOTAL MET");  
     
   }); 

    
 
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
   expect (await provider.getBalance(spaceico.address)).to.equal(ethers.BigNumber.from("15000000000000000000"));
  });  

  it("should revert - nothing to redeem", async function () {

    await spaceico.nextPhase();
    await spaceico.nextPhase();
    contribAmt = ethers.utils.parseEther("15"); 
    await spaceico.connect(addr2).contribute({
       value: contribAmt
    }); 
   await spaceico.connect(addr2).redeem();

   await expect(spaceico.connect(addr2).redeem()).to.be.revertedWith("NOTHING TO REDEEM");

   expect(await spacecoin.balanceOf(addr2.address)).to.equal(ethers.BigNumber.from("75000000000000000000"));
   expect(await spacecoin.balanceOf(spaceico.address)).to.equal(ethers.BigNumber.from("149925000000000000000000"));
   expect (await provider.getBalance(spaceico.address)).to.equal(ethers.BigNumber.from("15000000000000000000"));
  });  
  }); 
  describe("redeem", function () {  
    it("should redeem with tax", async function () {
 
     await spaceico.nextPhase();
     await spaceico.nextPhase();
     
     await spacecoin.toggleTax(true)

     contribAmt = ethers.utils.parseEther("15"); 
     await spaceico.connect(addr2).contribute({
        value: contribAmt
     }); 
    await spaceico.connect(addr2).redeem();
 
    expect(await spacecoin.balanceOf(addr2.address)).to.equal(ethers.BigNumber.from("73500000000000000000"));
    expect(await spacecoin.balanceOf(spaceico.address)).to.equal(ethers.BigNumber.from("149925000000000000000000"));
    expect (await provider.getBalance(spaceico.address)).to.equal(ethers.BigNumber.from("15000000000000000000"));
   }); 
  }); 
});