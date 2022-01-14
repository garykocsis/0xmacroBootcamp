import { ethers } from "ethers"
import SpaceICOJSON from '../artifacts/contracts/SpaceICO.sol/SpaceICO.json'


const provider = new ethers.providers.Web3Provider(window.ethereum)
const signer = provider.getSigner()

const spaceicoAddr = '0x51F74F6d53e937046A4d6de9019C93781A7Ed264'
const contract = new ethers.Contract(spaceicoAddr, SpaceICOJSON.abi, provider);

// Read on-chain data when clicking a button
// getGreeting.addEventListener('click', async () => {
//   greetingMsg.innerText = await contract.greet()
// })

// For playing around with in the browser
window.ethers = ethers
window.provider = provider
window.signer = signer
window.contract = contract


// Kick things off
go()

async function go() {
  await connectToMetamask()
  console.log("owner of contract is", await contract.owner())
  //valueOutput.innerText = await contract.connect(signer).contributions(signer.getAddress())
  valueOutput.innerText = await contract.connect(signer).getTokensPurchased()
  //console.log("after call to contributions");
}

async function connectToMetamask() {
  try {
    console.log("Signed in to", await signer.getAddress())
  }
  catch(err) {
    console.log("Not signed in")
    await provider.send("eth_requestAccounts", [])
  }
}

  submit.addEventListener('click', async () => {
    try {
      console.log("input: ", input.value)
      await contract.connect(signer).contribute()
      console.log("after contribute")
    }
    catch(err) {
      console.log("Error contributing 1",err.message)
      errorOutput.innerText = "Error on Contribution"
    
      //const msgexist = err.message.search('revert') >= 0
      //console.log("error is",msgexist)

    //  var errorMessageInJson = JSON.parse(
     //     err.message.slice(0, err.message.length - 2))
     // )
    // var errorMessageInJson = JSON.parse(
    //  err.message.slice(58, err.message.length - 2))
     // var errorMessageToShow = errorMessageInJson.data.data[Object.keys(errorMessageInJson.data.data)[0]].reason;

     // console.log("error is"), (errorMessageToShow)
      
   //   console.log("Error contributing 1")
   //   const data = e.data;
   //   console.log("Error contributing 2",e.data)
    //  const txHash = Object.keys(data)[0]; // TODO improve
    //  console.log("Error contributing 3")
    //  const reason = data[txHash].reason;

    //  console.log("Error contributing",reason)
     
    }
  })
