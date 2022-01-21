const { expect } = require("chai");
const { ethers } = require("hardhat");
const hardhat = require("hardhat")
const abiCoder = ethers.utils.defaultAbiCoder;

describe("CollectorDao", function () {
    let owner;
    let addr1;
    let addr2;
    let addr3;
    let addr4;
    let collectorDao;
    let contribAmt
    let signature; 
    let p;
    let r;
    let s;
    let v;      
    
    
   // let abiCoder = ethers.utils.defaultAbiCoder;

    // before each test deploy new instance of contract  
    beforeEach(async () => { 
        [owner, addr1, addr2, addr3, addr4,treas, ...addrs] = await ethers.getSigners();
       // [owner,addr1,addr2] = await ethers.getSigners();
        provider = ethers.provider;

        const CollectorDao = await ethers.getContractFactory("CollectorDao");  
        collectorDao = await CollectorDao.deploy();
        await collectorDao.deployed();
        console.log("contract deployed",collectorDao.address);

        // deploy the NFT contract too 

        const PriceLessNft = await ethers.getContractFactory("CollectorDao");  
        priceLessNft = await PriceLessNft.deploy();
        await priceLessNft.deployed();
        console.log("priceLessNft deployed",priceLessNft.address);
    });

    describe('add membership revert', function() {
        it("should revert on < 1 ETH", async function () {
            contribAmt = ethers.utils.parseEther(".001");         
            await expect(collectorDao.buyMembership({value: contribAmt})).to.be.revertedWith("ONE_ETH_REQUIRED_ONLY");
        });
        it("should revert > 1 ETH", async function () {
            contribAmt = ethers.utils.parseEther("1.001");         
            await expect(collectorDao.buyMembership({value: contribAmt})).to.be.revertedWith("ONE_ETH_REQUIRED_ONLY");
        });
        it("should revert on double membership", async function () {
            contribAmt = ethers.utils.parseEther("1"); 
            await collectorDao.buyMembership({value: contribAmt}); 
            await expect(collectorDao.buyMembership({value: contribAmt})).to.be.revertedWith("MEMBER_ALREADY");
        });
    });
    describe('add membership', function() {
        it("should add membership", async function () {
            contribAmt = ethers.utils.parseEther("1"); 
            await collectorDao.buyMembership({value: contribAmt}); 
            expect(await collectorDao.voterBase(owner.address)).to.equal(true); 
          });
    }); 

    describe("Add Proposal revert", function () {
        it("Should error on array error", async function () {
            contribAmt = ethers.utils.parseEther("1"); 
            await collectorDao.buyMembership({value: contribAmt}); 

            await expect(
           collectorDao.propose([collectorDao.address],['0','2'],["getBalanceOf(address)"],
            [abiCoder.encode(['address'], [addr1.address])],
            ethers.utils.keccak256(abiCoder.encode(['string'], 
           ['Buy!'])))).to.be.revertedWith("MISMATCH_LENGTH");
         });

         it("Should only allow member", async function () {
            await expect(
           collectorDao.propose([collectorDao.address],['0'],["getBalanceOf(address)"],
            [abiCoder.encode(['address'], [addr1.address])],
            ethers.utils.keccak256(abiCoder.encode(['string'], 
           ['Buy!'])))).to.be.revertedWith("NON_MEMBER");
         });          
    });

    describe("Add Proposal", function () {
        it("Should add a proposal", async function () {
            contribAmt = ethers.utils.parseEther("1"); 
            await collectorDao.buyMembership({value: contribAmt}); 

            await collectorDao.propose([collectorDao.address],['0'],["getBalanceOf(address)"],
            [abiCoder.encode(['address'], [addr1.address])],
            ethers.utils.keccak256(abiCoder.encode(['string'], 
           ['Buy!'])));

           expect( await collectorDao.proposalCount()).to.equal(1);

           p = await collectorDao.proposals(1);  
           expect( await p.id).to.equal(1);           
        });
        it("Should add two proposals", async function () {
            contribAmt = ethers.utils.parseEther("1"); 
            await collectorDao.buyMembership({value: contribAmt}); 

            await collectorDao.propose([collectorDao.address],['0'],["getBalanceOf(address)"],
            [abiCoder.encode(['address'], [addr1.address])],
            ethers.utils.keccak256(abiCoder.encode(['string'], 
           ['Buy!'])));

           await collectorDao.propose([collectorDao.address],['0'],["getBalanceOf(address)"],
            [abiCoder.encode(['address'], [addr1.address])],
            ethers.utils.keccak256(abiCoder.encode(['string'], 
           ["Best thing ever"])));

           expect( await collectorDao.proposalCount()).to.equal(2);

           p = await collectorDao.proposals(2);  
           expect( await p.id).to.equal(2);           
        });       
    });


    describe("cast by sig revert", function() {
       it("Should only allow member", async function () {
           const domain = {
                name: 'Collector Dao',
                chainId:  1,
                verifyingContract: collectorDao.address
            }
            const types = {
                 Ballot: [
                 { name: 'proposalId', type: 'uint256'},
                 { name: 'support', type: 'uint8'}
             ]
             }    
            const ballot = {
                proposalId: 1,
                support: 1            
            }
              
            signature = await owner._signTypedData(domain,types,ballot);      
            r = '0x' + signature.substring(2).substring(0, 64);
            s = '0x' + signature.substring(2).substring(64, 128);
            v = '0x' + signature.substring(2).substring(128, 130);
           await expect(collectorDao.castVoteBySig(1,1,v,r,s)).to.be.revertedWith("NON_MEMBER");
       });
    
        it("Should only allow valid proposalIDs", async function () {
            contribAmt = ethers.utils.parseEther("1"); 
            await collectorDao.buyMembership({value: contribAmt}); 
            const domain = {
            name: 'Collector Dao',
                   chainId:  1,
                   verifyingContract: collectorDao.address
             }
            const types = {
                  Ballot: [
                  { name: 'proposalId', type: 'uint256'},
                  { name: 'support', type: 'uint8'}
                  ]
              }    
            const ballot = {
                 proposalId: 2,
                 support: 1            
             }
                   
            signature = await owner._signTypedData(domain,types,ballot);      
             r = '0x' + signature.substring(2).substring(0, 64);
              s = '0x' + signature.substring(2).substring(64, 128);
              v = '0x' + signature.substring(2).substring(128, 130);
             await expect(collectorDao.castVoteBySig(2,1,v,r,s)).to.be.revertedWith("INVALID_PROPOSAL_ID");
        });
        it("Should only allow valid vote", async function () {
            contribAmt = ethers.utils.parseEther("1"); 
            await collectorDao.buyMembership({value: contribAmt}); 
            const domain = {
            name: 'Collector Dao',
                   chainId:  1,
                   verifyingContract: collectorDao.address
             }
            const types = {
                  Ballot: [
                  { name: 'proposalId', type: 'uint256'},
                  { name: 'support', type: 'uint8'}
                  ]
              }    
            const ballot = {
                 proposalId: 1,
                 support: 3            
             }
                   
            signature = await owner._signTypedData(domain,types,ballot);      
             r = '0x' + signature.substring(2).substring(0, 64);
              s = '0x' + signature.substring(2).substring(64, 128);
              v = '0x' + signature.substring(2).substring(128, 130);
             await collectorDao.propose([collectorDao.address],['0'],["getBalanceOf(address)"],
            [abiCoder.encode(['address'], [addr1.address])],
            ethers.utils.keccak256(abiCoder.encode(['string'], 
           ["Best thing ever"])));
             await expect(collectorDao.castVoteBySig(1,3,v,r,s)).to.be.revertedWith("INVALID_VOTE_TYPE");
        });
        it("Should only allow valid signature", async function () {
            contribAmt = ethers.utils.parseEther("1"); 
            await collectorDao.buyMembership({value: contribAmt}); 
            const domain = {
            name: 'Collector Dao',
                   chainId:  1,
                   verifyingContract: collectorDao.address
             }
            const types = {
                  Ballot: [
                  { name: 'proposalId', type: 'uint256'},
                  { name: 'support', type: 'uint8'}
                  ]
              }    
            const ballot = {
                 proposalId: 1,
                 support: 3            
             }
                   
            signature = await owner._signTypedData(domain,types,ballot);      
             r = '0x' + signature.substring(2).substring(0, 64);
              s = '0x' + signature.substring(2).substring(64, 128);
              v = '0x' + signature.substring(2).substring(128, 130);
             await collectorDao.propose([collectorDao.address],['0'],["getBalanceOf(address)"],
            [abiCoder.encode(['address'], [addr1.address])],
            ethers.utils.keccak256(abiCoder.encode(['string'], 
           ["Best thing ever"])));
             await expect(collectorDao.castVoteBySig(1,1,v,s,s)).to.be.revertedWith("invalid signature");
        });
     });  

     describe("cast by sig valid", function() {
        it("Should count votes", async function () {
            contribAmt = ethers.utils.parseEther("1"); 
            await collectorDao.connect(addr1).buyMembership({value: contribAmt}); 
            await collectorDao.buyMembership({value: contribAmt});
            await collectorDao.connect(addr2).buyMembership({value: contribAmt});
            const domain = {
            name: 'Collector Dao',
                   chainId:  1,
                   verifyingContract: collectorDao.address
             }
            const types = {
                  Ballot: [
                  { name: 'proposalId', type: 'uint256'},
                  { name: 'support', type: 'uint8'}
                  ]
              }    
            const ballot = {
                 proposalId: 1,
                 support: 3            
             }
                   
            signature = await owner._signTypedData(domain,types,ballot);      
             r = '0x' + signature.substring(2).substring(0, 64);
              s = '0x' + signature.substring(2).substring(64, 128);
              v = '0x' + signature.substring(2).substring(128, 130);
             await collectorDao.propose([collectorDao.address],['0'],["getBalanceOf(address)"],
            [abiCoder.encode(['address'], [addr1.address])],
            ethers.utils.keccak256(abiCoder.encode(['string'], 
           ["Best thing ever"])));

           await collectorDao.castVoteBySig(1,0,v,r,s);
           await collectorDao.connect(addr1).castVoteBySig(1,1,v,r,s);
           await collectorDao.connect(addr2).castVoteBySig(1,2,v,r,s);
           const p = await collectorDao.proposals(1);      
           expect( await p.forVotes).to.equal(1);
           expect( await p.againstVotes).to.equal(1);
           expect( await p.abstainVotes).to.equal(1);

        });
    }); 

    describe("cast by sig bulk errors", function() {
        it("Should only allow member", async function () {
            const domain = {
                 name: 'Collector Dao',
                 chainId:  1,
                 verifyingContract: collectorDao.address
             }
             const types = {
                  Ballot: [
                  { name: 'proposalId', type: 'uint256'},
                  { name: 'support', type: 'uint8'}
              ]
              }    
             const ballot = {
                 proposalId: 1,
                 support: 1            
             }
               
             signature = await owner._signTypedData(domain,types,ballot);
           
      
             const r1 = '0x' + signature.substring(2).substring(0, 64);
             const s1 = '0x' + signature.substring(2).substring(64, 128);
             const v1 = '0x' + signature.substring(2).substring(128, 130);          
   
 
            signature = await addr2._signTypedData(domain,types,ballot);
            const r2 = '0x' + signature.substring(2).substring(0, 64);
            const s2 = '0x' + signature.substring(2).substring(64, 128);
            const v2 = '0x' + signature.substring(2).substring(128, 130);

             // add to array
           let propArray = [1,1]
           let voteArray = [1,1];
           let vArray = [v1,v2];
           let rArray = [r1,r2];
           let sArray = [s1,s2];
                      
            await expect(collectorDao.connect(addr2).castVoteByBulk(
                propArray,voteArray,vArray,rArray,sArray)).to.be.revertedWith("NON_MEMBER");
        });
        it("Should  error mismatch array", async function () {
            const domain = {
                 name: 'Collector Dao',
                 chainId:  1,
                 verifyingContract: collectorDao.address
             }
             const types = {
                  Ballot: [
                  { name: 'proposalId', type: 'uint256'},
                  { name: 'support', type: 'uint8'}
              ]
              }    
             const ballot = {
                 proposalId: 1,
                 support: 1            
             }
               
             signature = await owner._signTypedData(domain,types,ballot);
           
      
             const r1 = '0x' + signature.substring(2).substring(0, 64);
             const s1 = '0x' + signature.substring(2).substring(64, 128);
             const v1 = '0x' + signature.substring(2).substring(128, 130);          
   
 
            signature = await addr2._signTypedData(domain,types,ballot);
            const r2 = '0x' + signature.substring(2).substring(0, 64);
            const s2 = '0x' + signature.substring(2).substring(64, 128);
            const v2 = '0x' + signature.substring(2).substring(128, 130);

             // add to array
           let propArray = [1,1]
           let voteArray = [1,1];
           let vArray = [v1,v2];
           let rArray = [r1,r2];
           let sArray = [s1];

           contribAmt = ethers.utils.parseEther("1"); 
             await collectorDao.buyMembership({value: contribAmt}); 
             await collectorDao.propose([collectorDao.address],['0'],["getBalanceOf(address)"],
            [abiCoder.encode(['address'], [addr1.address])],
            ethers.utils.keccak256(abiCoder.encode(['string'], 
           ["Best thing ever"])));
                      
            await expect(collectorDao.castVoteByBulk(
                propArray,voteArray,vArray,rArray,sArray)).to.be.revertedWith("MISMATCH_CAST");
        });
    });

    describe("cast by sig bulk valid", function() {

       it("Should count the votes", async function () {
        const domain = {
             name: 'Collector Dao',
             chainId:  1,
             verifyingContract: collectorDao.address
         }
         const types = {
              Ballot: [
              { name: 'proposalId', type: 'uint256'},
              { name: 'support', type: 'uint8'}
          ]
          }    
         const ballot = {
             proposalId: 1,
             support: 1            
         }
           
         signature = await owner._signTypedData(domain,types,ballot);
       
  
         const r1 = '0x' + signature.substring(2).substring(0, 64);
             const s1 = '0x' + signature.substring(2).substring(64, 128);
             const v1 = '0x' + signature.substring(2).substring(128, 130);          


        signature = await addr2._signTypedData(domain,types,ballot);
        const r2 = '0x' + signature.substring(2).substring(0, 64);
        const s2 = '0x' + signature.substring(2).substring(64, 128);
        const v2 = '0x' + signature.substring(2).substring(128, 130);

         // add to array
       let propArray = [1,1]
       let voteArray = [1,0];
       let vArray = [v1,v2];
       let rArray = [r1,r2];
       let sArray = [s1,s2];

       contribAmt = ethers.utils.parseEther("1"); 
         await collectorDao.buyMembership({value: contribAmt}); 
         await collectorDao.connect(addr2).buyMembership({value: contribAmt});
         await collectorDao.propose([collectorDao.address],['0'],["getBalanceOf(address)"],
        [abiCoder.encode(['address'], [addr1.address])],
        ethers.utils.keccak256(abiCoder.encode(['string'], 
       ["Best thing ever"])));

       await collectorDao.castVoteByBulk(
        propArray,voteArray,vArray,rArray,sArray);

        const p = await collectorDao.proposals(1);      
        expect( await p.forVotes).to.equal(1);
        expect( await p.againstVotes).to.equal(1);
        expect( await p.abstainVotes).to.equal(0);
                  
        
    });
});

describe("execute errors", function() {
    it("Should only allow member", async function () {
        await expect(collectorDao.execute(1)).to.be.revertedWith("NON_MEMBER");
    });
    it("Should only valid proposals", async function () {
        await collectorDao.buyMembership({value: contribAmt}); 
        await expect(collectorDao.execute(1)).to.be.revertedWith("INVALID_PROPOSAL_ID");
    });
    it("Should only be in successfull state", async function () {
        await collectorDao.buyMembership({value: contribAmt}); 
        await collectorDao.propose([collectorDao.address],['0'],["getBalanceOf(address)"],
        [abiCoder.encode(['address'], [addr1.address])],
        ethers.utils.keccak256(abiCoder.encode(['string'], 
        ["Best thing ever"])));
        await expect(collectorDao.execute(1)).to.be.revertedWith("PROPOSAL_NOT_APPROVED_STAGE");
    });

    it("Should check lack of quorom after 3 days", async function () {
        contribAmt = ethers.utils.parseEther("1");         
        await collectorDao.buyMembership({value: contribAmt}); 
        await collectorDao.connect(addr1).buyMembership({value: contribAmt}); 
        await collectorDao.connect(addr2).buyMembership({value: contribAmt}); 
        await collectorDao.connect(addr3).buyMembership({value: contribAmt}); 
        await collectorDao.connect(addr4).buyMembership({value: contribAmt}); 

        await collectorDao.propose([collectorDao.address],['0'],["getBalanceOf(address)"],
        [abiCoder.encode(['address'], [addr1.address])],
        ethers.utils.keccak256(abiCoder.encode(['string'], 
        ["Best thing ever"])));
        let addtitionalDays = 30 * 24 * 60 * 60;
        await ethers.provider.send('evm_increaseTime',   
                               [addtitionalDays]);
        await ethers.provider.send('evm_mine');
        await expect(collectorDao.execute(1)).to.be.revertedWith("PROPOSAL_NOT_APPROVED_STAGE");
    });

});
describe("execute function", function() {
it("Should execute winning proposal", async function () {
    contribAmt = ethers.utils.parseEther("1");         
    await collectorDao.buyMembership({value: contribAmt}); 
    await collectorDao.connect(addr1).buyMembership({value: contribAmt}); 
    await collectorDao.connect(addr2).buyMembership({value: contribAmt}); 
    await collectorDao.connect(addr3).buyMembership({value: contribAmt}); 
    await collectorDao.connect(addr4).buyMembership({value: contribAmt}); 

    await collectorDao.propose([collectorDao.address],['0'],["getBalanceOf(address)"],
     [abiCoder.encode(['address'], [addr1.address])],
    //[abiCoder.encode(['address','uint'], [addr1.address,'1'])],
    ethers.utils.keccak256(abiCoder.encode(['string'], 
    ["Best thing ever"])));
    
    const domain = {
        name: 'Collector Dao',
               chainId:  1,
               verifyingContract: collectorDao.address
         }
        const types = {
              Ballot: [
              { name: 'proposalId', type: 'uint256'},
              { name: 'support', type: 'uint8'}
              ]
          }    
        const ballot = {
             proposalId: 1,
             support: 1           
         }
               
        signature = await owner._signTypedData(domain,types,ballot);  

         r = '0x' + signature.substring(2).substring(0, 64);
          s = '0x' + signature.substring(2).substring(64, 128);
          v = '0x' + signature.substring(2).substring(128, 130);

        signature = await addr1._signTypedData(domain,types,ballot);
        const r1 = '0x' + signature.substring(2).substring(0, 64);
        const s1 = '0x' + signature.substring(2).substring(64, 128);
        const v1 = '0x' + signature.substring(2).substring(128, 130);

        signature = await addr2._signTypedData(domain,types,ballot);
        const r2 = '0x' + signature.substring(2).substring(0, 64);
        const s2 = '0x' + signature.substring(2).substring(64, 128);
        const v2 = '0x' + signature.substring(2).substring(128, 130);
        


       await collectorDao.castVoteBySig(1,1,v,r,s);
       await collectorDao.connect(addr1).castVoteBySig(1,1,v1,r1,s1);
       await collectorDao.connect(addr2).castVoteBySig(1,1,v2,r2,s2);

       let addtitionalDays = 30 * 24 * 60 * 60;
       await ethers.provider.send('evm_increaseTime',   
                              [addtitionalDays]);
       await ethers.provider.send('evm_mine');
       await (collectorDao.execute(1))
       const p = await collectorDao.proposals(1);      
       expect( await p.executed).to.equal(true);
});
});

describe("execute function for marketplace", function() {
    it("Should execute proposal for NFT", async function () {
        contribAmt = ethers.utils.parseEther("1");         
        await collectorDao.buyMembership({value: contribAmt}); 
        await collectorDao.connect(addr1).buyMembership({value: contribAmt}); 
        await collectorDao.connect(addr2).buyMembership({value: contribAmt}); 
        await collectorDao.connect(addr3).buyMembership({value: contribAmt}); 
        await collectorDao.connect(addr4).buyMembership({value: contribAmt}); 
    
 
      
    let price = ethers.utils.parseEther("1");

  
  

   
   /*await collectorDao.propose(
            [collectorDao.address],
            ['0'],
            ["buyPriceLess(NftMarketplace)"],
            [abiCoder.encode(['address'], [addr1.address])],
            ethers.utils.keccak256(abiCoder.encode(['string'],
            ["Best thing ever"]))); */

     await collectorDao.propose([collectorDao.address],['0'],["getwith(address,uint)"],
        [abiCoder.encode(['address','uint'], [addr1.address,1])],
         ethers.utils.keccak256(abiCoder.encode(['string'], 
        ["Best thing ever"])));        

  



       
        const domain = {
            name: 'Collector Dao',
                   chainId:  1,
                   verifyingContract: collectorDao.address
             }
            const types = {
                  Ballot: [
                  { name: 'proposalId', type: 'uint256'},
                  { name: 'support', type: 'uint8'}
                  ]
              }    
            const ballot = {
                 proposalId: 1,
                 support: 1           
             }
                   
            signature = await owner._signTypedData(domain,types,ballot);  
    
             r = '0x' + signature.substring(2).substring(0, 64);
              s = '0x' + signature.substring(2).substring(64, 128);
              v = '0x' + signature.substring(2).substring(128, 130);
    
            signature = await addr1._signTypedData(domain,types,ballot);
            const r1 = '0x' + signature.substring(2).substring(0, 64);
            const s1 = '0x' + signature.substring(2).substring(64, 128);
            const v1 = '0x' + signature.substring(2).substring(128, 130);
    
            signature = await addr2._signTypedData(domain,types,ballot);
            const r2 = '0x' + signature.substring(2).substring(0, 64);
            const s2 = '0x' + signature.substring(2).substring(64, 128);
            const v2 = '0x' + signature.substring(2).substring(128, 130);
            
    
    
           await collectorDao.castVoteBySig(1,1,v,r,s);
           await collectorDao.connect(addr1).castVoteBySig(1,1,v1,r1,s1);
           await collectorDao.connect(addr2).castVoteBySig(1,1,v2,r2,s2);
    
           let addtitionalDays = 30 * 24 * 60 * 60;
           await ethers.provider.send('evm_increaseTime',   
                                  [addtitionalDays]);
           await ethers.provider.send('evm_mine');
           await (collectorDao.execute(1))
           const p = await collectorDao.proposals(1);      
           expect( await p.executed).to.equal(true);
    });
    });
});