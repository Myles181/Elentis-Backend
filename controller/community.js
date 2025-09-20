// controllers/communityController.js
const Community = require('../models/community');
const asyncHandler = require('express-async-handler');
const { generateInvitationCode, getIds } = require('../utils/helpers');


const createCommunity = asyncHandler(async (req, res) => {
    const { name, description, isPrivate, initialMembers, requestRequired } = req.body;
    const creator = req.user._id;

    // Validation
    if (!name || name.trim().length < 3) {
        return res.status(400).json({ success: false, message: 'Community name must be at least 3 characters' });
    }

    // Prepare members: Include creator + initialMembers (array of user IDs)
    const members = [creator];
    if (initialMembers && Array.isArray(initialMembers)) {
        // Validate initialMembers are valid ObjectIds (add full check if needed)
        if (initialMembers.includes(creator.toString())) {
            return res.status(400).json({ success: false, message: 'Creator cannot be in initial members list' });
        }
        if (isPrivate) {
            initialMembers.forEach(memberId => {
                members.push({ user: memberId, approved: false });
            });
        }
        members.push(...initialMembers);
    }


    const inviteCode = await generateInvitationCode();
    const community = await Community.create({
        name: name.trim(),
        description: description ? description.trim() : '',
        creator,
        members,
        isPrivate: isPrivate || false,
        requestRequired: requestRequired || false,
        inviteCode
    });

    // Populate creator and members for response
    await community.populate('creator members', 'name email'); // Assuming User has name/email

    return res.status(201).json({
        success: true,
        message: 'Community created successfully',
        community
    });
});

// Optional: Add more functions like getCommunities, joinCommunity, etc.

const getCommunities = asyncHandler(async (req, res) => {
    const communities = await Community.find({ isPrivate: true });

    return res.status(200).json({
        success: true,
        message: 'Fetched all communities successfully',
        communities
    });
});

const getMyCommunities = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const myCommunities = await Community.find({ members: { $in: [userId] }, approved: true });

    return res.status(200).json({
        success: true,
        message: 'Fetched all users communities successfully',
        myCommunities
    });
});

const joinCommunities = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { invitationCode } = req.body;

    // Get the community Id and referral User Id
    const { communityId, refUserId } = getIds(invitationCode);

    // Find the community by ID
    const community = await Community.findById(communityId);
    if (!community) {
        return res.status(404).json({ success: false, message: 'Community not found' });
    }

    // Check if user is already a member
    if (community.members.includes(userId)) {
        return res.status(400).json({ success: false, message: 'User is already a member of this community' });
    }

    // Add user to members array
    community.members.push(userId);
    if ( community.isPrivate || community.requestRequired === true ) {
        community.approved = false;
    }

    if (refUserId) {
        community.invitations.push({user: userId, invitedBy: refUserId});
    }

    await community.save();

    // Optionally populate creator and members for response
    await community.populate('creator members', 'name email');

    return res.status(200).json({
        success: true,
        message: 'Joined community successfully',
        community
    });
});

const leaveCommunity = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { communityId } = req.body;

    // Find the community by ID
    const community = await Community.findById(communityId);
    if (!community) {
        return res.status(404).json({ success: false, message: 'Community not found' });
    }

    // Check if user is already a member
    if (!community.members.includes(userId)) {
        return res.status(400).json({ success: false, message: 'User is not a member of this community' });
    }

    // Remove the user as a member
    community.members = community.members.filter(
        memberId => memberId.toString() !== userId.toString()
    );

    await community.save();

    return res.status(200).json({
        success: true,
        message: 'User left community successfully'
    });
});

module.exports = { createCommunity, getCommunities, getMyCommunities, joinCommunities, leaveCommunity };