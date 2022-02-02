import { ethers } from "ethers"
// import RouterJSON from '../../artifacts/contracts/Router.sol/Router.json'
import SpaceICOJSON from '../artifacts/contracts/SpaceICO.sol/SpaceICO.json'
import SpaceRouterJSON from '../artifacts/contracts/SpaceRouter.sol/SpaceRouter.json'
import SpaceCoinJSON from '../artifacts/contracts/SpaceCoin.sol/SpaceCoin.json'
import LPJSON from '../artifacts/contracts/LP.sol/LP.json'


const provider = new ethers.providers.Web3Provider(window.ethereum)
const signer = provider.getSigner()

const spacerouterAddr = '0x2C5c827e5f46180BA903EFf794361259Fe4D6582'
const spacerouter = new ethers.Contract(spacerouterAddr, SpaceRouterJSON.abi, provider);

const spaceicoAddr = '0xDB9BbD932f3d5607cdc3f85FCD5B5F99F015571f'
const spaceico = new ethers.Contract(spaceicoAddr, SpaceICOJSON.abi, provider);

const spacecoinAddr = '0x1E46A74319891f982fB459398FcFF5D8B37762D1'
const spacecoin = new ethers.Contract(spacecoinAddr, SpaceCoinJSON.abi, provider);

const lpAddr = '0xb10a10A2a708ccBbAf759C7872746074E461274e'
const lp = new ethers.Contract(lpAddr, LPJSON.abi, provider);

// const routerAddr = '0x422Db2b48c44c0A1Bf748f4bf304A8093b8F4eb6'
// const contract = new ethers.Contract(routerAddr, RouterJSON.abi, provider);

async function connectToMetamask() {
  try {
    
    console.log("Signed in as", await signer.getAddress())
  
  }
  catch(err) {
    console.log("Not signed in")
    await provider.send("eth_requestAccounts", [])
  }
}

//
// ICO
//
ico_spc_buy.addEventListener('submit', async e => {
  e.preventDefault()
  const form = e.target
  const eth = ethers.utils.parseEther(form.eth.value)
  console.log("Buying", eth.toString(), "eth")

  await connectToMetamask()
  console.log("owner of contract is", await spaceico.owner())
  // TODO: Call ico contract contribute function
  //Add signer to allow list 
  const user = await signer.getAddress()
  console.log("after getaddress", user)

  allowList = [user]; 
  //await spaceico.connect(signer).toggleAllowList(allowList,true)
  // jump to open phase
  
  //await spaceico.connect(signer).nextPhase();
  //await spaceico.connect(signer).nextPhase();  

  //contribute 
  console.log("before contribute")
  await spaceico.connect(signer).contribute({
    value: eth })
    console.log("after contribute")

  const x = await spaceico.connect(signer).contributions(user)


  //console.log("contributions Made", await spaceico.connect(signer).contributions(user).toString())
  //console.log("contributions Made", ethers.BigNumber.toString(x))
  console.log("contributions Made", x.toString())

  let y = await spacecoin.connect(signer).balanceOf(user)
  console.log("balance of users SPC", y.toString())

  await spaceico.connect(signer).redeem();

   y = await spacecoin.connect(signer).balanceOf(user)

  console.log("balance of users SPC", y.toString())
  
  console.log("after contribute")
})


//
// LP
//
let currentSpcToEthPrice = 5

provider.on("block", n => {
  console.log("New block", n)
  // TODO: Update currentSpcToEthPrice

})

lp_deposit.eth.addEventListener('input', e => {
  lp_deposit.spc.value = +e.target.value * currentSpcToEthPrice
})

lp_deposit.spc.addEventListener('input', e => {
  lp_deposit.eth.value = +e.target.value / currentSpcToEthPrice
})

lp_deposit.addEventListener('submit', async e => {
  e.preventDefault()
  const form = e.target
  const eth = ethers.utils.parseEther(form.eth.value)
  const spc = ethers.utils.parseEther(form.spc.value)
  console.log("Depositing", eth.toString(), "eth and", spc.toString(), "spc")

  await connectToMetamask()
  // TODO: Call router contract deposit function
  const user  = await signer.getAddress()
  console.log("before approve", spacerouter.address)
  await spacecoin.connect(signer).approve(spacerouter.address,spc);
  console.log("after approve")
  // check totals
  console.log("SPC in LP", await lp.connect(signer).lpEthTotal().toString())
  console.log("Eth in LP", await spacecoin.balanceOf(lp.address).toString())
  console.log("Eth in signer", await spacecoin.balanceOf(user).toString())
  
  //const transactionResponse = await spacerouter.connect(signer).addLiquidity({value: eth}(spc, user))
  //const transactionReceipt = await transactionResponse.wait() 
  //console.log("tokenAmt",transactionReceipt .events[0].args.tokenAmt)
  //console.log("ethAmt",transactionReceipt.events[0].args.ethAmt)
  //console.log("liq",transactionReceipt.events[0].args.liqTokens)
  //await spacerouter.connect(signer).addLiquidity({value: eth}(spc, user))
  //await spacerouter.connect(signer).addLiquidity({value: eth},spc, user)
  const et = { value: eth}
  await spacerouter.connect(signer).addLiquidity(spc, user, et)  

  console.log("after adding liq")

  // check totals
  console.log("SPC in LP", await lp.connect(signer).lpEthTotal())
  console.log("Eth in LP", await spacecoin.balanceOf(lp.address))
  console.log("Eth in signer", await spacecoin.balanceOf(user))

  //lp.lpEthTotal()

})

lp_withdraw.addEventListener('submit', async e => {
  e.preventDefault()
  console.log("Withdrawing 100% of LP")

  await connectToMetamask()
  // TODO: Call router contract withdraw function
})

//
// Swap
//
let swapIn = { type: 'eth', value: 0 }
let swapOut = { type: 'spc', value: 0 }
switcher.addEventListener('click', () => {
  [swapIn, swapOut] = [swapOut, swapIn]
  swap_in_label.innerText = swapIn.type.toUpperCase()
  swap.amount_in.value = swapIn.value
  updateSwapOutLabel()
})

swap.amount_in.addEventListener('input', updateSwapOutLabel)

function updateSwapOutLabel() {
  swapOut.value = swapIn.type === 'eth'
    ? +swap.amount_in.value * currentSpcToEthPrice
    : +swap.amount_in.value / currentSpcToEthPrice

  swap_out_label.innerText = `${swapOut.value} ${swapOut.type.toUpperCase()}`
}

swap.addEventListener('submit', async e => {
  e.preventDefault()
  const form = e.target
  const amountIn = ethers.utils.parseEther(form.amount_in.value)

  console.log("Swapping", amountIn, swapIn.type, "for", swapOut.type)

  await connectToMetamask()
  // TODO: Call router contract swap function
})
