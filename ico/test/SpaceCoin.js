const { expect } = require("chai");

describe("SpaceCoin", function () {

    let spacecoin;
    let owner;
    let addr1;
    let addr2;
    let supply;
    

    // before each test deploy new instance of contract  
    beforeEach(async () => { 
      [owner,addr1,addr2] = await ethers.getSigners();
      //supply = 500000;
      supply = 1000;
      
      const SpaceCoin= await ethers.getContractFactory("SpaceCoin");  
      spacecoin = await SpaceCoin.deploy(supply);
      //await spacecoin.deployed();
    
    });

    describe("ERC functions", function () {
        it("supply returned", async function () {

         // console.log("total Supply", await spacecoin.totalSupply());
          expect(await spacecoin.totalSupply()).to.equal(supply); 
             
        }); 

        it("balanceof", async function () {

            //console.log("balanceof", await spacecoin.balanceOf(owner.address));
            expect(await spacecoin.balanceOf(owner.address)).to.equal(supply); 
               
          }); 

          it("symbol", async function () {
            
            expect(await spacecoin.symbol()).to.equal("SPC"); 
               
          }); 

          it("name", async function () {
            
            expect(await spacecoin.name()).to.equal("SPACECOIN"); 
               
          });


    }); 

    describe("ERC functions", function () {

        it("transfer", async function () {

            await spacecoin.transfer(addr1.address,100);
            expect(await spacecoin.balanceOf(owner.address)).to.equal(900); 
               
          }); 

    }); 

});
