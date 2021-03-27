// package imports
const bcrypt = require("bcryptjs");
const Sequelize = require("sequelize");
const uniqueString = require('unique-string');
const nodemailer = require("nodemailer");
const speakeasy = require("speakeasy");
const generateUniqueId = require('generate-unique-id');

// local imports
const parameters = require("../config/params");
const resetpassword = require("../models/resetpassword");
const Users = require("../models").User;
const ResetPasswords = require("../models").ResetPassword;
const Referrals = require("../models").Referral;
const Chats = require("../models").Chat;
const Verifications = require("../models").Verification;
const helpers = require("../helpers/cryptedge_helpers");
const countries = require('../libs/Data')
// imports initialization
const Op = Sequelize.Op;


exports.index = (req, res, next) => {
    //res.render("auths/login2");
    res.render("index");
}

exports.signInUser = (req, res, next) => {
    //res.render("auths/login2");
    res.render("loginb");
}

exports.about = (req, res, next) => {
    //res.render("auths/login2");
    res.render("about");
}


exports.faq = (req, res, next) => {
    //res.render("auths/login2");
    res.render("faq");
}

exports.pricing = (req, res, next) => {
    //res.render("auths/login2");
    res.render("pricing");
}

exports.terms = (req, res, next) => {
    //res.render("auths/login2");
    res.render("terms");
}

exports.contact = (req, res, next) => {
    //res.render("auths/login2");
    res.render("contact");
}

exports.privacy = (req, res, next) => {
    //res.render("auths/login2");
    res.render("privacy");
}






exports.getLink = (req, res, next) => {
    res.render("forgot");
}

exports.twofaPage = (req, res, next) => {
    Verifications.findOne({
            where: {
                user_id: {
                    [Op.eq]: req.session.userId
                }
            }
        })
        .then(verified => {
            if (verified && (verified.twofa_status == 1 || verified.twofa_status == '1')) {
                res.render("auths/auth_twofa", {
                    imageurl: verified.twofa_image
                });
            } else {
                res.redirect("/")
            }

        })
        .catch(error => {
            res.redirect("/")
        });
}

exports.emailFaPage = (req, res, next) => {
    Users.findOne({
        where: {
            id: {
                [Op.eq]: req.session.userId
            }
        }
    })
    .then(user => {
        Verifications.findOne({
            where: {
                user_id: {
                    [Op.eq]: req.session.userId
                }
            }
        })
        .then(verified => {
            if (verified && (verified.email_status == 1 || verified.email_status == '1')) {
                let email_value = helpers.makeid();
                Verifications.update({
                        email_code: email_value
                    }, {
                        where: {
                            user_id: {
                                [Op.eq]: req.session.userId
                            }
                        }
                    })
                    .then(auth => {
                        const output = `<html>
                                        <head>
                                          <title>Bitmint Email Authentication</title>
                                        </head>
                                        <body>
                                        <p>Use the below value to verify your email</p></br>
                                        <strong>${email_value}</strong>
                                        
                                       
                                        </body>
                                    </html>`;
                        let transporter = nodemailer.createTransport({
        
                            host: parameters.EMAIL_HOST,
                            port: parameters.EMAIL_PORT,
                            secure: true, // true for 465, false for other ports
                            auth: {
                                user: parameters.EMAIL_USERNAME, // generated ethereal user
                                pass: parameters.EMAIL_PASSWORD, // generated ethereal password
                            },
                        });

                        let mailOptions = {
                            from: ` "BITMINT" <${parameters.EMAIL_USERNAME}>`, // sender address
                            to: `${user.email}`, // list of receivers
                            subject: "[Bitmint] Email Authentication", // Subject line
                            text: "Bitmint", // plain text body
                            html: output, // html body
                        }
                        transporter.sendMail(mailOptions, (error, info) => {
                            if (error) {
                                console.log(error)
                                req.flash('error', "Error sending mail, refresh page");
                                res.render("auths/auth_email");
                            } else {
                                console.log('success')
                                req.flash('success', "Reset link sent to email");
                                res.render("auths/auth_email");
                            }
                        });
                        //res.render("auths/auth_email");
                    })
                    .catch(error => {
                        res.redirect("/");
                    });
            } else {
                res.redirect("/");
            }

        })
        .catch(error => {
            res.redirect("/")
        });
    })
    .catch(error => {
        res.redirect("/");
    });
}

