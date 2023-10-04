import * as joyid from "@joyid/evm"

joyid.initConfig({
    // your app name
    name: 'EVM demo',
    // your app logo,
    logo: 'https://fav.farm/🆔',
    // optional, config for the network you want to connect to
    network: {
        chainId: 1,
        name: 'Ethereum Mainnet',
    },
    // optional
    rpcURL: 'https://cloudflare-eth.com'
})

async function connectOnClick() {
    const address = await joyid.connect()
    console.log(`Connected with address ${address}`)
  }

console.log("Inject Success");

connectOnClick()
