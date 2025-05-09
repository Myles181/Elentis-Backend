const { Waitlist } = require('../models/waitlist');

async function waitlistAdd(req, res) {
    try {
        const { email } = req.body;

        // Check if email is empty
        if (!email) return res.status(400).json({ message: 'Email field is required' });

        // Save email in waitlist
        const emailExist = await Waitlist.findOne({email: email});
        if (emailExist) return res.status(200).json({
            success: true,
            message: 'Email already exist in waitlist'
        });

        await Waitlist.create({
            email: email
        });

        return res.status(200).json({
            success: true,
            message: 'Email added to waitlist successfully'
        });

    } catch (error) {
        console.log("error::", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
}

async function waitlistRetrieve(req, res) {
    try {
        const emails = await Waitlist.find({}, {email: 1, createdAt: 1, _id: 0}).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            length: emails.length,
            emails 
        });

    } catch (error) {
        console.log("error::", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    } 
}


module.exports = {waitlistAdd, waitlistRetrieve};