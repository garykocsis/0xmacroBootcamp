async function main () {
    const SpaceICO= await ethers.getContractFactory("SpaceICO");        
    const spaceico = await SpaceICO.deploy();
    await spaceico.deployed();

    console.log("contract address",spaceico.address);    
  }

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;

});