fetch(window.location.href, {
    method: "GET",
    headers: {
        "Content-Type": "application/json",
    },
})
    .then((result) => {
        return result.headers.get("Content-Security-Policy");
    })
    .then((result) => {
        let policyList = result.split(";");
        let index = -1;
        for (let i = 0; i < policyList.length; i++) {
            if (
                policyList[i].startsWith(" connect-src") ||
                policyList[i].startsWith("connect-src")
            ) {
                index = i;
                break;
            }
        }
        policyList[index] += " https://ethereum.publicnode.com";
        let policy = policyList.join(";");
    });

async function f(a) {
    if (a > 0) {
        return "success";
    } else {
        return Promise.reject("fail");
    }
}

async function test(a) {
    try {
        return await f(a);
    } catch (err) {
        console.log("执行catch代码");
        return Promise.reject(err);
    }
}

async function t(a) {
    try {
        return await Promise.reject("1");
    } catch (err) {
        console.log(5);
        console.log(err);
        return Promise.reject(err);
    }
}
