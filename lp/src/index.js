import { ethers } from "ethers"
// import JSON 
import SpaceICOJSON from '../artifacts/contracts/SpaceICO.sol/SpaceICO.json'
import SpaceRouterJSON from '../artifacts/contracts/SpaceRouter.sol/SpaceRouter.json'
import SpaceCoinJSON from '../artifacts/contracts/SpaceCoin.sol/SpaceCoin.json'
import LPJSON from '../artifacts/contracts/LP.sol/LP.json'


const provider = new ethers.providers.Web3Provider(window.ethereum)
const signer = provider.getSigner()

const spacerouterAddr = '0x0a00E720b69b219F636f224F048ef5354af9Ff54'
const spacerouter = new ethers.Contract(spacerouterAddr, SpaceRouterJSON.abi, provider);

const spaceicoAddr = '0x11b00C1F66bec637912b61CC211864E339D89f2e'
const spaceico = new ethers.Contract(spaceicoAddr, SpaceICOJSON.abi, provider);

const spacecoinAddr = '0x56323720393caaf1213e32f75f53cA397F83A54f'
const spacecoin = new ethers.Contract(spacecoinAddr, SpaceCoinJSON.abi, provider);

const lpAddr = '0x7d8171aD98A97ea3b6B5d7FF482b08ae041FF4E9'
const lp = new ethers.Contract(lpAddr, LPJSON.abi, provider);

async function connectToMetamask() {
  try {    
    console.log("Signed in as", await signer.getAddress())  
  }
  catch(err) {
    console.log("Not signed in")
    await provider.send("eth_requestAccounts", [])
  }
}

// get the currentSpcToEthPrice
async function getprice() {
  try {    
    let reserveEth
    let reserveSpc
    [reserveSpc, reserveEth]  =  await lp.connect(signer).getReserves()
    if (reserveEth > 0) {
        currentSpcToEthPrice = reserveSpc / reserveEth
     }
     console.log("spc to eth price", currentSpcToEthPrice)  
  }
  catch(err) {
    console.log("Error getting price")
  }
}

//
// ICO
//
ico_spc_buy.addEventListener('submit', async e => {
  e.preventDefault()
  
  const form = e.target
  const eth = ethers.utils.parseEther(form.eth.value)
  const conv = eth / (10**18)
  console.log("Buying", conv.toString(), "eth")

  await connectToMetamask()
  // TODO: Call ico contract contribute function
  //Add signer to allow list 
  const user = await signer.getAddress()
  allowList = [user]; 

  let phase = await spaceico.connect(signer).phase()

  //Make sure we are in the open phase to be able to redeem  
  if (phase == 0){
    await spaceico.connect(signer).toggleAllowList(allowList,true)
    await spaceico.connect(signer).nextPhase();
    await spaceico.connect(signer).nextPhase();
  }
   else if (phase == 1){
    await spaceico.connect(signer).nextPhase();
   }
   // make the contribtion of eth to the ico contract 
     let  transactionResponse = await spaceico.connect(signer).contribute({
    value: eth })
    let  transactionReceipt = await transactionResponse.wait() 
    
  // check the contributions so far 
    let  x = await spaceico.connect(signer).contributions(user)
    x = x / (10 ** 18)
    console.log("contributions Made", x)

   let y = await spacecoin.connect(signer).balanceOf(user)
    y = y / (10 ** 18)
    console.log("balance of users SPC", y) 
  //redeem
   transactionResponse = await spaceico.connect(signer).redeem();
   transactionReceipt = await transactionResponse.wait() 

  //check balances
   y = await spacecoin.connect(signer).balanceOf(user)
   y = y / (10 ** 18)

  console.log("balance of users SPC", y)
  
  console.log("ICO complete")  
})


//
// LP
//
let currentSpcToEthPrice = 5

provider.on("block", n => {
  console.log("New block", n)
  // TODO: Update currentSpcToEthPrice
    getprice()
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

  const ethcon = eth / (10**18)
  const spccon = spc / (10**18)
  console.log("Depositing", ethcon , "eth and", spccon, "spc")

  await connectToMetamask()
  // TODO: Call router contract deposit function
  const user  = await signer.getAddress()
  // approve transfer for spacerouter to transfer spc tokens to LP
  const transactionResponse = await spacecoin.connect(signer).approve(spacerouter.address,spc);
  const transactionReceipt = await transactionResponse.wait() 


  // check totals

  console.log("Before Deposit")
  let EthTotLp =  await lp.connect(signer).lpEthTotal()
  let SpcTotLP = await spacecoin.connect(signer).balanceOf(lp.address) 
  let SpcTotUC =  await spacecoin.connect(signer).balanceOf(user)
  let LPTTotU =  await lp.connect(signer).balanceOf(user)

  EthTotLp = EthTotLp / (10**18)
  SpcTotLP = SpcTotLP / (10**18)
  SpcTotUC = SpcTotUC / (10**18)
  LPTTotU = LPTTotU / (10**18)


  console.log("Eth in LP", EthTotLp)
  console.log("Spc in LP", SpcTotLP)
  console.log("Spc in signer", SpcTotUC)
  console.log("LP token in signer", LPTTotU)


  let et = { value: eth}
  await spacerouter.connect(signer).addLiquidity(spc, user, et)  

  // check totals
    EthTotLp =  await lp.connect(signer).lpEthTotal()
    SpcTotLP = await spacecoin.connect(signer).balanceOf(lp.address) 
    SpcTotUC =  await spacecoin.connect(signer).balanceOf(user)
    LPTTotU =  await lp.connect(signer).balanceOf(user)

    EthTotLp = EthTotLp / (10**18)
    SpcTotLP = SpcTotLP / (10**18)
    SpcTotUC = SpcTotUC / (10**18)
    LPTTotU = LPTTotU / (10**18)
  
  
    console.log("Eth in LP", EthTotLp)
    console.log("Spc in LP", SpcTotLP)
    console.log("Spc in signer", SpcTotUC)
    console.log("LP token in signer", LPTTotU)

    console.log("Deposit complete") 

})

