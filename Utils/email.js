const pug = require('pug');
const nodemailer = require('nodemailer');
const htmlToText = require('html-to-text');

module.exports = class Email {
    constructor(email, from, cc) {
        this.to = email;
        this.from = from;
        this.cc = cc;
    }

    newTransport() {
        return nodemailer.createTransport({
            service: 'gmail',
            secure: true,
            auth: {
                user: process.env.USER,
                pass: process.env.USER_PASSWORD,
            },
        });
    }

    //Send the actual email
    async send(template, subject, data) {
        //Render the html for the email based on a pug template
        const html = pug.renderFile(
            `${__dirname}/../Views/emails/${template}.pug`, { subject, data }
        );

        //Define the email options
        const mailOptions = {
            from: this.from,
            to: this.to,
            cc: this.cc,
            subject,
            html,
            text: htmlToText.fromString(html),
        };

        //Create a transport and send email

        await this.newTransport().sendMail(mailOptions);
    }

    async sendTest() {
        await this.send('test', 'Test');
    }

    async sendProgressReportSuccessAdmin(data) {
        await this.send('progressReportSuccessAdmin', 'New Progress Report', data);
    }

    async sendProgressReportUpdateSuccess(data) {
        await this.send(
            'progressReportUpdateSuccess',
            'Updated Progress Report',
            data
        );
    }

    async sendProgressReportSuccessTutor(data) {
        await this.send(
            'progressReportSuccessTutor',
            'Report received successfully',
            data
        );
    }

    async sendProgressReportIntro(data) {
        await this.send('progressReportIntro', 'Gate Progress Report', data);
    }

    async sendProgressReportParent(subject, data) {
        await this.send('progressReportParents', subject, data);
    }

    async sendProgressReportComment(subject, data) {
        await this.send('progressReportComment', subject, data);
    }
};