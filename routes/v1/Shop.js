const express = require('express');
const router = express.Router();
const moment = require('moment');
const paypal = require('../../core/app').Paypal;
console.log(paypal)

/* Set Variables */
const ShopTokenKey = "1ca5f487e8d6529d61cc6f4231faceaa";
const ShopPIDKEY = "2979e32f8ed8a94ad85d505d1b193544";

/* Added NPM Packages */
const crypto = require('crypto');

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


router.post('/Purchases', async(req, res, next) => {
    try {
        /* Check Login */
        const CheckLogin = await req.Check(req.body["client_id"], req.body["token"]);
        if (CheckLogin == false) return res.send("Invalid Login");
        const TokenData = await req.GetData(req.body["client_id"], req.body["token"]);

        if (TokenData == undefined) return res.json({Error: "Access Denied"})
        else if (JSON.parse(TokenData).Panel == undefined) return res.json({Error: "Access Denied"})
        else if (JSON.parse(TokenData).Panel !== true) return res.json({Error: "Access Denied"})

        if (req.body.WID == undefined) return res.json({Error: "WID Undefined"})
        else if (req.body.WID == "") return res.json({Error: "WID Empty"})

        req.API.query("SELECT `id`,"+await QueryableDecrypt("PID", ShopPIDKEY)+",`Purchased`,`Status`,`Category`,`Item` FROM `shop_purchases` WHERE `WID`=? ORDER BY `id` DESC LIMIT 25;", [req.body.WID], async function (error, results, fields) {
            if (error) {
                console.error(error)
                return res.json({Error: error})
            }

            if (results[0] == undefined) return res.json({Info: false}); else {
                let Return = [];

                let TEST = 0;
                for (let i = 0; i < results.length; i++) {
                    if (TEST == 0) {
                        paypal.getSubscription(results[i].PID, async function(err, data) {
                            if (!err) {
                                console.log(data)
                                TEST = 1;
                            }
                        });
                    }
                    Return.push({
                        "id": results[i].id,
                        "Purchased": results[i].Purchased,
                        "Status": results[i].Status,
                        "Category": results[i].Category,
                        "Item": results[i].Item
                    })

                    if (i + 1 == results.length) {
                        return res.json({Info: Return});
                    }
                }
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

router.post('/BuyItem', async(req, res, next) => {
    try {
        /* Check Login */
        const CheckLogin = await req.Check(req.body["client_id"], req.body["token"]);
        if (CheckLogin == false) return res.send("Invalid Login");
        const TokenData = await req.GetData(req.body["client_id"], req.body["token"]);

        if (TokenData == undefined) return res.json({Error: "Access Denied"})
        else if (JSON.parse(TokenData).Panel == undefined) return res.json({Error: "Access Denied"})
        else if (JSON.parse(TokenData).Panel !== true) return res.json({Error: "Access Denied"})

        if (req.body.Category == undefined | req.body.Item == undefined | req.body.ItemID == undefined | req.body.WID == undefined) return res.json({Category: "Option Undefined"})
        else if (req.body.Category == "" | req.body.Item == "" | req.body.ItemID =="" | req.body.WID =="") return res.json({Error: "Option Empty"})

        const getItem = await req.API.query("SELECT `Price`,`Option`,`ShortDescription` FROM `shop_items` WHERE `Category`=? AND `Name`=?;", [req.body.Category,req.body.Item]);
        if (getItem[0] == undefined) return res.json({Error: "Item not found"})

        if (req.body.ItemID == 1 | req.body.ItemID == 2 | req.body.ItemID == 3) {
            const check = await req.API.query("SELECT `id` FROM `shop_purchases` WHERE `WID`=? AND `Status`='Active' AND (`ItemID`='1' OR `ItemID`='2' OR `ItemID`='3');", [req.body.WID]);
            if (check[0] !== undefined) return res.json({Error: "You already have an active VIP subscription"})
        }
        
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
                        ItemID: req.body.ItemID,
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

        let Buying = req.body.Buying;

        let nextPayment = new Date();

        switch (Buying["Length"]) {
            case "Month":
                nextPayment.setMonth(nextPayment.getMonth()+1)
                break;
            case "Year":
                nextPayment.setMonth(nextPayment.getFullYear()+1)
                break;
        }

        paypal.createSubscription(req.body.buytoken, req.body.payerid,{
            INITAMT:          Buying["Price"],
            AMT:              Buying["Price"],
            DESC:             Buying["Description"],
            BILLINGPERIOD:    Buying["Length"],
            BILLINGFREQUENCY: 1,
            PROFILESTARTDATE: await nextPayment
        }, async function(err, data) {
            if (!err) {
                req.API.query("INSERT INTO `shop_purchases` (`Token`,`PID`,`WID`,`ItemID`,`Category`,`Item`,`Price`,`Status`) VALUES("+await QueryableEncrypt(req.body.buytoken, ShopTokenKey)+","+await QueryableEncrypt(data.PROFILEID, ShopPIDKEY)+",?,?,?,?,?,'Active');", [req.body.WID,Buying["ItemID"],Buying["Category"],Buying["Item"],Buying["Price"]], async function (error, results, fields) {
                    if (error) {
                        console.error(error)
                        return res.json({Error: error})
                    }

                    return res.json({
                        "id": results.insertId,
                        "Category": Buying["Category"],
                        "Item": Buying["Item"],
                        "Length": Buying["Length"],
                        "Price": Buying["Price"]
                    });
                });
            }
        });
    } catch (error) {
        console.log(error)
        return res.json({Error: "Error"})
    }
});

module.exports = router;