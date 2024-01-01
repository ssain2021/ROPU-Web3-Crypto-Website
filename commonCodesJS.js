export function deleteCookie(name) {
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/;';
}

export function getCookies() {
    let cookieObj = {};
    let cookieArr = document.cookie.split(';');

    for(let cookie of cookieArr) {
        let [key, value] = cookie.split('=').map(item => item.trim());
        cookieObj[key] = decodeURIComponent(value);
    }

    return cookieObj;
}


export function deleteAllCookies() {
    const cookies = document.cookie.split(";");

    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        //document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
      	deleteCookie(name);
    }
}

export function beforeUnload() {
            window.addEventListener("beforeunload", function (e) {
           	deleteCookie
          });
}

export function getElement(elementId){
  return document.getElementById(elementId);
} 