exports.verify2FaKey = (req, res, next) => {
    const {
        twofa
    } = req.body;
    if (!twofa) {
        req.flash('warning', "Enter Verification Code");
        res.redirect("back");
    } else {
        Verifications.findOne({
                where: {
                    user_id: {
                        [Op.eq]: req.session.userId
                    }
                }
            })
            .then(verified => {
                if (verified && (verified.twofa_status == 1 || verified.twofa_status == "1")) {
                    let twoWayStatus = speakeasy.totp.verify({
                        secret: verified.twofa_code,
                        encoding: "base32",
                        token: twofa
                    });
                    //res.redirect("back");
                    if (twoWayStatus) {
                        //res.redirect("/home");
                        //req.flash('success', "Two-Factor code validated");
                        req.session.userTfa = 1;
                        res.redirect("home");
                    } else {
                        req.flash('warning', "Enter a Valid code");
                        res.redirect("back");
                    }
                } else {
                    res.redirect("/");
                }
            })
            .catch(error => {
                res.redirect("/");
            });
    }
}

exports.verifyEmail = (req, res, next) => {
    const {
        email_code
    } = req.body;
    if (!email_code) {
        req.flash('warning', "Enter Verification Code");
        res.redirect("back");
    } else {
        Verifications.findOne({
                where: {
                    user_id: {
                        [Op.eq]: req.session.userId
                    }
                }
            })
            .then(verified => {
                if (verified && (verified.email_status == 1 || verified.email_status == "1")) {
                    if (verified.email_code == email_code) {
                        req.session.userTFEmail = 1;
                        res.redirect("home");
                    } else {
                        req.flash('warning', "Enter a Valid code");
                        res.redirect("back");
                    }

                } else {
                    res.redirect("/");
                }
            })
            .catch(error => {
                res.redirect("/");
            });
    }
}

exports.resetPassword = (req, res, next) => {
    let email = req.query.email;
    let token = req.query.token;
    console.log(email)
    console.log(token)
    ResetPasswords.findOne({
            where: {
                [Op.and]: [{
                        user_email: {
                            [Op.eq]: email
                        }
                    },
                    {
                        token: {
                            [Op.eq]: token
                        }
                    }
                ]
            }
        })
        .then(reset => {
           
            if (reset) {
               

                // save as session the reset email and reset token
                req.session.resetEmail = email;
                req.session.resetToken = token;
                console.log(`${email} ${token}`);
                res.render("resetfrommail");
            } else {
                
                req.flash('warning', "Invalid reset details");
                res.redirect("/");
            }
        })
        .catch(error => {
            
            req.flash('error', "Server Error, try again!");
            res.redirect("/");
        });
}

exports.postResetPassword = (req, res, next) => {
    const {
        password1,
        password2
    } = req.body;
    if (!password1 || !password2) {
        req.flash('warning', "Enter Passwords");
        res.redirect("back");
    } else if (password1 != password2) {
        req.flash('warning', "Passwords must match");
        res.redirect("back");
    } else if (password1.length < 6) {
        req.flash('warning', "Passwords must be greater than 5 letters");
        res.redirect("back");
    } else {
        let currentPassword = bcrypt.hashSync(password1, 10);
        Users.update({
                password: currentPassword
            }, {
                where: {
                    email: {
                        [Op.eq]: req.session.resetEmail
                    }
                }
            })
            .then(update => {
                req.flash('success', "Password changed successfully!");
                res.redirect("/login");
            })
            .catch(error => {
                req.flash('error', "Server Error, try again!");
                res.redirect("back");
            })
    }
}

