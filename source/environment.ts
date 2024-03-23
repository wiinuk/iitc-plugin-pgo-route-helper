export const isIITCMobile =
    (typeof android !== "undefined" && android && android.addPane) ||
    navigator.userAgent.toLowerCase().includes("android");
