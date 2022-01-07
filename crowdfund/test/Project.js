const { expect } = require("chai");

describe("Project", function () {

    let project;
    let owner;
    let addr1;
    let addr2;
    let provider;
    let goalAmt;
    let contribAmt;
    let withdrawAmt;
  
    beforeEach(async () => {
 
      [owner,addr1,addr2] = await ethers.getSigners();

      provider = ethers.provider;

      const Project= await ethers.getContractFactory("Project");
  
      //set goal of all the projects at 10 ETH 
      goalAmt = ethers.utils.parseEther("10");
  
      project = await Project.deploy(goalAmt,owner.address);
      await project.deployed();
    });
    
    describe("contribute", function () {
        it("revert on min contribution", async function () {
          contribAmt = ethers.utils.parseEther(".001");         
          await expect(project.contribute({value: contribAmt})).to.be.revertedWith("minimum contribution not met");
        }); 

        it("revert on status not open", async function () {
          await project.cancel();
          await expect(project.contribute({value: contribAmt})).to.be.revertedWith("project status must be open");
        });

        it("Go over the goal", async function () {

          contribAmt = ethers.utils.parseEther("11");
          await project.connect(addr2).contribute({
            value: contribAmt
          });
          await expect(project.cancel()).to.be.revertedWith("project status must be open");
        }); 

      it("30 day test", async function () {

        contribAmt = ethers.utils.parseEther("3.5");
        await project.connect(addr2).contribute({
          value: contribAmt
        });

        const addtitionalDays = 31 * 24 * 60 * 60;
        await ethers.provider.send('evm_increaseTime', [addtitionalDays]);
        await ethers.provider.send('evm_mine');

        contribAmt = ethers.utils.parseEther(".5");
        
        await expect(project.contribute({value: contribAmt})).to.be.revertedWith("project past end date");
       
      }); 
        
        it("add contribution total", async function () {
        
          contribAmt = ethers.utils.parseEther("1");
          await project.connect(addr1).contribute({
              value: contribAmt
          });
          await project.connect(addr1).contribute({
              value: contribAmt
          });
          await project.connect(addr2).contribute({
            value: contribAmt
        });
          expect(await project.contributions(addr1.address)).to.equal(ethers.utils.parseEther("2")); 
          expect(await project.contributions(addr2.address)).to.equal(contribAmt); 
      }); 

      it("mint x amount", async function () {
        
        contribAmt = ethers.utils.parseEther(".6");
        await project.connect(addr1).contribute({
            value: contribAmt
        });
        expect(await project.balanceOf(addr1.address)).to.equal(0); 
        
        contribAmt = ethers.utils.parseEther(".5");
        await project.connect(addr1).contribute({
            value: contribAmt
        });
        expect(await project.balanceOf(addr1.address)).to.equal(1); 

        contribAmt = ethers.utils.parseEther(".8");
        await project.connect(addr1).contribute({
            value: contribAmt
        });
        expect(await project.balanceOf(addr1.address)).to.equal(1); 

        contribAmt = ethers.utils.parseEther(".2");
        await project.connect(addr1).contribute({
            value: contribAmt
        });
        expect(await project.balanceOf(addr1.address)).to.equal(2); 

        contribAmt = ethers.utils.parseEther("5");
        await project.connect(addr2).contribute({
            value: contribAmt
        });
        expect(await project.balanceOf(addr2.address)).to.equal(5);    
        expect(await project.ownerOf(2)).to.equal(addr1.address);      
    }); 
  })

  describe("creatorWithdraw", function () {
      it("revert on not owner", async function () {
         withdrawAmt = ethers.utils.parseEther("10");
         await expect(project.connect(addr1).creatorWithdraw(withdrawAmt)).to.be.revertedWith("not owner");
      }); 
      it("revert - status not success", async function () {
        withdrawAmt = ethers.utils.parseEther("1");
        await expect(project.creatorWithdraw(withdrawAmt)).to.be.revertedWith("project not open to withdraw");
     }); 
      it("revert - requesting more than on contract", async function () {       
        contribAmt = ethers.utils.parseEther("10");
        await project.connect(addr1).contribute({
            value: contribAmt
        });

        withdrawAmt = ethers.utils.parseEther("11");
        expect(project.creatorWithdraw(withdrawAmt)).to.be.revertedWith("withdraw amt request exceeds total");
      }); 

      it("good withdrawl requests", async function () {

        contribAmt = ethers.utils.parseEther("10");
        await project.connect(addr1).contribute({
            value: contribAmt
        });

        withdrawAmt = ethers.utils.parseEther("8");
        await project.creatorWithdraw(withdrawAmt);
        expect(await provider.getBalance(project.address)).to.equal(ethers.utils.parseEther("2")); 

        withdrawAmt = ethers.utils.parseEther("2");
        await project.creatorWithdraw(withdrawAmt);

        expect(await provider.getBalance(project.address)).to.equal(0); 

      }); 
   
      it("overdraw exception", async function () {

        contribAmt = ethers.utils.parseEther("10");
        await project.connect(addr1).contribute({
            value: contribAmt
        });

        withdrawAmt = ethers.utils.parseEther("8");
        await project.creatorWithdraw(withdrawAmt);

        withdrawAmt = ethers.utils.parseEther("2");
        await project.creatorWithdraw(withdrawAmt);
             
        expect(project.creatorWithdraw(withdrawAmt)).to.be.revertedWith("withdraw amt request exceeds total");
      }); 

      describe("Withdraw", function () {
        it("revert open to withdraw", async function () {
            await expect(project.connect(addr1).withdraw()).to.be.revertedWith("project not open for withdrawals");
        });

        it("withdraw successfully", async function () {

          contribAmt = ethers.utils.parseEther("5");
          await project.connect(addr1).contribute({
             value: contribAmt
          
          });
          expect(await project.status()).to.equal(0);
          await project.cancel();
          await project.connect(addr1).withdraw();
          
        });

       it("open but past enddate", async function () {

                
        contribAmt = ethers.utils.parseEther("5");
          await project.connect(addr1).contribute({
             value: contribAmt
          
          });
          expect(await project.status()).to.equal(0);

          const addtitionalDays = 31 * 24 * 60 * 60;
          await ethers.provider.send('evm_increaseTime', [addtitionalDays]);
          await ethers.provider.send('evm_mine');
          
          await project.connect(addr1).withdraw();
          expect(await project.status()).to.equal(2);
          
        }); 

      }); 

      describe("Cancel", function () {
        it("revert", async function () {
          await project.cancel();
          await expect(project.cancel()).to.be.revertedWith("project status must be open");
        });

        it("set cancel status", async function () {
          await project.cancel();
          await expect(project.contribute({value: contribAmt})).to.be.revertedWith("project status must be open");
        });
      });
       
   })

});