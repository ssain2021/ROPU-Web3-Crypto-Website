const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const path = require('path');
var cors = require('cors');
const {
  default: Web3
} = require('web3');
const fetch = import('node-fetch');
const fs = require('fs');
const Creds = require('../../../Credentials.json');
const logFile = require('../../../logs/Our_Website/NodeAutoManager.js');
const filePath = path.join(__dirname, 'bnbtousdt.json');
const https = require('https');

const app = express();
const port = 5000; // Change this to your desired port number
var alreadyErr = false;

// MySQL connection configuration
const dbConfig = {
  host: Creds.dbConfig.host,
  user: Creds.dbConfig.user,
  password: Creds.dbConfig.password,
  database: Creds.dbConfig.database,
};

// Create a MySQL pool to handle connections
const pool = mysql.createPool(dbConfig);

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cors());

// Parse JSON bodies (as sent by API clients)
app.use(bodyParser.json());
app.use(express.json());

// Serve the login page at http://127.0.0.1:666/authentication/login
app.get('/presale', (req, res) => {
  console.log("get request: Presale");
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/presale', (req, res) => {
      console.log("Post Request: Presale");
      const {
        wallet,
        getBalance,
        ratePerCPW,
        CPW,
        CPWamtPaid,
        TokenAMT,
        hash
      } = req.body;
  

      pool.getConnection((err, connection) => {
          if (err) {
            logFile.logRecord('Other_errors', {
                    Time: new Date().toISOString(),
                    'Error Type': 'Connection to SQL SCHEMA Failed:(',
                    Description: err,
                    'Wallet Address': wallet,
                    'CPW AMT': CPWamtPaid + CPW
            });
            return handleServerError(res, "Error connecting to MySQL database", "Server Error: Database Error ( Connection ): 1xccon; Please contact us in Telegram", "1xccon");
          }
        
        var USDTamt = CPWamtPaid;
        var jsonData;
        console.log(filePath);
        
        try { 
                jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
              } catch (error) {
              	if (!alreadyErr) {
                  logFile.logRecord('Failed_Buys', {
                    Time: new Date().toISOString(),
                    'Error Type': 'Total USDT Raised not incremented in the JSON File: JSON File cant be Parsed',
                    Description: err,
                    'Wallet Address': wallet,
                    'CPW AMT': CPWamtPaid + CPW
                  });
                  console.log(error);
                  alreadyErr = true;
                }
              }
        
		  
        if ( CPW === "bnb" ) {
          USDTamt = (CPWamtPaid * Number(jsonData.bnbtousdtprice));
        }
        
          if (!getBalance) {
            pool.query(`INSERT INTO Transactions VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [new Date().toISOString(), wallet, ratePerCPW, CPW, CPWamtPaid, TokenAMT, TokenAMT, USDTamt], (err, result) => {
              if (err) {
                logFile.logRecord('Failed_Buys', {
                    Time: new Date().toISOString(),
                    'Error Type': 'Insertion into Database failed',
                    Description: err,
                    'Wallet Address': wallet,
                    'CPW AMT': CPWamtPaid + CPW
                  });
                return handleServerError(res, "Error: " + err, "Error Inserting into Database (Please contact us in Telegram): " + err, "9_xFAILURE");
              }
              
              jsonData.totalUSDTraised = Number(jsonData.totalUSDTraised) + Number(USDTamt);
              
              const jsonString = JSON.stringify(jsonData, null, 2);
              try {
                fs.writeFileSync(filePath, jsonString, 'utf8');
              } catch (error) {
                if (!alreadyErr) {
                    logFile.logRecord('Failed_Buys', {
                      Time: new Date().toISOString(),
                      'Error Type': 'Total USDT Raised not incremented in the JSON File: JSON is not overwritten',
                      Description: err,
                      'Wallet Address': wallet,
                      'CPW AMT': CPWamtPaid + CPW
                    });
                    consol.log(error);
                    alreadyErr = true;
                }
              }
              
              sendTelegramMessageBuy(wallet, CPW, Number(CPWamtPaid).toFixed(5), Number(TokenAMT).toFixed(5), Number(jsonData.totalUSDTraised).toFixed(5), hash, jsonData.bnbtousdtprice, (err) => {
              	if(err) {
               
                }
              });
              
              if (!alreadyErr) {
                logFile.logRecord('Succesful_Buys', {
                  'Time': new Date().toISOString(),
                  'Error_Type': 'None',
                  'Description': 'Transaction successful',
                  'Wallet_Address': wallet,
                  'CPW_AMT': CPWamtPaid + "" + CPW,
                });
              }
              return handleServerError(res, TokenAMT + "ROPU Bought by " + wallet, "Succesfully Bought ROPU " + Number(TokenAMT).toFixed(5), "1xs_Uc+S");
            });
          } else {
          	pool.query(`select sum(TokensAMT) as sum from Transactions where WalletAddress = ?;`, [wallet], (err, result) => {
              if (err) {
                return handleServerError(res, "Error summing tokens from MySQL table: " + err, "Error: " + err, "9_xFAILURE");
              }

              if (result[0].sum) { 
                logFile.logRecord('Succesful_Buys', {
                  'Time': new Date().toISOString(),
                  'Error Type': 'None',
                  'Description': 'Transaction successful',
                  'Wallet Address': wallet,
                  'CPW AMT': CPWamtPaid + "" + CPW,
                }); 
                return handleServerError(res, result[0].sum + "ROPU Balance of " + wallet, result[0].sum.toFixed(6), "1xs_Uc+S"); 
              } else { 
                return handleServerError(res, "0 ROPU Balance of " + wallet, "0", "1xs_Uc+S"); 
              }
            });
          }
            
            connection.release();
          });
  
        });


    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on http://127.0.0.1:${port}`);
    });

    setInterval(async () => {
      const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      const web3 = new Web3('https://bsc-dataseed.binance.org/'); // Use a BSC node URL

      const BNBUSDTAggregatorAddress = '0x137924D7C36816E0DcAF016eB617Cc2C92C05782';

      const aggregatorABI = [{
        "constant": true,
        "inputs": [],
        "name": "latestRoundData",
        "outputs": [{
            "name": "roundId",
            "type": "uint80"
          },
          {
            "name": "answer",
            "type": "int256"
          },
          {
            "name": "startedAt",
            "type": "uint256"
          },
          {
            "name": "updatedAt",
            "type": "uint256"
          },
          {
            "name": "answeredInRound",
            "type": "uint80"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      }];

      try {
        const aggregator = new web3.eth.Contract(aggregatorABI, BNBUSDTAggregatorAddress);
        const roundData = await aggregator.methods.latestRoundData().call();

        const priceInWei = Number(roundData.answer) * 10 ** 10;

        const priceInUSDT = priceInWei / 10 ** 18;

        jsonData.bnbtousdtprice = priceInUSDT;

        const jsonString = JSON.stringify(jsonData, null, 2);
        fs.writeFileSync(filePath, jsonString, 'utf8');

      } catch (error) {
        console.error('Error fetching BNB to USDT price:', error);
      }
    }, 300000);

    function handleServerError(res, errorMessage, FEMessage, eCode, session) {
      console.error(errorMessage);
      if (session) {
        res.json({
          eCode: eCode,
          FEMessage: FEMessage,
          session: {
            SID: session.SID,
            expiry: session.SExp,
            name: session.name
          }
        });
      } else {
        res.json({
          eCode: eCode,
          FEMessage: FEMessage
        });
      }
    }

async function sendTelegramMessageBuy(wallet, cpw, cpwAmtPaid, tokenAmtReceived, totalRaised, hash, bnbtousdt) {
  const BOT_TOKEN = Creds.telegram.BOT_TOKEN;
  const chat_ID = Creds.telegram.CHAT_ID;
  
  const emojisList = ['🚀', '🟢'];  
  const emoji = emojisList[Math.floor(Math.random() * emojisList.length)];  
  var emojiCount = 0;
   
  if (cpw === "bnb") {
    emojiCount = Math.round(Math.sqrt(cpwAmtPaid * bnbtousdt))
  } else { 
 	emojiCount = Math.round(Math.sqrt(cpwAmtPaid));
  }
  
  console.log('DataType:totalRaised' + typeof(totalRaised));
  
  const emojis = emoji.repeat(Math.max(1, emojiCount)); // Emojis will be repeated 10 times to cover the full width

  const txurl = `https://bscscan.com/tx/${hash}`;
  const walleturl = `https://bscscan.com/address/${wallet}`;
  const message = ` 
	 \n
     <b>      💥🔥💵🚀🟢! ROPU BUY !💥🔥💵🚀🟢  </b> \n
	 ${emojis} 
     <b> AMOUNT Paid💵: </b> ${cpwAmtPaid} ${cpw.toUpperCase()}
     <b> ROPU Received: </b> ${tokenAmtReceived} 
     <b> Total $ Raised💰: </b> ${Number(Number(totalRaised).toFixed(2)).toLocaleString('en-US')} \n
	 <a href="${txurl}">Transaction BSCSCAN </a> | <a href="${walleturl}"> Wallet BSCSCAN </a> | <a href="https://robopuppy.world"> Buy ROPU </a>
     `;


  const data = JSON.stringify({
    chat_id: chat_ID,
    text: message,
    parse_mode: 'HTML' // Specify the parse_mode as HTML
  });
	
  
  const options = {
    hostname: 'api.telegram.org',
    port: 443,
    path: encodeURI(`/bot${BOT_TOKEN}/sendMessage?parse_mode=HTML&chat_id=${chat_ID}&text=${message}`),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
    },
  };

  const req = https.request(options, (res) => {
    let responseBody = '';

    res.on('data', (chunk) => {
        responseBody += chunk;
    });

    res.on('end', () => {
        console.log('Message successfully sent: ', responseBody);
    });
  });

  req.on('error', (error) => {
      console.error('Failed to send message: ', error);
  });

  req.write(data);
  req.end();
}