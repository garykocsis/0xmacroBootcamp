const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SpaceCoin", function () {

    let spacecoin;
    let addr1;
    let addr2;
    let addr3;
    let treasury;
    let ico;
   
    let amt1 = ethers.BigNumber.from("5000000000000000000");
    let amt2 = ethers.BigNumber.from("349995000000000000000000");

  
    // before each test deploy new instance of contract  
    beforeEach(async () => { 
      [owner,addr1,addr2,addr3] = await ethers.getSigners();
      treasury = addr3.address;

         
               
      const SpaceCoin= await ethers.getContractFactory("SpaceCoin");  
      spacecoin = await SpaceCoin.deploy(treasury);

      ico = await spacecoin.ico();
     
    });

    describe("Toggle", function () {
      it("should turn flag", async function () {
        const taxInd = true;
        await spacecoin.toggleTax(taxInd)
        expect(await spacecoin.taxable()).to.equal(true); 
      }); 
    }); 

    
    describe("ERC functions", function () {
        it("supply returned", async function () {
         expect(await spacecoin.totalSupply()).to.equal(ethers.BigNumber.from("500000000000000000000000"));
        }); 

        it("balanceof", async function () {
           expect(await spacecoin.balanceOf(treasury)).to.equal(ethers.BigNumber.from("350000000000000000000000"));
           expect(await spacecoin.balanceOf(ico)).to.equal(ethers.BigNumber.from("150000000000000000000000"));
        }); 

        it("symbol", async function () {            
            expect(await spacecoin.symbol()).to.equal("SPC");                
        }); 

        it("name", async function () {            
            expect(await spacecoin.name()).to.equal("SPACECOIN");                
        });
    }); 

    describe("ERC functions2", function () {
        it("transfer", async function () {
            await spacecoin.connect(addr3).transfer(addr1.address,amt1);
            expect(await spacecoin.balanceOf(treasury)).to.equal(amt2); 
            expect(await spacecoin.balanceOf(addr1.address)).to.equal(amt1);                
        }); 

        it("approve", async function () {
           await spacecoin.connect(addr3).transfer(addr1.address,amt1);
           await spacecoin.connect(addr1).approve(ico,amt1);
           expect(await spacecoin.connect(addr1).allowance(addr1.address,ico)).to.equal(amt1);
        }); 

        it("transferfrom", async function () {
           await spacecoin.connect(addr3).transfer(addr1.address,amt1);
           await spacecoin.connect(addr1).approve(treasury,amt1);
           await spacecoin.connect(addr3).transferFrom(addr1.address,addr2.address,amt1);
          
           expect(await spacecoin.balanceOf(addr1.address)).to.equal(0); 
           expect(await spacecoin.balanceOf(addr2.address)).to.equal(amt1);                
          });  
    }); 
});