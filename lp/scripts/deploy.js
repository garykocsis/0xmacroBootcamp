async function main () {
    // deploy SpaceCoin
    // get signers  
    const [deployer] = await ethers.getSigners();
       
    console.log("Deploying contracts with the account:", deployer.address);
       
    console.log("Account balance:", (await deployer.getBalance()).toString());

    const SpaceCoin= await ethers.getContractFactory("SpaceCoin");  
    const spacecoin = await SpaceCoin.deploy(deployer.address);
    await spacecoin.deployed();

    console.log("SpaceCoin contract address",spacecoin.address); 
    
    // SpaceICO contract deployed inside SpaceCoin
       // To get reference to it, do the following  
    const spaceico = await ethers.getContractAt(
        "SpaceICO",
        await spacecoin.ico()
     );

     console.log("SpaceICO contract address",spaceico.address); 

     const lp = await ethers.getContractAt(
        "LP",
        await spacecoin.lp()
     );
     console.log("LP contract address",lp.address); 

     const spacerouter = await ethers.getContractAt(
          "SpaceRouter",
          await lp.router()
       );
    console.log("SpaceRouter contract address",spacerouter.address);  
  }

main()
   .then(() => process.exit(0))
   .catch((error) => {
    console.error(error);
    process.exitCode(1);
});