exports.postGetLink = (req, res, next) => {
    const {
        email
    } = req.body;
    if (!email) {
        req.flash('warning', "Please enter email");
        res.redirect("back");
    } else {
        Users.findOne({
                where: {
                    email: {
                        [Op.eq]: email
                    }
                }
            })
            .then(user => {
                if (user) {
                    
                    let token = uniqueString();
                    const output = `<html>
                                        <head>
                                          <title>Reset Password link for Bitmint</title>
                                        </head>
                                        <body>
                                        <p>You requested to change your password, please ignore If you didn't make the request</p>
                                        <a href='${parameters.SITE_URL}/resetpassword?email=${email}&token=${token}'>RESET PASSWORD</a>
                                        </body>
                                    </html>`;
                    let transporter = nodemailer.createTransport({
                        host: parameters.EMAIL_HOST,
                        port: parameters.EMAIL_PORT,
                        secure: true, // true for 465, false for other ports
                        auth: {
                            user: parameters.EMAIL_USERNAME, // generated ethereal user
                            pass: parameters.EMAIL_PASSWORD, // generated ethereal password
                        },
                    });

                    // send mail with defined transport object
                    let mailOptions = {
                        from: ` "BITMINT OPTION" <${parameters.EMAIL_USERNAME}>`, // sender address
                        to: `${email}`, // list of receivers
                        subject: "[Bitmint] Please reset your password", // Subject line
                        text: "BITMINT", // plain text body
                        html: output, // html body
                    }

                    // insert into forgot password the value of the token and email
                    // if email exists already update else insert new
                    ResetPasswords.findOne({
                        
                        
                            where: {
                                user_email: {
                                    [Op.eq]: email
                                }
                            }
                        })
                        .then(reset => {
                           
                            if (reset) {
                                // update
                                ResetPasswords.update({
                                        token: token
                                    }, {
                                        where: {
                                            user_email: {
                                                [Op.eq]: email
                                            }
                                        }
                                    })
                                    .then(updated => {
                                        transporter.sendMail(mailOptions, (error, info) => {
                                            if (error) {
                                                console.log(error)
                                                req.flash('error', "Error sending mail");
                                                res.redirect("back");
                                            } else {
                                                req.flash('success', "Reset link sent to email");
                                                res.redirect("back");
                                            }
                                        });
                                    })
                                    .catch(error => {
                                        console.log(error)
                                        req.flash('error', "Server Error, try again!");
                                        res.redirect("back");
                                    });
                            } else {
                                // new
                                ResetPasswords.create({
                                        user_email: email,
                                        token: token,
                                        status: 0
                                    })
                                    .then(created => {
                                        transporter.sendMail(mailOptions, (error, info) => {
                                            if (error) {
                                                console.log(error)
                                                req.flash('error', "Error sending mail");
                                                res.redirect("back");
                                            } else {
                                                req.flash('success', "Reset link sent to email");
                                                res.redirect("back");
                                            }
                                        });
                                    })
                                    .catch(error => {
                                        req.flash('error', "Server Error, try again!");
                                        res.redirect("back");
                                    })
                            }
                        })
                        .catch(error => {
                            req.flash('error', "Server Error, try again!");
                            res.redirect("back");
                        });


                } else {
                    req.flash('warning', "Email not found");
                    res.redirect("back");
                }
            })
            .catch(error => {
                req.flash('error', "Try again, something went wrong!");
                res.redirect("back");
            });
    }
}



exports.signup = (req, res, next) => {
    let reference = req.query.ref;
    if (reference != null) {
        req.session.ref = reference;
    } else {
        req.session.ref = "";
    }
    res.render("registerb");
}

exports.login = (req, res, next) => {
    const {
        email,
        password
    } = req.body;
    
    if (email && password) {
        Users.findOne({
                where: {
                    email: {
                        [Op.eq]: req.body.email
                    }
                }
            })
            .then((user) => {
                if (user) {
                    
                    let password = req.body.password;
                    if (bcrypt.compareSync(password, user.password)) {
                        req.session.userId = user.id;
                        req.session.role = user.role;
                        console.log('user found')
                        res.redirect("/home");
                    } else {
                        console.log('no user')
                        req.flash('warning', "Invalid credentials");
                        res.redirect("back");
                    }
                } else {
                    req.flash('warning', "Invalid credentials");
                    res.redirect("back");
                }
            })
            .catch(error => {
                req.flash('error', "Try again, something went wrong!");
                res.redirect("back");
            });
    } else {
        req.flash('warning', "Invalid credentials");
        res.redirect("back");
    }
}

