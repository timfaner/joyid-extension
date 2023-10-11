import { JoyIdProvider } from "./provider/provider";

let config = {
    // your app name
    name: "EVM demo",
    // your app logo,
    logo: "https://fav.farm/🆔",
    // optional, config for the network you want to connect to
    network: {
        chainId: 80001,
        name: "Ethereum Mainnet",
    },
    // optional
    rpcURL: "https://cloudflare-eth.com",
};

let injectProvider = new JoyIdProvider(config);

Object.defineProperty(window, "ethereum", {
    get() {
        return injectProvider;
    },
    set(newProvider) {
        return injectProvider;
    },
    configurable: true,
});

// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://app.uniswap.org/swap
// @icon         https://www.google.com/s2/favicons?sz=64&domain=uniswap.org
// @grant        none
// ==/UserScript==

(function () {
    "use strict";
    const rubberNeck = {
        apply: function (tgt: any, thisArg: any, argList: any) {
            console.log("apply", tgt.name, JSON.stringify(argList, null, 2));
            return Reflect.apply(tgt, thisArg, argList);
        },
    };
    const ethOrigi = window.ethereum;

    Object.getOwnPropertyNames(ethOrigi)
        .filter((i) => typeof ethOrigi[i] === "function")
        .forEach(
            (f) => (window.ethereum[f] = new Proxy(ethOrigi[f], rubberNeck)),
        );
    // Your code here...
})();
