const functions = require('firebase-functions');
var nodemailer = require('nodemailer');
const readline = require('readline');
var { google } = require('googleapis');

const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
var db = admin.firestore();

exports.testmail = functions.https.onRequest((request, response) => {
    //response.send("Hello from Firebase!");
    var title = request.body.subject;
    var msg = request.body.message;
    var dept = request.body.department;
    var newsheet = request.body.sheet;
    var fileurls = request.body.fileurls;

    var data = newsheet
    length = data.indexOf("/e") - data.indexOf("d/") - 2
    var newsheet = data.substr(data.indexOf('d/') + 2, length)

    console.log(fileurls);
    console.log(title);
    console.log(msg);
    console.log(dept);

    var jwt = getJwt();
    var apiKey = "";//Not Disclosed

    var ssheetId;


    if (dept == "it") {
        ssheetId = "1grABLBENfgSwJWNXNHftcn_4_6Ox1CeRB6HR83BeQFI";

    }
    else if(dept=="test"){
        ssheetId="1BYso5dG84UKg7fq401UFAJN22zycsQAdovD_gOV_NqE"
    }

    const sheets = google.sheets({ version: 'v4' });

    sheets.spreadsheets.values.get({
        spreadsheetId: ssheetId,
        auth: jwt,
        key: apiKey,
        range: 'Sheet1'
    }, (err, res) => {
        if (err) {
            console.log('The API returned an error: ' + err);
            response.send('<html><h1>Something went wrong please try again later or contact your TPC.</h1></html>')
        }
        const rows = res.data.values;
        if (rows.length) {
            console.log('Email:');
            var i = 0;
            // Print columns A and E, which correspond to indices 0 and 4.
            rows.map((row) => {
                /*console.log(i++);
                console.log(`${row[29]}`);*/
                if (i != 0) {
                    sendEmail(`${row[29]}`, title, msg.toString(), newsheet, dept, fileurls);
                }
                i++;
            });
            response.send("<html><h1>Emails Sent Succesfully</h1></html>")
        } else {
            console.log('No data found.');
        }
        console.log(rows);
    });


});

function getJwt() {
    var credentials = {
        //Not Disclosed
    };
    console.log(credentials.client_email);
    return new google.auth.JWT(
        credentials.client_email, null, credentials.private_key,
        ['https://www.googleapis.com/auth/spreadsheets']
    );
}

function sendEmail(recipient, title, message, newsheet, branch, fileurls) {
    console.log(message);
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'gcettpcmailer',
            pass: ''
        }
    });

    if (fileurls.length != 0) {
        var array = fileurls.split(";");
        var temp = []

        for (i = 0; i < array.length; i++) {
            if (array[i].length != 0)
                temp.push(array[i]);
        }

        var json = []
        for (i = 0; i < temp.length; i++) {
            var str = {
                'path': temp[i]
            }
            json.push(str)
        }


        var mailOptions = {
            from: 'gcettpcmailer',
            to: recipient,
            subject: title,
            html: '<html><p>' + message + '</p><br><br><a href="https://us-central1-mailservice-a7d67.cloudfunctions.net/participate?email=' + recipient + '&sheet=' + newsheet + '&branch=' + branch + '"><button>Participate</button></a></html>',
            attachments: json
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                return;
            } else {
                console.log('Email sent: ' + info.response);
                return;
            }
        });
    }
    else {

        var mailOptions = {
            from: 'gcettpcmailer',
            to: recipient,
            subject: title,
            html: '<html><p>' + message + '</p><br><br><a href="https://us-central1-mailservice-a7d67.cloudfunctions.net/participate?email=' + recipient + '&sheet=' + newsheet + '&branch=' + branch + '"><button>Participate</button></a></html>'
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                return;
            } else {
                console.log('Email sent: ' + info.response);
                return;
            }
        });

    }

}