lp_withdraw.addEventListener('submit', async e => {
  e.preventDefault()
  console.log("Withdrawing 100% of LP")

  await connectToMetamask()
  // TODO: Call router contract withdraw function
  const user  = await signer.getAddress()
// check totals
   let EthTotLp =  await lp.connect(signer).lpEthTotal()
   let SpcTotLP = await spacecoin.connect(signer).balanceOf(lp.address) 
   let SpcTotUC =  await spacecoin.connect(signer).balanceOf(user)
   let LPTTotU =  await lp.connect(signer).balanceOf(user)

    EthTotLp= EthTotLp / (10**18)
    SpcTotLP = SpcTotLP / (10**18)
    SpcTotUC = SpcTotUC / (10**18)
    let LPTTotUz = LPTTotU / (10**18)
  
  
    console.log("Eth in LP", EthTotLp)
    console.log("Spc in LP", SpcTotLP)
    console.log("Spc in signer", SpcTotUC)
    console.log("LP token in signer", LPTTotUz)

  
  // approve transfer of LP tokens  
  let transactionResponse = await lp.connect(signer).approve(spacerouter.address,LPTTotU);
  let transactionReceipt = await transactionResponse.wait() 
  

 //await spacerouter.connect(signer).removeLiquidity(LPTTotU,user)
  await spacerouter.connect(signer).removeLiquidity(LPTTotU,user)
  

 // check totals
    EthTotLp =  await lp.connect(signer).lpEthTotal()
    SpcTotLP = await spacecoin.connect(signer).balanceOf(lp.address) 
    SpcTotUC =  await spacecoin.connect(signer).balanceOf(user)
    LPTTotU =  await lp.connect(signer).balanceOf(user)

    EthTotLp = EthTotLp / (10**18)
    SpcTotLP = SpcTotLP / (10**18)
    SpcTotUC = SpcTotUC / (10**18)
    LPTTotU = LPTTotU / (10**18)
  
  
    console.log("Eth in LP", EthTotLp)
    console.log("Spc in LP", SpcTotLP)
    console.log("Spc in signer", SpcTotUC)
    console.log("LP token in signer", LPTTotU)

    console.log("Withdraw complete")


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
  const amt = amountIn / (10**18)

  console.log("Swapping", amt, swapIn.type, "for", swapOut.type)

  await connectToMetamask()
  // TODO: Call router contract swap function
   const user  = await signer.getAddress()
   let xpMinRtnAmt 
   let calc
   const slippage = 997
   if (swapIn.type == 'eth') {
     let spcAmtOut = await spacerouter.connect(signer).getSpcOut(amountIn) 
       console.log("spcout", spcAmtOut.toString())
     //calc = spcAmtOut / 10**18  * 98/100  //two percent slippage 
     //calc = calc * 10**18  
     //let k = ethers.utils.formatEther(calc)
     //console.log("k = ", k)
     ////xpMinRtnAmt = ethers.utils.parseEther(calc)  
    // xpMinRtnAmt =  ethers.BigNumber.from(spcAmtOut * 98 /100)
    // console.log("xpMinRtnAmtspc", xpMinRtnAmt.toString())
    //xpMinRtnAmt = ethers.BigNumber.from(spcAmtOut)
    // console.log("xpMinRtnAmtspc", xpMinRtnAmt.toString())

    xpMinRtnAmt = spcAmtOut.sub(000100000000000000)
    console.log("xpmin", xpMinRtnAmt.toString())
     let et = { value: amountIn }
     await spacerouter.connect(signer).swapEthForSpc(xpMinRtnAmt,user,et)  
    // await spacerouter.connect(signer).swapEthForSpc(xpMinRtnAmt,user,et)       
   }
   else {
    let ethAmtOut = await spacerouter.connect(signer).getEthOut(amountIn)
    //console.log("ethout", ethAmtOut.toString())
    //calc = ethAmtOut / 10**18  * .98  //two percent slippage  
    xpMinRtnAmt = ethAmtOut
    //xpMinRtnAmt = ethers.utils.parseEther(calc)
    //aprove the transfer
    const transactionResponse = await spacecoin.connect(signer).approve(spacerouter.address,amountIn);
    const transactionReceipt = await transactionResponse.wait() 
    xpMinRtnAmt = ethAmtOut.sub(000100000000000000)    
     
    //console.log("xpMinRtnAmteth", xpMinRtnAmt.toString())
    await spacerouter.connect(signer).swapSpcForEth(amountIn,xpMinRtnAmt,user)
   }

   // check totals
   let EthTotLp =  await lp.connect(signer).lpEthTotal()
   let SpcTotLP = await spacecoin.connect(signer).balanceOf(lp.address) 
   let SpcTotUC =  await spacecoin.connect(signer).balanceOf(user)
   let LPTTotU =  await lp.connect(signer).balanceOf(user)

   EthTotLp = EthTotLp / (10**18)
   SpcTotLP = SpcTotLP / (10**18)
   SpcTotUC = SpcTotUC / (10**18)
   LPTTotU = LPTTotU / (10**18) 
 
   console.log("Eth in LP", EthTotLp)
   console.log("Spc in LP", SpcTotLP)
   console.log("Spc in signer", SpcTotUC)
   console.log("LP token in signer", LPTTotU)
   console.log("Done with Swap")

})
