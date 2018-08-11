const express = require('express');
const router = express.Router();
const moment = require('moment');

/* Set Variables */
const ShopPurchasesKEY = "be455ae96dacd91223b8e583c68261cb";
const ShopPIDKEY = "2979e32f8ed8a94ad85d505d1b193544";

/* Added NPM Packages */
const crypto = require('crypto');
var paypal = require('paypal-rest-sdk');
const randomString = require('random-string');

/* Functions */
async function EncryptData(key, data) {
    const cipher = crypto.createCipher('aes-256-cbc', key);
    let encrypted = cipher.update(data,'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}
async function DecryptData(key, data) {
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    let decrypted = decipher.update(data,'hex','utf8')
    decrypted += decipher.final('utf8');
    return decrypted;
}

function QueryableEncrypt(data, key) {
    return "AES_ENCRYPT('"+data+"', '"+key+"')";
}
function QueryableDecrypt(column, key) {
    return "CONVERT(AES_DECRYPT(`"+column+"`, '"+key+"') using utf8) AS '"+column+"'";
};

function formatNumber(number) {
    if (number == null) return null;
    else return number.toLocaleString();
}

function returnFalse(res, Name) {
    return res.json({
        [Name]: false
    }).end();
}

function returnResults(res, Name, Results) {
    return res.json({
        [Name]: Results
    }).end();
}

function updateBillingPlan(billingPlanID) {
    // Activate the plan by changing status to Active

}


/* Routers */
router.post('/', async(req, res, next) => {
    try {
        /* Check Login */
        const CheckLogin = await req.Check(req.body["client_id"], req.body["token"]);
        if (CheckLogin == false) return res.send("Invalid Login");
        const TokenData = await req.GetData(req.body["client_id"], req.body["token"]);

        if (TokenData == undefined) return res.json({Error: "Access Denied"})
        else if (JSON.parse(TokenData).Panel == undefined) return res.json({Error: "Access Denied"})
        else if (JSON.parse(TokenData).Panel !== true) return res.json({Error: "Access Denied"})

        req.API.query("SELECT `Name`,`IMG` FROM `shop_categories` WHERE `Active`='True' ORDER BY `id` ASC;", async function (error, results, fields) {
            if (error) {
                console.error(error)
                return res.json({Error: error})
            }

            if (results[0] == undefined) return res.json({Categories: false}); else return res.json({Categories: results});
        });
    } catch (error) {
        console.log(error)
        return res.json({Error: "Error"})
    }
});

router.post('/Category', async(req, res, next) => {
    try {
        /* Check Login */
        const CheckLogin = await req.Check(req.body["client_id"], req.body["token"]);
        if (CheckLogin == false) return res.send("Invalid Login");
        const TokenData = await req.GetData(req.body["client_id"], req.body["token"]);

        if (TokenData == undefined) return res.json({Error: "Access Denied"})
        else if (JSON.parse(TokenData).Panel == undefined) return res.json({Error: "Access Denied"})
        else if (JSON.parse(TokenData).Panel !== true) return res.json({Error: "Access Denied"})

        if (req.body.Category == undefined) return res.json({Error: "Category Undefined"})
        else if (req.body.Category == "") return res.json({Error: "Category Empty"})

        const CheckCategory = await req.API.query("SELECT `id` FROM `shop_categories` WHERE BINARY `Name`=? AND `Active`='True';", [req.body.Category]);
        if (CheckCategory[0] == undefined) return res.json({Error: "Category Not Found"})

        req.API.query("SELECT `id`,`Name`,`IMG`,`Price`,`Option`,`Description` FROM `shop_items` WHERE `Active`='True' AND BINARY `Category`=? ORDER BY `id` ASC;", [req.body.Category], async function (error, results, fields) {
            if (error) {
                console.error(error)
                return res.json({Error: error})
            }

            if (results[0] == undefined) return res.json({Category: false}); else {
                let Return = [];

                for (let i = 0; i < results.length; i++) {
                    Return.push({
                        "id": results[i].id,
                        "Name": results[i].Name,
                        "IMG": results[i].IMG,
                        "Price": results[i].Price,
                        "Option": results[i].Option,
                        "Description": JSON.parse(results[i].Description)
                    })

                    if (i + 1 == results.length) {
                        return res.json({Category: Return});
                    }
                }
            }
        });
    } catch (error) {
        console.log(error)
        return res.json({Error: "Error"})
    }
});

router.post('/Item', async(req, res, next) => {
    try {
        /* Check Login */
        const CheckLogin = await req.Check(req.body["client_id"], req.body["token"]);
        if (CheckLogin == false) return res.send("Invalid Login");
        const TokenData = await req.GetData(req.body["client_id"], req.body["token"]);

        if (TokenData == undefined) return res.json({Error: "Access Denied"})
        else if (JSON.parse(TokenData).Panel == undefined) return res.json({Error: "Access Denied"})
        else if (JSON.parse(TokenData).Panel !== true) return res.json({Error: "Access Denied"})

        if (req.body.Category == undefined) return res.json({Error: "Category Undefined"})
        else if (req.body.Category == "") return res.json({Error: "Category Empty"})
        else if (req.body.Item == undefined) return res.json({Error: "Item Undefined"})
        else if (req.body.Item == "") return res.json({Error: "Item Empty"})
        else if (isNaN(req.body.Item)) return res.json({Error: "Item Invalid"})

        const CheckCategory = await req.API.query("SELECT `id` FROM `shop_categories` WHERE BINARY `Name`=? AND `Active`='True';", [req.body.Category]);
        if (CheckCategory[0] == undefined) return res.json({Error: "Category Not Found"})

        req.API.query("SELECT `id`,`Name`,`IMG`,`Price`,`Option`,`Description`,`Images` FROM `shop_items` WHERE `Active`='True' AND BINARY `Category`=? AND `id`=?;", [req.body.Category, req.body.Item], async function (error, results, fields) {
            if (error) {
                console.error(error)
                return res.json({Error: error})
            }

            if (results[0] == undefined) return res.json({Item: false}); else {
                return res.json({Item: {
                    "id": results[0].id,
                    "Name": results[0].Name,
                    "IMG": results[0].IMG,
                    "Price": results[0].Price,
                    "Option": results[0].Option,
                    "Description": JSON.parse(results[0].Description),
                    "Images": JSON.parse(results[0].Images)
                }});
            }
        });
    } catch (error) {
        console.log(error)
        return res.json({Error: "Error"})
    }
});

router.post('/Buy', async(req, res, next) => {
    try {
        /* Check Login */
        const CheckLogin = await req.Check(req.body["client_id"], req.body["token"]);
        if (CheckLogin == false) return res.send("Invalid Login");
        const TokenData = await req.GetData(req.body["client_id"], req.body["token"]);

        if (TokenData == undefined) return res.json({Error: "Access Denied"})
        else if (JSON.parse(TokenData).Panel == undefined) return res.json({Error: "Access Denied"})
        else if (JSON.parse(TokenData).Panel !== true) return res.json({Error: "Access Denied"})

        if (req.body.Category == undefined) return res.json({Error: "Category Undefined"})
        else if (req.body.Category == "") return res.json({Error: "Category Empty"})
        else if (req.body.Item == undefined) return res.json({Error: "Item Undefined"})
        else if (req.body.Item == "") return res.json({Error: "Item Empty"})
        else if (isNaN(req.body.Item)) return res.json({Error: "Item Invalid"})

        const CheckCategory = await req.API.query("SELECT `id` FROM `shop_categories` WHERE BINARY `Name`=? AND `Active`='True';", [req.body.Category]);
        if (CheckCategory[0] == undefined) return res.json({Error: "Category Not Found"})

        req.API.query("SELECT `id`,`Name`,`IMG`,`Price`,`Option`,`Description`,`Images` FROM `shop_items` WHERE `Active`='True' AND BINARY `Category`=? AND `id`=?;", [req.body.Category, req.body.Item], async function (error, results, fields) {
            if (error) {
                console.error(error)
                return res.json({Error: error})
            }

            if (results[0] == undefined) return res.json({Item: false}); else {
                return res.json({Item: {
                    "id": results[0].id,
                    "Name": results[0].Name,
                    "IMG": results[0].IMG,
                    "Price": results[0].Price,
                    "Option": results[0].Option
                }});
            }
        });
    } catch (error) {
        console.log(error)
        return res.json({Error: "Error"})
    }
});


var Paypal = require('paypal-recurring'),
    paypal = new Paypal({
        username:  "flabby_api1.orionpanel.com",
        password:  "2CZ572V8AW7RZ5R9",
        signature: "AO8AZXM1PwgejSg7A5.a6ehCwVkDA1FQ-AMCas760jQCZ16BwQcdkFIw"
    }, "production");

router.post('/BuyItem', async(req, res, next) => {
    try {
        /* Check Login */
        const CheckLogin = await req.Check(req.body["client_id"], req.body["token"]);
        if (CheckLogin == false) return res.send("Invalid Login");
        const TokenData = await req.GetData(req.body["client_id"], req.body["token"]);

        if (TokenData == undefined) return res.json({Error: "Access Denied"})
        else if (JSON.parse(TokenData).Panel == undefined) return res.json({Error: "Access Denied"})
        else if (JSON.parse(TokenData).Panel !== true) return res.json({Error: "Access Denied"})

        if (req.body.Category == undefined | req.body.Item == undefined) return res.json({Category: "Option Undefined"})
        else if (req.body.Category == "" | req.body.Item == "") return res.json({Error: "Option Empty"})

        const getItem = await req.API.query("SELECT `Price`,`Option`,`ShortDescription` FROM `shop_items` WHERE `Category`=?, AND `Name`=?;", [req.body.Category,req.body.Item]);
        if (getItem[0] == undefined) return res.json({Error: "Item not found"})
        
        //const Price = getItem[0].Price;
        const Price = 0.02; //FOR TESTING
        const Description = getItem[0].ShortDescription;
        const Length = getItem[0].Option;

        paypal.authenticate({
            RETURNURL:                      "https://panel.orion-entertainment.net/Shop/Success",
            CANCELURL:                      "https://panel.orion-entertainment.net/Shop/Cancel",
            PAYMENTREQUEST_0_AMT:           Price,
            L_BILLINGAGREEMENTDESCRIPTION0: Description
          }, function(err, data, url) {
            // Redirect the user if everything went well with
            // a HTTP 302 according to PayPal's guidelines
            if (!err) {
                return res.json({
                    Data: {
                        Category: req.body.Category,
                        Item: req.body.Item,
                        Price: Price,
                        Description: Description,
                        Length: Length
                    },
                    URL: url
                })
            }
        });
    } catch (error) {
        console.log(error)
        return res.json({Error: "Error"})
    }
});

async function UniqueShopID() {
    const RandomString = await randomString({
        length: 12,
        numeric: true,
        letters: true,
        special: false
    });
    const ENCString = await QueryableEncrypt(RandomString, ShopPurchasesKEY);

    const checkString = await req.API.query("SELECT `id` FROM `shop_purchases` WHERE `id`="+ENCString+";");
    if (checkString[0] !== undefined) return false; else return [RandomString,ENCString];
}

function waitFor(condition, callback) {
    const Check = await condition;
    if (Check == false) {
        setTimeout(waitFor.bind(null, condition, callback), 100);
    } else {
        callback(Check);
    }
}


router.post('/Bought', async(req, res, next) => {
    try {
        /* Check Login */
        const CheckLogin = await req.Check(req.body["client_id"], req.body["token"]);
        if (CheckLogin == false) return res.send("Invalid Login");
        const TokenData = await req.GetData(req.body["client_id"], req.body["token"]);

        if (TokenData == undefined) return res.json({Error: "Access Denied"})
        else if (JSON.parse(TokenData).Panel == undefined) return res.json({Error: "Access Denied"})
        else if (JSON.parse(TokenData).Panel !== true) return res.json({Error: "Access Denied"})

        if (req.body.buytoken == undefined) return res.json({Error: "buytoken Undefined"})
        else if (req.body.buytoken == "") return res.json({Error: "buytoken Empty"})
        else if (req.body.payerid == undefined) return res.json({Error: "payerid Undefined"})
        else if (req.body.payerid == "") return res.json({Error: "payerid Empty"})
        else if (req.body.Buying == undefined) return res.json({Error: "Buying Undefined"})
        else if (req.body.Buying == "") return res.json({Error: "Buying Empty"})
        else if (req.body.WID == undefined) return res.json({Error: "WID Undefined"})
        else if (req.body.WID == "") return res.json({Error: "WID Empty"})

        const Buying = req.body.Buying;

        paypal.createSubscription(req.body.buytoken, req.body.payerid,{
            AMT:              Buying["Price"],
            DESC:             Buying["Description"],
            BILLINGPERIOD:    Buying["Length"],
            BILLINGFREQUENCY: 0
        }, function(err, data) {
            if (!err) {
                waitFor(await UniqueShopID(), (Info) => {
                    req.API.query("INSERT INTO `shop_purchases` (`id`,`PID`,`WID`,`Category`,`Item`,`Price`,`Status`) VALUES("+Info[1]+","+await QueryableEncrypt(data.PROFILEID, ShopPIDKEY)+",?,?,?,?,'Active');", [req.body.WID,Buying["Category"],Buying["Item"],Buying["Price"]], async function (error, results, fields) {
                        if (error) {
                            console.error(error)
                            return res.json({Error: error})
                        }
    
                        return res.json({
                            "id": Info[0],
                            "Category": Buying["Category"],
                            "Item": Buying["Item"],
                            "Price": Buying["Price"]
                        });
                    });
                })
            }
        });
    } catch (error) {
        console.log(error)
        return res.json({Error: "Error"})
    }
});

module.exports = router;