exports.participate = functions.https.onRequest((request, response) => {
    var email = request.query.email;
    var sheet = request.query.sheet;
    var branch = request.query.branch;
    console.log(sheet)


    var jwt = getJwt();
    var apiKey = "AIzaSyC3gXrA8gXr2bylT2knVVZRc-0BvKvlvD4";

    var ssheetId = "";


    if (branch.toLowerCase() == "it") {
        ssheetId = "1grABLBENfgSwJWNXNHftcn_4_6Ox1CeRB6HR83BeQFI";

    }
    else if(branch.toLowerCase()=="test"){
        ssheetId="1BYso5dG84UKg7fq401UFAJN22zycsQAdovD_gOV_NqE";
    }

    const sheets = google.sheets({ version: 'v4' });

    var header = []

    sheets.spreadsheets.values.get({
        spreadsheetId: sheet,
        auth: jwt,
        key: apiKey,
        range: 'Sheet1'
    }, (err, res) => {
        if (err) return console.log('' + err);
        const rows = res.data.values;
        for (i = 0; i < 8; i++) {
            header.push(rows[i])
        }
        console.log("Header:" + header)
        console.log(header[2])

        if (header[1][1] == "active") {

            sheets.spreadsheets.values.get({
                spreadsheetId: ssheetId,
                auth: jwt,
                key: apiKey,
                range: 'Sheet1'
            }, (err, res) => {
                if (err) {
                    return console.log('The API returned an error: ' + err);
                }
                const rows = res.data.values;
                if (rows.length) {
                    console.log('Email:');
                    var i = 0;
                    // Print columns A and E, which correspond to indices 0 and 4.
                    rows.map((row) => {
                        /*console.log(i++);
                        console.log(`${row[29]}`);*/
                        if (i != 0) {
                            var remail = `${row[29]}`.toString()

                            //Writing in Sheet 
                            if (remail == email) {


                                if ((header[2][1] == '-' || `${row[8]}` >= header[2][1]) && (header[3][1] == '-' || `${row[10]}` >= header[3][1]) && (header[4][1] == '-' || `${row[24]}` <= header[4][1]) && (header[5][1] == '-' || `${row[14]}` >= header[5][1]) && (header[6][1] == '-' || `${row[26]}` <= header[6][1])) {
                                    console.log("Conditions Are Satisfied")

                                    sheets.spreadsheets.values.append({
                                        spreadsheetId: sheet,
                                        auth: jwt,
                                        key: apiKey,
                                        range: 'A1',
                                        valueInputOption: 'RAW',
                                        resource: { values: [row] }

                                    }, (err, res) => {
                                        if (err) {
                                            console.error(err)
                                            response.send("<html><h1>Something went wrong.Contact your tpc.</h1><html>")
                                        }
                                        else {
                                            //send confirmation mail
                                            sendConfirmationMail(`${header[0][1]}`, remail)
                                            response.send("<html><h1>Your Registration is Successful</h1><br><p>You will recieve confirmation mail soon</p><br><p>If you do no recieve confirmation mail within 1 hour register again or contact your TPC.</p><br><p>Thank You!</p><html>")
                                        }
                                    })

                                } else {
                                    response.send("<html><h1>You do not meet the criterion please contact you TPC regarding the same.</h1></html>")

                                }


                            }
                        }
                        i++;
                    });
                } else {
                    console.log('No data found.');
                }
                console.log(rows);
            });



        } else {
            console.log("Regisrtation Closed")
            //send html response
            response.send("<html><h1>Registration is closed now.Please contact you TPC for the same.</h1></html>")


        }

    })


    console.log(email);
});

function sendConfirmationMail(id, recipient) {

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'gcettpcmailer',
            pass: ''
        }
    });

    var mailOptions = {
        from: 'gcettpcmailer',
        to: recipient,
        subject: 'Regisration Confimation Email',
        html: '<html><p>This mail is the confirmation for your registration for Placement drive.</p><br><p>Drive ID ' + id + '.</p><br><br><*This drive id is for future reference.></html>'
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
            return;
        } else {
            console.log('Email sent: ' + info.response);
            return;
        }
    });

}


exports.infomail = functions.https.onRequest((request, response) => {

    var title = request.body.subject;
    var msg = request.body.message;
    var msgsheet = request.body.sheet;
    var fileurls = request.body.fileurls;

    console.log("Infomail_:" + fileurls);

    var data = msgsheet
    length = data.indexOf("/e") - data.indexOf("d/") - 2
    var msgsheet = data.substr(data.indexOf('d/') + 2, length)

    const sheets = google.sheets({ version: 'v4' });

    var jwt = getJwt();
    var apiKey = "";

    sheets.spreadsheets.values.get({
        spreadsheetId: msgsheet,
        auth: jwt,
        key: apiKey,
        range: 'Sheet1'
    }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        const rows = res.data.values;
        if (rows.length) {
            console.log('Email:');
            var i = 0;
            // Print columns A and E, which correspond to indices 0 and 4.
            rows.map((row) => {
                /*console.log(i++);
                console.log(`${row[29]}`);*/
                sendInfoMail(`${row[29]}`, title, msg.toString(), fileurls);
            });
        } else {
            console.log('No data found.');
        }
        console.log(rows);
    });

});

function sendInfoMail(email, title, msg, fileurls) {
    console.log("Infomail" + email);
    console.log("Infomail:" + fileurls);
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'gcettpcmailer',
            pass: ''
        }
    });

    if (fileurls.length != 0) {
        var array = fileurls.split(";");
        var temp = []

        for (i = 0; i < array.length; i++) {
            if (array[i].length != 0)
                temp.push(array[i]);
        }

        var json = []
        for (i = 0; i < temp.length; i++) {
            var str = {
                'path': temp[i]
            }
            json.push(str)
        }


        var mailOptions = {
            from: 'gcettpcmailer',
            to: email,
            subject: title,
            html: '<html><p>' + msg + '</html>',
            attachments: json
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                return;
            } else {
                console.log('Email sent: ' + info.response);
                return;
            }
        });
    }
    else {

        var mailOptions = {
            from: 'gcettpcmailer',
            to: email,
            subject: title,
            html: '<html><p>' + msg + '</html>',
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                return;
            } else {
                console.log('Email sent: ' + info.response);
                return;
            }
        });

    }
}
