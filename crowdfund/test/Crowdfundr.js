const { expect } = require("chai");

describe("Crowdfundr", function () {

    let crowdfundr;
    let owner;
    let addr1;
    let addr2;
    let goalAmt;
    let addressArray;

    // before each test deploy new instance of contract  
    beforeEach(async () => { 
      [owner,addr1,addr2] = await ethers.getSigners();
      const Crowdfundr= await ethers.getContractFactory("Crowdfundr");  
      crowdfundr = await Crowdfundr.deploy();
      await crowdfundr.deployed();
      goalAmt = ethers.utils.parseEther("10");
    });

    // Run different tests  
    describe("registerProject", function () {
        it("Add one project", async function () {
          // Test that Event emitted is correct   
          const transactionResponse = await crowdfundr.connect(addr1).registerProject(goalAmt);
          const transactionReceipt = await transactionResponse.wait()             
          
          console.log("address of sender",transactionReceipt .events[0].args.sender);
          console.log("address deployed contract",transactionReceipt.events[0].args.project);

          // retrieve tha array added
          addressArray = await crowdfundr.getDeployedProjects();
          console.log("address of first entry in array", addressArray[0]);

          myInstance = transactionReceipt.events[0].args.project;
          
          //expect(addressArray[0]).to.be.equal(transactionReceipt.events[0].args.project);  
          expect(addressArray[0]).to.be.equal(myInstance);               
        }); 

        it("Add two projects", async function () {

          // Add first project
          await crowdfundr.connect(addr1).registerProject(goalAmt);
          // Add second project
          const transactionResponse = await crowdfundr.connect(addr2).registerProject(goalAmt);
          const transactionReceipt = await transactionResponse.wait()    
                   
          // retrieve tha array added
          addressArray = await crowdfundr.getDeployedProjects();
          console.log("address of first entry in array", addressArray[0]);
          console.log("address of second entry in array", addressArray[1]);

          //Get address of second project registration 
          myInstance = transactionReceipt.events[0].args.project;
          expect(addressArray[1]).to.be.equal(myInstance);               
        }); 
      })
});