exports.signupUser = (req, res, next) => {
    const mailformat = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    const digits_only = string => [...string].every(c => '+0123456789'.includes(c));
    const {
        name,
        email,
        phone,
        walletAddress,
        mining,
        country,
        password,
        password2,
    } = req.body;
    if (!name) {
        req.flash('warning', "Please enter name");
        res.redirect("back");
    } else if (!email) {
        req.flash('warning', "Please enter email");
        res.redirect("back");
    } else if (!phone) {
        req.flash('warning', "Please enter phone");
        res.redirect("back");
    } else if (!walletAddress) {
        req.flash('warning', "Please enter wallet address");
        res.redirect("back");
    } else if (!mining) {
        req.flash('warning', "Please enter mining option");
        res.redirect("back");
    } else if (!country) {
        req.flash('warning', "Please enter country");
        res.redirect("back");
    } else if (!password) {
        req.flash('warning', "Please enter password");
        res.redirect("back");
    } else if (!password2) {
        req.flash('warning', "Please enter password 2");
        res.redirect("back");
    } else if (!email.match(mailformat)) {
        req.flash('warning', "Enter valid email address");
        res.redirect("back");
    } else if (!digits_only(phone) || phone.length < 11) {
        req.flash('warning', "Enter valid mobile phone");
        res.redirect("back");
    } else if (name.length < 5) {
        req.flash('warning', "Name must be greater than 5 letters");
        res.redirect("back");
    } else if (password.length < 6) {
        req.flash('warning', "Passwords must be greater than 5 letters");
        res.redirect("back");
    } else {
        let uniqueRef = generateUniqueId({
            length: 8,
            useLetters: true
          });

          console.log(uniqueRef)
        
        Users.findOne({
            where: {
                email: {
                    [Op.eq]: email
                }
            }
        })



        .then((user) => {

            if (!user) {
                let name = req.body.name;
                let mining = req.body.mining;
                let walletAddress = req.body.walletAddress;
                let country = req.body.country;
                let email = req.body.email;
                let phone = req.body.phone;
                let password = bcrypt.hashSync(req.body.password, 10);
        

                // check the user with that particular reference
                Users.findOne({
                        where: {
                            reference: {
                                [Op.eq]: req.session.ref
                            }
                        }
                    })
                    .then(refuser => {
                        // if the reference is valid, add it to the user as its referral
                        if (refuser) {
                            Users.create({
                                    name: name,
                                    email: email,
                                    country:country,
                                    walletAddress:walletAddress,
                                    mining:mining,
                                    phone: phone,
                                    password: password,
                                    reference: uniqueRef,
                                    referral_id: refuser.id
                                })
                            
                                .then((newuser) => {
                                   
                                    // add user to the referral section
                                    Referrals.create({
                                            referral_id: refuser.id,
                                            user_id: newuser.id
                                        })
                                        .then(referral => {
                                            Users.findOne({
                                                where: {
                                                    email: {
                                                        [Op.eq]: newuser.email
                                                    }
                                                }
                                            }).then((response)=>{
                                                let user_email = response.dataValues.email
                                                const output = `<html>
                                                <head>
                                                  <title>Bitmint Account Verification</title>
                                                </head>
                                                <body>
                                                <p>Use the below value to verify your email</p></br>
                                                <strong>${user_email}</strong>
                                                
                                               
                                                </body>
                                            </html>`;
                                let transporter = nodemailer.createTransport({
                
                                    host: parameters.EMAIL_HOST,
                                    port: parameters.EMAIL_PORT,
                                    secure: true, // true for 465, false for other ports
                                    auth: {
                                        user: parameters.EMAIL_USERNAME, // generated ethereal user
                                        pass: parameters.EMAIL_PASSWORD, // generated ethereal password
                                    },
                                });
        
                                let mailOptions = {
                                    from: ` "BITMINT" <${parameters.EMAIL_USERNAME}>`, // sender address
                                    to: `${user_email}`, // list of receivers
                                    subject: "[Bitmint] Account Verification", // Subject line
                                    text: "Bitmint", // plain text body
                                    html: output, // html body
                                }
                                transporter.sendMail(mailOptions, (error, info) => {
                                    if (error) {
                                        console.log(error)
                                        req.flash('error', "Error sending mail, refresh page");
                                        res.render("auths/auth_email");
                                    } else {
                                        console.log('success')
                                        req.flash('success', "Reset link sent to email");
                                        res.render("auths/auth_email");
                                    }
                                });

                                            })
                                           
                                            // increase user referrals
                                            req.flash('success', "Registration successful, please check your email for a link to verify your account");
                                            req.session.ref = "";
                                        })
                                        .catch(error => {
                                            req.flash('error', "Something went wrong try again");
                                            res.redirect("back");
                                            res.send(error)
                                        });
                                })
                                .catch(error => {
                                    req.flash('error', "Something went wrong try again");
                                    //res.redirect("back");
                                    res.send(error)
                                });
                        } else {
                            // if referral is not valid, just create the user like that
                            Users.create({
                                name: name,
                                email: email,
                                country:country,
                                walletAddress:walletAddress,
                                mining:mining,
                                phone: phone,
                                password: password,
                                reference: uniqueRef,
                               
                                })
                                .then((response) => {
                                    let user_email = response.dataValues.email
                                    const output = `<html>
                                        <head>
                                          <title>Bitmint Email Authentication</title>
                                        </head>
                                        <body>
                                        <p>Use the below value to verify your email</p></br>
                                        <strong>${user_email}</strong>
                                        
                                       
                                        </body>
                                    </html>`;
                        let transporter = nodemailer.createTransport({
        
                            host: parameters.EMAIL_HOST,
                            port: parameters.EMAIL_PORT,
                            secure: true, // true for 465, false for other ports
                            auth: {
                                user: parameters.EMAIL_USERNAME, // generated ethereal user
                                pass: parameters.EMAIL_PASSWORD, // generated ethereal password
                            },
                        });

                        let mailOptions = {
                            from: ` "BITMINT" <${parameters.EMAIL_USERNAME}>`, // sender address
                            to: `${user_email}`, // list of receivers
                            subject: "[Bitmint] Email Verification", // Subject line
                            text: "Bitmint", // plain text body
                            html: output, // html body
                        }
                        transporter.sendMail(mailOptions, (error, info) => {
                            if (error) {
                                console.log(error)
                                req.flash('error', "Error sending mail, refresh page");
                                res.render("auths/auth_email");
                            } else {
                                console.log('success')
                                req.flash('success', "Reset link sent to email");
                                res.render("auths/auth_email");
                            }
                        });
                                    req.flash('success', "Registration successful");
                                    res.redirect("/login");
                                    req.session.ref = "";
                                })
                                .catch(error => {
                                    console.log(error)
                                    req.flash('error', "Something went wrong try again");
                                   res.redirect("back");
                                });
                        }
                    })
                    .catch(error => {
                        req.flash('error', "Something went wrong try again");
                        console.log(error)
                        res.redirect("back");
                    });
            } else {
                req.flash('warning', "Email already taken!");
                console.log('email taken')
                res.redirect("back");
            }
        })
        .catch(error => {
            req.flash('error', "Something went wrong try again");
            console.log(error)
            res.redirect("back");
        });
    }
    
}

