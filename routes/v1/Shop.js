const express = require('express');
const router = express.Router();
const moment = require('moment');

/* Set Variables */
const IPsKey = "7831b0e33a16c72716ef2e2f5f7d2803";

var billingPlanAttribs = {
    "Arma3": {
        "VIP 1": {
            "name": "Orion-Entertainment VIP 1",
            "description": "Item From Orion-Entertainment's Shop",
            "type": "INFINITE",
            "payment_definitions": [{
                "name": "VIP 1",
                "type": "REGULAR",
                "frequency_interval": "1",
                "frequency": "MONTH",
                "cycles": "0",
                "amount": {
                    "currency": "USD",
                    "value": "0.01"
                }
            }],
            "merchant_preferences": {
                "cancel_url": "https://panel.orion-entertainment.net/shop/cancel", ///////////////////////////////////////////////
                "return_url": "https://panel.orion-entertainment.net/shop/bought",
                "max_fail_attempts": "0",
                "auto_bill_amount": "YES",
                "initial_fail_amount_action": "CANCEL"
            }
        }
    }
};

var billingPlanUpdateAttributes = [{
    "op": "replace",
    "path": "/",
    "value": {
        "state": "ACTIVE"
    }
}];

/* Added NPM Packages */
const crypto = require('crypto');
var paypal = require('paypal-rest-sdk');

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

async function makeBillingPlan(first, second) {
    const billingPlanAttrib = billingPlanAttribs[first];
    await paypal.billingPlan.create(billingPlanAttrib[second], function (error, billingPlan) {
        if (error) {
            console.log(error);
            return "Error";
        } else {
            updateBillingPlan(billingPlan.id);
            return billingPlan.id;
        }
    });
}

function updateBillingPlan(billingPlanID) {
    // Activate the plan by changing status to Active
    paypal.billingPlan.update(billingPlanID, billingPlanUpdateAttributes, function(error, response) {
        if (error) {
            console.log(error);
            return "Error";
        } else {
            console.log(billingPlanID);
        }
    });
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

            const Buy = await makeBillingPlan(req.body.Category, results[0].Name);
            
            if (results[0] == undefined) return res.json({Item: false}); else {
                return res.json({Item: {
                    "id": results[0].id,
                    "Name": results[0].Name,
                    "IMG": results[0].IMG,
                    "Price": results[0].Price,
                    "Option": results[0].Option,

                    "Buy": Buy
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

        if (req.body.buyid == undefined) return res.json({Error: "buyid Undefined"})
        else if (req.body.buyid == "") return res.json({Error: "buyid Empty"})
        
        var isoDate = new Date();
        isoDate.setSeconds(isoDate.getSeconds() + 4);
        isoDate.toISOString().slice(0, 19) + 'Z';

        var billingAgreementAttributes = {
            "name": "Standard Membership",
            "description": "Food of the World Club Standard Membership",
            "start_date": isoDate,
            "plan": {
                "id": req.body.buyid
            },
            "payer": {
                "payment_method": "paypal"
            }
        };

        // Use activated billing plan to create agreement
        paypal.billingAgreement.create(billingAgreementAttributes, function (
            error, billingAgreement){
            if (error) {
                console.error(error);
                return res.json({Error: error})
            } else {
                //capture HATEOAS links
                var links = {};
                billingAgreement.links.forEach(function(linkObj){
                    links[linkObj.rel] = {
                        'href': linkObj.href,
                        'method': linkObj.method
                    };
                })

                //if redirect url present, redirect user
                if (links.hasOwnProperty('approval_url')){
                    return res.send(links['approval_url'].href);
                } else {
                    console.error('no redirect URI present');
                }
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
        
        paypal.billingAgreement.execute(token, {}, function (error, 
            billingAgreement) {
            if (error) {
                console.error(error);
                return res.json({Error: error})
            } else {
                console.log(JSON.stringify(billingAgreement));
                return res.send('Billing Agreement Created Successfully');
            }
        });
    } catch (error) {
        console.log(error)
        return res.json({Error: "Error"})
    }
});

module.exports = router;