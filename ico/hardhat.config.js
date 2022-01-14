require("@nomiclabs/hardhat-waffle")
require('@openzeppelin/hardhat-upgrades');

require('dotenv').config();

require("@nomiclabs/hardhat-ethers");

const { API_URL, PRIVATE_KEY } = process.env;


/**
 * @type import('hardhat/config').HardhatUserConfig
 */


    module.exports = {

      solidity: "0.8.3",
   
      //defaultNetwork: "ropsten",
   
      //networks: {
   
       //  hardhat: {},
   
       //  rinkeyby: {
   
        //    url: API_URL,
   
        //    accounts: [`0x${PRIVATE_KEY}`]
   
        // }
   
      //},
      networks: {
        rinkeby: {
          url: process.env.API_URL || "",
          accounts:
            process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
        },
      },
   
   }

  //export default config;
