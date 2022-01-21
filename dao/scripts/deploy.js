async function main () {
    const CollectorDao = await ethers.getContractFactory("SpaceICO");        
    const collectordao = await SpaceICO.deploy();
    await collectordao.deployed();

    console.log("contract address",collectordao.address);    
  }

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;

});