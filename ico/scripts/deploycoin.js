async function main () {
    const treasury = '0x93a390f1098591892DcDdd8270c65FECF4963753';
    // owner is the SpaceICO contract address 
    const owner = '0x3aAB5258d4D9Ad18114f9641115B8be11884Ad9d';
    const SpaceCoin= await ethers.getContractFactory("SpaceCoin");  
    const spacecoin = await SpaceCoin.deploy(treasury,owner);
    await spacecoin.deployed();

    console.log("contract address",spacecoin.address);   
  }

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});