exports.changePassword = (req, res, next) => {
    const {
        oldPassword,
        password,
        confirmPassword,
    } = req.body;
    // check if any of them are empty
    if (!oldPassword || !password || !confirmPassword) {
        req.flash('warning', "enter all fields");
        res.redirect("back");
    } else if (confirmPassword != password) {
        req.flash('warning', "passwords must match");
        res.redirect("back");
    } else if (confirmPassword.length < 6 || password.length < 6) {
        req.flash('warning', "passwords must be greater than 5 letters");
        res.redirect("back");
    } else {
        Users.findOne({
                where: {
                    id: {
                        [Op.eq]: req.session.userId
                    }
                }
            })
            .then(response => {
                if (bcrypt.compareSync(oldPassword, response.password)) {
                    // password correct
                    // update it then
                    let currentPassword = bcrypt.hashSync(password, 10);
                    Users.update({
                            password: currentPassword
                        }, {
                            where: {
                                id: {
                                    [Op.eq]: req.session.userId
                                }
                            }
                        })
                        .then(response => {
                            req.flash('success', "Password updated successfully");
                            res.redirect("back");
                        })
                        .catch(error => {
                            req.flash('error', "something went wrong");
                            res.redirect("back");
                        });
                } else {
                    req.flash('warning', "incorrect old password");
                    res.redirect("back");
                }
            })
            .catch(error => {
                req.flash('error', "something went wrong");
                res.redirect("back");
            });
    }
}

exports.logout = (req, res, next) => {
    // req.session.destroy(err => {
    //     if (err) {
    //         return res.redirect("/home");
    //     }
    //     res.clearCookie(parameters.SESSION_NAME);
    //     res.redirect("/");
    // });
    req.session = null;
    res.redirect("/");
}