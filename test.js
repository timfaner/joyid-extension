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
