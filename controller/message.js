const { Users } = require('../models/users');
const Message = require('../models/messages');;
const Community = require('../models/community');

// Get all conversations for the logged-in user
const getAllMessagesProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        let conversations = [];

        // Direct Messages
        const directRooms = await Message.aggregate([
            {
                $match: {
                    messageType: "direct",
                    $or: [{ sender: userId }, { receiver: userId }]
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: { // Fixed: Changed $community to $group
                    _id: {
                        $cond: [
                            { $eq: ["$sender", userId] },
                            "$receiver",
                            "$sender"
                        ]
                    },
                    lastMessage: { $first: "$message" },
                    lastMessageAt: { $first: "$createdAt" }
                }
            }
        ]);

        for (const room of directRooms) {
            const otherUser = await Users.findById(room._id).select("name profilePicture");
            if (!otherUser) continue; // Skip if user not found

            const dmUnreadCount = await Message.countDocuments({
                sender: otherUser._id,
                receiver: userId,
                messageType: "direct",
                read: { $nin: [userId] }
            });

            conversations.push({
                type: "direct",
                id: otherUser._id,
                name: otherUser.name,
                profilePicture: otherUser.profilePicture || null,
                unreadMessages: dmUnreadCount,
                lastMessage: room.lastMessage,
                lastMessageAt: room.lastMessageAt
            });
        }

        // Community Messages
        const communities = await Community.find({
            "members.user": userId
        }).select("name image");

        for (const community of communities) {
            const lastMessage = await Message.findOne({
                communityId: community._id
            })
                .sort({ createdAt: -1 })
                .limit(1);

            const unreadCount = await Message.countDocuments({
                communityId: community._id,
                messageType: "group", // Fixed: Changed "community" to "group"
                sender: { $ne: userId },
                read: { $nin: [userId] }
            });

            conversations.push({
                type: "community",
                id: community._id,
                name: community.name,
                profilePicture: community.image || null,
                unreadMessages: unreadCount,
                lastMessage: lastMessage ? lastMessage.message : null,
                lastMessageAt: lastMessage ? lastMessage.createdAt : null
            });
        }

        // Sort by most recent message with fallback for null dates
        conversations.sort((a, b) => {
            const aTime = a.lastMessageAt ? new Date(a.lastMessageAt) : new Date(0);
            const bTime = b.lastMessageAt ? new Date(b.lastMessageAt) : new Date(0);
            return bTime - aTime;
        });

        return res.json({ success: true, conversations });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch messages profile" });
    }
};


// Get all messages from a conversation (user or community)
const getMessageById = async (req, res) => {
    try {
        const { id, type } = req.params;
        const userId = req.user._id;
        const { limit = 50, skip = 0 } = req.query;

        // Validate type
        if (!["direct", "community"].includes(type)) {
            return res.status(400).json({ error: "Invalid type parameter" });
        }

        let messages = [];
        let unreadCount = 0;

        if (type === "direct") {
            const roomId =
                userId.toString() < id ? `${userId}_${id}` : `${id}_${userId}`;

            messages = await Message.find({ roomId, messageType: "direct" })
                .sort({ createdAt: 1 })
                .limit(parseInt(limit))
                .skip(parseInt(skip))
                .populate("sender", "name profilePicture")
                .populate("receiver", "name profilePicture");

            messages = messages.map(msg => ({
                message: msg.message,
                sender: msg.sender?._id || null,
                username: msg.sender?.name || "Unknown",
                profilePicture: msg.sender?.profilePicture || null,
                read: msg.read.includes(userId),
                createdAt: msg.createdAt
            }));

            unreadCount = await Message.countDocuments({
                roomId,
                receiver: userId,
                messageType: "direct",
                read: { $nin: [userId] }
            });

            await Message.updateMany(
                {
                    roomId,
                    receiver: userId,
                    messageType: "direct",
                    read: { $nin: [userId] }
                },
                { $addToSet: { read: userId } }
            );
        } else if (type === "community") {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ error: "Invalid community ID" });
            }

            const isMember = await Community.findOne({
                _id: id,
                "members.user": userId
            });
            if (!isMember) {
                return res.status(403).json({ error: "Not a member of this community" });
            }

            messages = await Message.find({
                communityId: id,
                messageType: "group" // Fixed: Changed "community" to "group"
            })
                .sort({ createdAt: 1 })
                .limit(parseInt(limit))
                .skip(parseInt(skip))
                .populate("sender", "name profilePicture");

            messages = messages.map(msg => ({
                message: msg.message,
                sender: msg.sender?._id || null,
                username: msg.sender?.name || "Unknown",
                profilePicture: msg.sender?.profilePicture || null,
                read: msg.read.includes(userId),
                createdAt: msg.createdAt
            }));

            unreadCount = await Message.countDocuments({
                communityId: id,
                messageType: "group", // Fixed: Changed "community" to "group"
                read: { $nin: [userId] },
                sender: { $ne: userId }
            });

            await Message.updateMany(
                {
                    communityId: id,
                    messageType: "group", // Fixed: Changed "community" to "group"
                    read: { $nin: [userId] },
                    sender: { $ne: userId }
                },
                { $addToSet: { read: userId } }
            );
        }

        return res.json({
            success: true,
            messages,
            unreadCount
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch messages" });
    }
};

