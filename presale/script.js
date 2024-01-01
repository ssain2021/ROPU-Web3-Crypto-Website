import {
    deleteCookie,
    getCookies,
    deleteAllCookies,
    beforeUnload,
    getElement,
  } from "../commonCodesJS.js";
  
  document.addEventListener("DOMContentLoaded", async () => {
    var dataJSON;
    var balUSDT;
    var balBNB;
    var account;
    var web3;
    var isConnected = false;
    var teamWallet;
    var BNBCA;
    var bnbABI;
    var usdtContractAddress;
    var usdtAbi;
    var ROPUrateinBNB;
    var ROPUrateinUSDT;
    var totalUSDT;
    var minUSDT;
    var maxUSDT;
    var CurrentCurSelected = "bnb";
    const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
    const config = {
      cursorTrail: false,
      starAnimationDuration: 1500,
      minimumTimeBetweenStars: 250,
      minimumDistanceBetweenStars: 75,
      glowDuration: 100,
      maximumGlowPointSpacing: 5,
      colors: ["#ffae00", "#00bfff", "#fbff00"],
      sizes: ["1.6rem", "1.4rem", "1.2rem"],
      animations: ["fall-1", "fall-2", "fall-3"],
    }
  
    await fetch("./bnbtousdt.json")
      .then((response) => {
        if (!response.ok) {
           throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((rdataJSON) => {
        dataJSON = rdataJSON;
  
        teamWallet = dataJSON.teamWallet;
        BNBCA = dataJSON.bnbCA;
        bnbABI = dataJSON.bnbABI;
        usdtContractAddress = dataJSON.usdtCA;
        usdtAbi = dataJSON.usdtABI;
        ROPUrateinBNB = (dataJSON.ROPUrateinUSDT / dataJSON.bnbtousdtprice).toFixed(15);
        ROPUrateinUSDT = dataJSON.ROPUrateinUSDT;
        minUSDT = Number(dataJSON.minUSDT);
        maxUSDT = Number(dataJSON.maxUSDT);
  
        getElement("npi").textContent = dataJSON.nextpriceincrease;
        //var output1 = dataJSON.totalUSDTraised.toFixed(0);
        //console.log(Number(output1).toLocaleString('en-US'));
        getElement("valueRaised").textContent = Number(dataJSON.totalUSDTraised.toFixed(1)).toLocaleString('en-US');
        getElement("priceUSDT").textContent = "$" + dataJSON.ROPUrateinUSDT;
        const percentage = (dataJSON.totalUSDTraised / 300000) * 100;
        document.getElementById("bar").style.width = `${percentage}%`;
      })
      .catch((error) => {
        console.error("Error fetching JSON:", error);
      });
  
    if (typeof window.ethereum !== "undefined" && isMobile) {
      window.ethereum.request({
        method: "eth_requestAccounts",
      }).then(async (accounts) => {
        web3 = new Web3(window.ethereum);
        account = accounts[0];
        isConnected = true;
  
        getElement("popup").style.display = "none";
        getElement("connectWallet").innerHTML =
          "Connected: " +
          account.substring(0, 4) +
          "....." +
          account.substring(account.length - 4, account.length);
        getElement("connectWallet").onclick = "";
  
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{
              chainId: '0x38'
            }],
          });
        } catch (error) {
          if (error.code === 4001) {
            window.alert('Network switch was rejected by the user');
          } else if (error.code === 4902) {
            addBSCChain();
          } else {
            console.error('Some Error switching network:', error);
          }
        }
  
        getElement("buyPart").style.display = "block";
      
        retreiveUSDTBal(web3, account);
        retreiveBNBBal(web3, account);
  
        const response = await fetch('https://robopuppy.world/presale/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            wallet: account,
            getBalance: true,
          })
        }).then(response => {
          if (!response.ok) {
            throw new Error('HTTP error ' + response.status);
          }
          return response.json();
        }).then(data => {
          if (data.eCode === "1xs_Uc+S") {
            getElement('ROPUBalance').textContent = data.FEMessage;
          } else {
            document.write(data.FEMessage);
          }
        }).catch(error => console.error('Error:', error));
      });
    }
  
    //  Connect WALLET Button Click STARTS Here 
    
    getElement("connectWallet").onclick = async () => {
  
      getElement("popup").style.display = "block";
    };
  
    getElement("closePopup").onclick = () => {
      getElement("popup").style.display = "none";
    };
  
    // CONNECT TO METAMASK 
  
    getElement("metamask").onclick = async function connectMeta() {
  
      if (typeof window.ethereum !== "undefined") {
        if (typeof window.ethereum.providers !== "undefined") {
          var provider = null;
  
          window.ethereum.providers.forEach(async (p) => {
            if (p.isMetaMask) provider = p;
          });
          await provider.request({
            method: "eth_requestAccounts",
          }).then(async (accounts) => {
            account = accounts[0];
          }).catch((err) => { console.log(err); alert("Wallet Connect error; Possible reason already open connection request (Open metamask extension, log in) and Please refresh; "); });
        } else {
          await window.ethereum.request({
            method: "eth_requestAccounts"
          }).then(async (accounts) => {
            account = accounts[0];
          }).catch((err) => { alert("Wallet Connect error; Please refresh; "); });
        }
  
        web3 = new Web3(provider || window.ethereum);
        isConnected = true;
        console.log("Connected Successfully!: " + account);
  
        getElement("popup").style.display = "none";
        getElement("connectWallet").innerHTML =
          "Connected: " +
          account.substring(0, 4) +
          "....." +
          account.substring(account.length - 4, account.length);
        getElement("connectWallet").onclick = "";
  
        try {
          await (provider || window.ethereum).request({
            method: 'wallet_switchEthereumChain',
            params: [{
              chainId: '0x38' // BSC mainnet chainId
            }],
          });
        } catch (error) {
          if (error.code === 4001) {
            // User rejected the network switch
            window.alert('Network switch was rejected by user');
          } else if (error.code === 4902) {
            // Chain not there 
            addBSCChain();
          } else {
            // Some other error
            console.error('Some Error switching network:', error);
          }
        }
      
        retreiveUSDTBal(web3, account);
        retreiveBNBBal(web3, account);
  
        getElement("buyPart").style.display = "block";
        
        const response = await fetch('https://robopuppy.world/presale/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            wallet: account,
            getBalance: true,
          })
        }).then(response => {
          console.log(response);
  
          if (!response.ok) {
            throw new Error('HTTP error ' + response.status);
          }
  
          return response.json();
        }).then(data => {
  
          console.log(data);
  
          // Handle the response data here
          if (data.eCode === "1xs_Uc+S") {
            // If the server responds with a success status, display a success message
            getElement('ROPUBalance').textContent = data.FEMessage;
  
          } else {
            document.write(data.FEMessage);
          }
  
        }).catch(error => { console.error('Error:', error); alert("ROPU Balance fetch error, please refresh and if still not working contact s in our telegram"); });   
        
        
  
  
  
      } else {
        if (isMobile) {
          window.open('https://metamask.app.link/robopuppy.world/presale');
          getElement("error").textContent = "You are Here.";
        } else {
  
          alert("First Install Metamask");
          console.log("Metamask is not Installed");
        }
      }
  
    }
  
    // CONNECT TO TRUST WALLET
  
    getElement("trustwallet").onclick = async function connectTrust() {
  
      if (typeof window.ethereum !== "undefined" && window["trustwallet"].isTrust) {
  
        console.log(Web3);
        web3 = new Web3(window["trustwallet"]);
  
        // Request account access if needed
        try {
          await window["trustwallet"].enable();
        } catch (error) {
          // User denied account access
          console.error("User denied account access" + error);
          return;
        }
        isConnected = true;
        // Now you can use web3 to interact with the blockchain
        const accounts = await web3.eth.getAccounts();
        account = accounts[0];
        console.log("Connected to Trust Wallet:", accounts[0]);
        getElement("popup").style.display = "none";
        getElement("connectWallet").innerHTML =
          "Connected: " +
          accounts[0].substring(0, 4) +
          "....." +
          accounts[0].substring(accounts[0].length - 4, accounts[0].length);
        // getElement("connectWallet").onclick = "";      //  WHY ?
  
        try {
          await window["trustwallet"].request({
            method: 'wallet_switchEthereumChain',
            params: [{
              chainId: '0x38' // BSC mainnet chainId
            }],
          });
        } catch (error) {
          if (error.code === 4001) {
            // User rejected the network switch
            window.alert('Network switch was rejected by user');
          } else if (error.code === 4902) {
            //Network Chain ID not found
            addBSCChain();
          } else {
            // Some other error
            console.error('Some Error switching network:', error);
          }
        }
  
        getElement("buyPart").style.display = "block";
        retreiveUSDTBal(web3, accounts[0]);
        retreiveBNBBal(web3, accounts[0]);
        
        const response = await fetch('https://robopuppy.world/presale/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            wallet: account,
            getBalance: true,
          })
        }).then(response => {
          console.log(response);
  
          if (!response.ok) {
            throw new Error('HTTP error ' + response.status);
          }
  
          return response.json();
        }).then(data => {
  
          console.log(data);
  
          // Handle the response data here
          if (data.eCode === "1xs_Uc+S") {
            // If the server responds with a success status, display a success message
            getElement('ROPUBalance').textContent = data.FEMessage;
  
          } else {
            document.write(data.FEMessage);
          }
  
        }).catch(error => { console.error('Error:', error); alert("ROPU Balance fetch error, please refresh and if still not working contact s in our telegram"); });  
        
  
      } else {
        if (isMobile) {
          //window.open('trust://browser_enable');
          alert("To Connect, open your Trust Wallet app, then in the bottom menu bar, select 'Browsing' ( at the last ) , and open the website url 'robopuppy.world/presale', and then click connect");
        } else {
          alert("First Install Trust Wallet");
          console.log("Trust Wallet is not Installed");
        }
      }
    };
  
     //  START- CONNECT TO BINANCE WALLET ()
    
    getElement("binancewallet").onclick = async function connectBSC() {
      if (typeof window.BinanceChain !== "undefined") {
        web3 = new Web3(window.BinanceChain);
  
        // Request account access if needed
        try {
          await window.BinanceChain.enable();
        } catch (error) {
          // User denied account access
          console.error("User denied account access");
          return;
        }
  
        isConnected = true;
        // Get the connected address
        const accounts = await web3.eth.getAccounts();
        account = accounts[0];
  
        console.log("Connected to BNB Wallet:", account);
        getElement("popup").style.display = "none";
        getElement("connectWallet").innerHTML =
          "Connected: " +
          account.substring(0, 4) +
          "....." +
          account.substring(account.length - 4, account.length);
        getElement("connectWallet").onclick = "";
  
        getElement("buyPart").style.display = "block";
        retreiveUSDTBal(web3, account);
        retreiveBNBBal(web3, account);
        
        const response = await fetch('https://robopuppy.world/presale/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            wallet: account,
            getBalance: true,
          })
        }).then(response => {
          console.log(response);
  
          if (!response.ok) {
            throw new Error('HTTP error ' + response.status);
          }
  
          return response.json();
        }).then(data => {
  
          console.log(data);
  
          // Handle the response data here
          if (data.eCode === "1xs_Uc+S") {
            // If the server responds with a success status, display a success message
            getElement('ROPUBalance').textContent = data.FEMessage;
  
          } else {
            document.write(data.FEMessage);
          }
  
        }).catch(error => { console.error('Error:', error); alert("ROPU Balance fetch error, please refresh and if still not working contact s in our telegram"); });  
        
  
      } else {
        alert("First Install BSC Wallet");
        console.log("BSC Wallet is not Installed");
      }
      
    };    // END OF BINANCE Wallet Connect()
    
    
    //  START - CONNECT TO COINBASE WAllet ()
    
    getElement("coinbase").onclick = async function connectCoinbase() {
  
      if (isMobile) {
        window.open('https://go.cb-w.com/dapp?cb_url=https://robopuppy.world/presale');
      } else if (window.ethereum.providers) {
  
        var provider = null;
        
        window.ethereum.providers.forEach(async (p) => {
          if (p.isCoinbaseWallet) provider = p;
        });
  
        if (provider) {
          web3 = new Web3(provider);
  
          /*const accounts = await web3.eth.getAccounts();
          console.log(accounts);
          account = accounts[0];*/
          await provider.request({
            method: "eth_requestAccounts",
          }).then(async (accounts) => {
            account = accounts[0];
            isConnected = true;
            console.log("Connected Successfully!: " + account);
  
            getElement("popup").style.display = "none";
            getElement("connectWallet").innerHTML =
              "Connected: " +
              account.substring(0, 4) +
              "....." +
              account.substring(account.length - 4, account.length);
            getElement("connectWallet").onclick = "";
            try {
              await provider.request({
                method: 'wallet_switchEthereumChain',
                params: [{
                  chainId: '0x38' // BSC mainnet chainId
                }],
              });
            } catch (error) {
              if (error.code === 4001) {
                // User rejected the network switch
                window.alert('Network switch was rejected by user');
              } else if (error.code === 4902) {
                //Network Chain ID not found
                addBSCChain();
              } else {
                // Some other error
                console.error('Some Error switching network:', error);
              }
            }
            
            retreiveUSDTBal(web3, account);
            retreiveBNBBal(web3, account);
  
            getElement("buyPart").style.display = "block";
            
            const response = await fetch('https://robopuppy.world/presale/', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                wallet: account,
                getBalance: true,
              })
            }).then(response => {
              console.log(response);
  
              if (!response.ok) {
                throw new Error('HTTP error ' + response.status);
              }
  
              return response.json();
            }).then(data => {
  
              console.log(data);
  
              // Handle the response data here
              if (data.eCode === "1xs_Uc+S") {
                // If the server responds with a success status, display a success message
                getElement('ROPUBalance').textContent = data.FEMessage;
  
              } else {
                document.write(data.FEMessage);
              }
  
            }).catch(error => { console.error('Error:', error); alert("ROPU Balance fetch error, please refresh and if still not working contact s in our telegram"); });   
            
  
          }).catch((err) => { alert("Wallet Connect error; Please refresh; "); });
  
  
        } else {
          window.alert("Coinbase Wallet is not Installed / Setup");
        }
  
  
      } else {
          window.alert("Coinbase Wallet is not Installed / Setup");
      }
        
    }   //  END of "CONNECT WALLET()" Function 
  
    
    async function addBSCChain() {
      window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: "0x38",
          rpcUrls: ["https://bsc-dataseed.binance.org/"],
          chainName: "Binance Smart Chain Mainnet",
          nativeCurrency: {
            name: "Binance Coin",
            symbol: "BNB",
            decimals: 8
          },
          blockExplorerUrls: ["https://bscscan.com/"]
        }]
      });
    }
    
    
    async function retreiveUSDTBal(web3, address) {
  
      const usdtContract = new web3.eth.Contract(usdtAbi, usdtContractAddress);
  
      try {
        const balanceWei = await usdtContract.methods.balanceOf(address).call();
        const balanceUSDT = (Number(balanceWei) / (10 ** 18)).toFixed(8); // Convert the divisor to BigInt
        balUSDT = balanceUSDT;
  
        console.log('USDT Balance:', balanceUSDT, 'USDT');
        //getElement("usdtBalance").textContent = balanceUSDT;
  
      } catch (error) {
        var err = JSON.stringify(error);
        console.log('Error retrieving USDT balance:', error);
        //getElement("usdtBalance").textContent = err;
        if (isMobile) { getElement("usdt").disabled = true; getElement("usdt").style.opacity = "40%"; }
  
      }
    }
  
    async function retreiveBNBBal(web3, address) {
      web3.eth.getBalance(address)
        .then((balance) => {
          const bnbBalance = (parseFloat(web3.utils.fromWei(balance, 'ether'))).toFixed(8);
          balBNB = bnbBalance;
          console.log('BNB Balance:', bnbBalance, 'BNB');
          getElement("usdtBalance").textContent = balBNB;
        }).catch((error) => {
          console.log("error");
          getElement("usdtBalance").textContent = error;
        });
  
    }
  
    getElement("usdt").onclick = () => {
      getElement("paycur").textContent = "USDT";
      getElement("balcur").textContent = "USDT";
      getElement("curinput").value = "";
      getElement("ROPUinput").value = "";
      getElement("usdtBalance").textContent = balUSDT;
      CurrentCurSelected = "usdt";
      getElement("usdt").classList.add('active');
      getElement("bnb").classList.remove('active');
      getElement("error").textContent = "";
    };
  
    getElement("bnb").onclick = () => {
      getElement("paycur").textContent = "BNB";
      getElement("balcur").textContent = "BNB";
      getElement("curinput").value = "";
      getElement("ROPUinput").value = "";
      getElement("usdtBalance").textContent = balBNB;
      CurrentCurSelected = "bnb";
      getElement("bnb").classList.add('active');
      getElement("usdt").classList.remove('active');
      getElement("error").textContent = "";
    };
  
    getElement("curinput").oninput = () => {
      getElement("curinput").value = getElement("curinput").value.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
      console.log(CurrentCurSelected);
      
      if (CurrentCurSelected === "usdt") {            //  USDT CURRENCY
        getElement("ROPUinput").value = getElement("curinput").value / ROPUrateinUSDT;
        //NOT ENOUGH BALANCE - PRIORITY 1
        if (balUSDT < getElement("curinput").value ) {
          getElement("error").textContent = "Dont have Enough Balance. Need to buy atleast 50 USDT, and have some BNB for Gas.";
          getElement("buyButton").setAttribute("disabled", true);
          getElement("buyButton").style.opacity = "40%";
        } else {
          //LESS THAN MIN USDT - PRIORITY 2
          if (getElement("curinput").value < minUSDT) {
            getElement("error").textContent = `Need to Buy atleast ${minUSDT} USDT.`;
            getElement("buyButton").setAttribute("disabled", true);
            getElement("buyButton").style.opacity = "40%";
          } else {
            //MORE THAN MAX USDT - PRIORITY 3
            if (getElement("curinput").value > maxUSDT) {
              getElement("error").textContent = `You can buy max ${maxUSDT} USDT.`;
              getElement("buyButton").setAttribute("disabled", true);
              getElement("buyButton").style.opacity = "40%";
            } else {
              getElement("error").textContent = "";
              getElement("buyButton").removeAttribute("disabled");
              getElement("buyButton").style.opacity = "100%";
            }
          }
  
        }
      } else if (CurrentCurSelected === "bnb") {  		//  BNB CURRENCY
        getElement("ROPUinput").value = getElement("curinput").value / ROPUrateinBNB;
        //NOT ENOUGH BALANCE - PRIORITY 1
        if (balBNB < getElement("curinput").value ) {
          console.log(balBNB, getElement("curinput").value);
          getElement("error").textContent = `Dont have Enough Balance. Need to buy atleast ${(ROPUrateinBNB * (minUSDT / ROPUrateinUSDT)).toFixed(3)} BNB, and have some BNB for Gas.`;
          getElement("buyButton").setAttribute("disabled", true);
          getElement("buyButton").style.opacity = "40%";
        } else {
          //LESS THAN MIN BNB - PRIORITY 2
          if (getElement("curinput").value < ROPUrateinBNB * (minUSDT / ROPUrateinUSDT)) {
            console.log(balBNB, getElement("curinput").value);
            getElement("error").textContent = `Need to Buy atleast ${(ROPUrateinBNB * (minUSDT / ROPUrateinUSDT)).toFixed(6)} BNB.`;
            getElement("buyButton").setAttribute("disabled", true);
            getElement("buyButton").style.opacity = "40%";
          } else {
            //MORE THAN MAX BNB - PRIORITY 2
            if (getElement("curinput").value > ROPUrateinBNB * (maxUSDT / ROPUrateinUSDT)) {
              console.log(balBNB, getElement("curinput").value);
              getElement("error").textContent = `You can buy max ${(ROPUrateinBNB * (maxUSDT / ROPUrateinUSDT)).toFixed(6)} BNB.`;
              getElement("buyButton").setAttribute("disabled", true);
              getElement("buyButton").style.opacity = "40%";
            } else {
              getElement("error").textContent = "";
              getElement("buyButton").removeAttribute("disabled");
              getElement("buyButton").style.opacity = "100%";
            }
          }
          
        }
      } 
    }; 
  
    getElement("ROPUinput").oninput = () => {
      getElement("ROPUinput").value = getElement("ROPUinput").value.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
      if (CurrentCurSelected === "usdt") {
        getElement("curinput").value = getElement("ROPUinput").value * ROPUrateinUSDT;
      } else if (CurrentCurSelected === "bnb") {
        getElement("curinput").value = getElement("ROPUinput").value * ROPUrateinBNB;
      }
    };
  
    getElement("buyButton").onclick = async function handleBuyButtonClick() {
      const amount = getElement("curinput").value;
  
      if (CurrentCurSelected === "usdt") {
        getElement("Spopup").style.display = "block";
        
        const usdtContract = new web3.eth.Contract(usdtAbi, usdtContractAddress);
  
        const decimals = await usdtContract.methods.decimals().call();
        const Camount = BigInt(amount * (10 ** Number(decimals)));
  
        let gas;
        try {
          gas = await usdtContract.methods.transfer(teamWallet, Camount).estimateGas({
            from: account
          });
        } catch (error) {
          gas = '2000000';
        }
  
        const tx = {
          from: account,
          to: usdtContractAddress,
          gas: gas,
          value: 0,
          data: usdtContract.methods.transfer(teamWallet, Camount).encodeABI(),
        };
      
        var ghash;
        try {
          await web3.eth.sendTransaction(tx).on('transactionHash', function(hash){ ghash = hash;}).on('error', function(err, receipt){
            
            return;
          });
        } catch (error) {
          console.error(error);  	
          getElement("error").textContent = "Error initiating Transaction. Possibly not sufficient BNB for gas. Possibly User denied Transaction. If none of these, then contact us in Telegram.";
          getElement("Spopup").style.display = "none";
          return;
        }
  
        const response = await fetch('https://robopuppy.world/presale/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            wallet: account,
            ratePerCPW: dataJSON.ROPUrateinUSDT,
            CPW: "usdt",
            CPWamtPaid: amount,
            TokenAMT: getElement("ROPUinput").value,
            hash: ghash
          })
        }).then(response => {
          console.log(response);
  
          if (!response.ok) {
            throw new Error('HTTP error ' + response.status);
          }
  
          return response.json();
        }).then(async (data) => {
  
          console.log(data);
  
          // Handle the response data here
          if (data.eCode === "1xs_Uc+S") {
            // If the server responds with a success status, display a success message
            window.alert(data.FEMessage);
            
            location.reload();
          } else {
            document.write(data.FEMessage);
          }
  
        }).catch(error => console.error('Error:', error));
  
      } else if (CurrentCurSelected === "bnb") {
      
        getElement("Spopup").style.display = "block";
        var ghash;
        try {
          await web3.eth.sendTransaction({
            from: account,
            to: teamWallet,
            value: web3.utils.toWei(amount, "ether"),
            gas: 50000,
          }).on('transactionHash', function(hash){
            ghash = hash;
          }).on('error', function(err, receipt){
            console.log(err);
            return;
          });
        } catch (err) {
            console.error(err);  	
          getElement("error").textContent = "Error initiating Transaction. Possible no extra BNB for gas. if, contact us in Telegram";
          getElement("Spopup").style.display = "none";
          return;
        }
  
        const response = await fetch('https://robopuppy.world/presale/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            wallet: account,
            ratePerCPW: ROPUrateinBNB,
            CPW: "bnb",
            CPWamtPaid: amount,
            TokenAMT: getElement("ROPUinput").value,
            hash: ghash
          })
        }).then(response => {
          console.log(response);
  
          if (!response.ok) {
            throw new Error('HTTP error ' + response.status);
          }
  
          return response.json();
        }).then(async (data) => {
  
          console.log(data);
  
          // Handle the response data here
          if (data.eCode === "1xs_Uc+S") {
            // If the server responds with a success status, display a success message
            window.alert(data.FEMessage);
            
            location.reload();
            
          } else {
            document.write(data.FEMessage);
          }
  
        }).catch(error => console.error('Error:', error));
  
      }
     
    }
    

  let start = new Date().getTime();

  const originPosition = { x: 0, y: 0 };

  const last = {
    starTimestamp: start,
    starPosition: originPosition,
    mousePosition: originPosition
  }

  let count = 0;

  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
        selectRandom = items => items[rand(0, items.length - 1)];

  const withUnit = (value, unit) => `${value}${unit}`,
        px = value => withUnit(value, "px"),
        ms = value => withUnit(value, "ms");

  const calcDistance = (a, b) => {
    const diffX = b.x - a.x,
          diffY = b.y - a.y;

    return Math.sqrt(Math.pow(diffX, 2) + Math.pow(diffY, 2));
  }

  const calcElapsedTime = (start, end) => end - start;

  const appendElement = element => document.body.appendChild(element),
        removeElement = (element, delay) => setTimeout(() => document.body.removeChild(element), delay);

  const createStar = position => {
    const star = document.createElement("span"),
          color = selectRandom(config.colors);

    star.className = "fa-solid fa-gift gift";

    star.style.left = px(position.x);
    star.style.top = px(position.y);
    star.style.fontSize = selectRandom(config.sizes);
    star.style.color = `${color}`;
    star.style.textShadow = `0px 0px 1.5rem rgb(${color} / 0.5)`;
    star.style.animationName = config.animations[count++ % 3];
    star.style.starAnimationDuration = ms(config.starAnimationDuration);
    star.style.position = "absolute";

    appendElement(star);

    removeElement(star, config.starAnimationDuration);
  }

  const createGlowPoint = position => {
    const glow = document.createElement("div");

    glow.className = "glow-point";

    glow.style.left = px(position.x);
    glow.style.top = px(position.y);
    glow.style.position = "absolute";

    appendElement(glow)

    removeElement(glow, config.glowDuration);
  }

  const determinePointQuantity = distance => Math.max(
    Math.floor(distance / config.maximumGlowPointSpacing),
    1
  );

    const createGlow = (last, current) => {
    const distance = calcDistance(last, current),
          quantity = determinePointQuantity(distance);

    const dx = (current.x - last.x) / quantity,
          dy = (current.y - last.y) / quantity;

    Array.from(Array(quantity)).forEach((_, index) => { 
      const x = last.x + dx * index, 
            y = last.y + dy * index;

      createGlowPoint({ x, y });
    });
  }

  const updateLastStar = position => {
    last.starTimestamp = new Date().getTime();

    last.starPosition = position;
  }

  const updateLastMousePosition = position => last.mousePosition = position;

  const adjustLastMousePosition = position => {
    if(last.mousePosition.x === 0 && last.mousePosition.y === 0) {
      last.mousePosition = position;
    }
  };

  const handleOnMove = e => {
    const mousePosition = { x: e.pageX, y: e.pageY }

    adjustLastMousePosition(mousePosition);

    const now = new Date().getTime(),
          hasMovedFarEnough = calcDistance(last.starPosition, mousePosition) >= config.minimumDistanceBetweenStars,
          hasBeenLongEnough = calcElapsedTime(last.starTimestamp, now) > config.minimumTimeBetweenStars;

    if(hasMovedFarEnough || hasBeenLongEnough) {
      createStar(mousePosition);

      updateLastStar(mousePosition);
    }

    createGlow(last.mousePosition, mousePosition);

    updateLastMousePosition(mousePosition);
  }

  if (!isMobile && config.cursorTrail) { window.onmousemove = e => handleOnMove(e); }

  if (!isMobile && config.cursorTrail) { window.ontouchmove = e => handleOnMove(e.touches[0]); }

  document.body.onmouseleave = () => updateLastMousePosition(originPosition); 
  
  
  });