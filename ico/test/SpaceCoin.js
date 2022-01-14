const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SpaceCoin", function () {

    let spacecoin;
    let owner;
    let addr1;
    let addr2;
    let addr3;
    let x; 
    let total;
    let treasury;
    // let amt2= 995;
    let amt1 = ethers.BigNumber.from("5000000000000000000");

    //let amt2= 995;
    let amt2 = ethers.BigNumber.from("995000000000000000000");

    //let amt3 = 0;
    let amt3 = ethers.BigNumber.from("0000000000000000000");
  
    let Supply= ethers.BigNumber.from("1000000000000000000000");
     //console.log('Supply->', Supply);
     //console.log('Supply->', Supply.toString());

     //let Amt1= ethers.BigNumber.from("5000000000000000000");
     let Amt1= ethers.BigNumber.from("4900000000000000000");
     //console.log('Amt1->', Amt1);
     //console.log('Amt1->', Amt1.toString());

     let Amt2= ethers.BigNumber.from("995000000000000000000");
     //console.log('Amt2->', Amt2);
     //onsole.log('Amt2->', Amt2.toString());

     let Amt1x= ethers.BigNumber.from("4802000000000000000");
     //console.log('Amt1x->', Amt1x);
     //console.log('Amt1x->', Amt1x.toString());

    
    //console.log("Supply", Supply);
    //console.log("amt1", amt1);
    //console.log("amt2", amt2);

    //console.log("Amt1", Amt1);
    //console.log("Amt2", Amt2);

  
    // before each test deploy new instance of contract  
    beforeEach(async () => { 
      [owner,addr1,addr2,addr3] = await ethers.getSigners();

      treasury = addr3.address;

      
      //console.log("total Supply", Supply);
      
      const SpaceCoin= await ethers.getContractFactory("SpaceCoin");  
      spacecoin = await SpaceCoin.deploy(treasury,owner.address);
      //await spacecoin.deployed();
    
    });

    describe("Toggle", function () {
      it("should turn flag", async function () {
        const taxInd = true;
        await spacecoin.toggleTax(taxInd)
        expect(await spacecoin.taxable()).to.equal(true); 

      }); 
    }); 

    describe("mint", function () {
      it("mint should be revert", async function () {
        await expect(spacecoin.mint(addr1.address,Amt1)).to.be.revertedWith("ONLY TREASURY CAN MINT");
      }); 
      it("mint ", async function () {
        await (spacecoin.connect(addr3).mint(treasury,Amt1));
      });
    }); 

    describe("ERC functions", function () {
        it("supply returned", async function () {
         //console.log("total Supply", await spacecoin.totalSupply());
         //total = await spacecoin.totalSupply();
         expect(await spacecoin.totalSupply()).to.equal(ethers.BigNumber.from("150000000000000000000000"));
        // expect(await spacecoin.totalSupply()).to.equal(Supply); 
         // expect(await spacecoin.totalSupply()).to.equal(1000000000000000000000); 
         // expect(await spacecoin.totalSupply()).should.be.bignumber.equal(1000000000000000000000); 
         //expect(total.should.be.bignumber.equal(1000000000000000000000)); 
         //expect(await spacecoin.totalSupply()).to.equal(BigNumber.from("1000000000000000000000")); 
             
        }); 

        it("balanceof", async function () {

            //console.log("balanceof", await spacecoin.balanceOf(owner.address));
            //expect(await spacecoin.balanceOf(owner.address)).to.equal(Supply); 
            expect(await spacecoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from("150000000000000000000000"));
               
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

            //console.log("amt1", amt1);

             x = await spacecoin.balanceOf(owner.address);
           // console.log("owner balance", x);


            await spacecoin.transfer(addr1.address,amt1);
            expect(await spacecoin.balanceOf(owner.address)).to.equal(Amt2); 
            expect(await spacecoin.balanceOf(addr1.address)).to.equal(Amt1); 
               
          }); 

          it("approve", async function () {
           // console.log("approve");

            await spacecoin.transfer(addr1.address,amt1);

            x = await spacecoin.balanceOf(owner.address);
           // console.log("owner balance", x);

            x = await spacecoin.balanceOf(addr1.address);
           // console.log("addr1 balance", x);


            await spacecoin.connect(addr1).approve(owner.address,amt1);

             //expect(await spacecoin.connect(addr1).approve(addr2.address,100)).to.be.true;

            expect(await spacecoin.connect(addr1).allowance(addr1.address,owner.address)).to.equal(amt1);
               
          }); 

           it("transferfrom", async function () {

            await spacecoin.transfer(addr1.address,amt1);
            await spacecoin.connect(addr1).approve(owner.address,amt1);
 

           // await spacecoin.transferFrom(addr1.address,addr2.address,tansferfromAmt);

           x = await spacecoin.balanceOf(addr1.address);
           //console.log("addr1 balance", x);

            await spacecoin.transferFrom(addr1.address,addr2.address,Amt1);
            expect(await spacecoin.balanceOf(owner.address)).to.equal(Amt2); 
            expect(await spacecoin.balanceOf(addr1.address)).to.equal(amt3); 
            expect(await spacecoin.balanceOf(addr2.address)).to.equal(Amt1x); 

               
          });  


    }); 

});