const markMessagesAsRead = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id, type } = req.params; // 'direct' or 'community'
        const unreadMessages = req.body.unreadMessages; // Array of message IDs to mark as read

        // Validate type
        if (!["direct", "community"].includes(type)) {
            return res.status(400).json({ error: "Invalid type parameter" });
        }

        // Check if unreadMessages is an array and non-empty
        if (!Array.isArray(unreadMessages) || unreadMessages.length === 0) {
            return res.status(400).json({ error: "unreadMessages must be a non-empty array" });
        }

        // Validate message IDs
        if (!unreadMessages.every(id => mongoose.Types.ObjectId.isValid(id))) {
            return res.status(400).json({ error: "Invalid message ID(s) provided" });
        }

        let updatedCount = 0;

        if (type === "direct") {
            // Verify the other user exists
            const otherUser = await Users.findById(id);
            if (!otherUser) {
                return res.status(404).json({ error: "User not found" });
            }

            // Build consistent roomId
            const roomId =
                userId.toString() < id ? `${userId}_${id}` : `${id}_${userId}`;

            // Verify messages are valid and unread
            const validMessages = await Message.find({
                _id: { $in: unreadMessages },
                roomId,
                messageType: "direct",
                receiver: userId,
                read: { $nin: [userId] } // Only unread messages
            }).select("_id");

            const validMessageIds = validMessages.map(msg => msg._id);

            if (validMessageIds.length === 0) {
                return res.status(400).json({ error: "No valid unread messages found to mark as read" });
            }

            // Mark messages as read
            const updateResult = await Message.updateMany(
                {
                    _id: { $in: validMessageIds },
                    roomId,
                    messageType: "direct",
                    receiver: userId,
                    read: { $nin: [userId] }
                },
                { $addToSet: { read: userId } } // Add userId to read array
            );

            updatedCount = updateResult.modifiedCount;
        } else {
            // Verify community ID and membership
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ error: "Invalid community ID" });
            }

            const community = await Community.findOne({
                _id: id,
                "members.user": userId
            });
            if (!community) {
                return res.status(403).json({ error: "Not a member of this community" });
            }

            // Verify messages are valid and unread
            const validMessages = await Message.find({
                _id: { $in: unreadMessages },
                communityId: id,
                messageType: "group",
                sender: { $ne: userId }, // Exclude user's own messages
                read: { $nin: [userId] } // Only unread messages
            }).select("_id");

            const validMessageIds = validMessages.map(msg => msg._id);

            if (validMessageIds.length === 0) {
                return res.status(400).json({ error: "No valid unread messages found to mark as read" });
            }

            // Mark messages as read
            const updateResult = await Message.updateMany(
                {
                    _id: { $in: validMessageIds },
                    communityId: id,
                    messageType: "group",
                    sender: { $ne: userId },
                    read: { $nin: [userId] }
                },
                { $addToSet: { read: userId } } // Add userId to read array
            );

            updatedCount = updateResult.modifiedCount;
        }

        return res.json({
            success: true,
            message: `${updatedCount} message(s) marked as read`
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to mark messages as read" });
    }
};


module.exports = { getAllMessagesProfile, getMessageById, markMessagesAsRead };


