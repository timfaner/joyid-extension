function injectScript(jsPath) {
    jsPath = jsPath || 'dist/inpage.js';
    try {
        const container = document.head || document.documentElement;
        const scriptTag = document.createElement('script');
        scriptTag.setAttribute('async', 'false');
        scriptTag.src = chrome.runtime.getURL(jsPath);
        container.insertBefore(scriptTag, container.children[0]);
        container.removeChild(scriptTag);
    } catch (error) {
        console.error('MetaMask: Provider injection failed.', error);
    }
}

injectScript("dist/inpage.js")