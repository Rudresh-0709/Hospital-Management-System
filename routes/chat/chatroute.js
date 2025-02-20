const express = require('express');
const router = express.Router();
const ChatMessage = require('../../models/chatModel');
const User = require('../../models/userModel');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require("mongoose");

router.use(express.json()); // ✅ Enables JSON body parsing
router.use(express.urlencoded({ extended: true })); // ✅ Parses form data

router.get('/', async (req, res) => {
    console.log("Chat route accessed")
    try {
        if (!req.session.currentUser) {
            return res.redirect('/'); // Redirect if user is not logged in
        }

        // Fetch the current user and get their allowedUsers array
        const currentUser = await User.findById(req.session.currentUser._id);
        if (!currentUser) {
            return res.status(404).send("User not found");
        }

        console.log("🚀 Current User Data:", currentUser);

        // Extract allowedUsers array (which contains userId values)
        const allowedUserIds = currentUser.allowedUsers || [];

        if (allowedUserIds.length === 0) {
            return res.status(200).render('chat', { users: [], currentUser, activeReceiver: {} });
        }

        // Fetch users whose userId is in allowedUsers
        const allowedUsers = await User.find({ userId: { $in: allowedUserIds } });

        console.log("✅ Allowed Users for Chat:", allowedUsers);

        // Format the users to send to the profile section
        const users = allowedUsers.map(user => ({
            _id: user._id,
            name: user.name,
            role: user.role,
            is_online: user.is_online,
            profilePicture: user.profilePicture,
            userId: user.userId
        }));

        let activeReceiver = {};
        if (req.query.receiverId) {
            activeReceiver = await User.findOne({ userId: req.query.receiverId }) || {};
        }
        console.log("The users are:",users)
        res.render('chat', { users, currentUser, activeReceiver });
    } catch (error) {
        console.error("❌ Error fetching chat data:", error);
        res.status(500).send("Error loading chat page");
    }
});
const chatUploadsDir = path.join(__dirname, './uploads/chat-files');

if (!fs.existsSync(chatUploadsDir)) {
    fs.mkdirSync(chatUploadsDir, { recursive: true });
}
const chatStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, chatUploadsDir); // Store files in "uploads/chat-files"
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname); // Unique filename
    }
});

const fileupload = multer({
    storage: chatStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit
});

// Get all chat messages (sorted by timestamp)
router.get('/messages', async (req, res) => {
  try {
    const messages = await ChatMessage.find()
      .populate('sender', 'name email')      // populate sender details (name, email)
      .populate('receiver', 'name email')    // populate receiver details
      .sort({ timestamp: 1 });
    res.json(messages); 
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.post("/upload-file", fileupload.single("file"), async (req, res) => {
    const { senderId, receiverId } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    try {
        // ✅ Check if sender exists
        const sender = await User.findById(senderId);
        if (!sender) {
            return res.status(404).json({ message: "Sender not found" });
        }

        // ✅ Check if receiver exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ message: "Receiver not found" });
        }

        // ✅ Ensure the receiver is in the sender's allowed users list
        if (!sender.allowedUsers.includes(receiver.userId)) {
            return res.status(403).json({ message: "You are not allowed to send files to this user" });
        }

        
        const fileUrl = `http://localhost:3000/uploads/chat-files/${req.file.filename}`;


        // ✅ Save the message with file details in the database
        const newMessage = new ChatMessage({
            sender: senderId,
            receiver: receiverId,
            message: "", // Empty text message since it's a file
            fileUrl: fileUrl,
            fileType: req.file.mimetype
        });

        await newMessage.save();

        res.json({
            message: "File uploaded successfully",
            fileUrl,
            fileType: req.file.mimetype,
        });

    } catch (error) {
        console.error("❌ Error uploading file:", error);
        res.status(500).json({ message: "Error saving message", error });
    }
});

router.get('/debug/uploads/*', (req, res) => {
    const filePath = path.join(__dirname, req.path.replace('/debug', ''));
    console.log("Checking file at:", filePath);
    res.send({ filePath, exists: fs.existsSync(filePath) });
});


router.post('/message', async (req, res) => {
    try {
        const { sender, senderId, receiver, receiverId, message } = req.body;
        const finalSender = sender || senderId;  // ✅ Ensure sender is always available
        const finalReceiver = receiver || receiverId;
        if (!finalSender || !finalReceiver || !message) {
            console.log("❌ Missing fields:", { finalSender, finalReceiver, message });
            return res.status(400).json({ error: "Sender, receiver, and message are required" });
        }
        
        const chatMessage = new ChatMessage({ 
            sender: finalSender, 
            receiver: finalReceiver, 
            message, 
            timestamp: new Date() 
        });
  
        await chatMessage.save();
  
        // ✅ Emit message to the receiver via WebSockets
        io.to(receiver).emit("newMessage", {
            _id: chatMessage._id,
            sender: chatMessage.sender.toString(),
            receiver: chatMessage.receiver.toString(),
            message: chatMessage.message,
            timestamp: chatMessage.timestamp
        });
  
        res.status(201).json(chatMessage);
    } catch (error) {
        console.error("❌ Error saving message:", error);
        res.status(500).json({ error: error.message });
    }
  });

const uploadDir = path.join(__dirname, './uploads/Profile-pictures');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
// Configure Multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // Store images in the "uploads" folder
    },
    filename: function (req, file, cb) {
        cb(null, req.params.userId + path.extname(file.originalname)); // Rename file with user ID
    }
});
const upload = multer({ storage: storage });

// Route to upload profile picture
router.post('/upload-profile/:userId', upload.single('profilePic'), async (req, res) => {
  try {
      if (!req.file) {
          return res.status(400).json({ success: false, message: "No file uploaded." });
      }

      // ✅ Ensure the correct path is stored in MongoDB
      const profilePicUrl = `/profile-pictures/${req.file.filename}`.replace('//', '/');


      await User.findByIdAndUpdate(req.params.userId, { profilePicture: `/profile-pictures/${req.file.filename}` });

      res.json({ success: true, profilePicture: profilePicUrl });
  } catch (error) {
      console.error("❌ Error uploading profile picture:", error);
      res.status(500).json({ success: false, message: "Error updating profile picture" });
  }
});

router.get('/api/current-user', (req, res) => {
  console.log("Session Data:", req.session); // Debugging

  if (!req.session.currentUser) {
      return res.status(401).json({ error: "User not logged in" });
  }
  
  res.json({ userId: req.session.currentUser._id });
});
router.get('/settings', (req, res) => {
  if (!req.session.currentUser) {
      return res.redirect('/login'); // Redirect if not logged in
  }
  res.render('settings', { userId: req.session.currentUser._id });
});
router.get('/api/user/:userId', async (req, res) => {
  try {
      const user = await User.findById(req.params.userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      res.json({ 
          name: user.name, 
          email: user.email, 
          profilePicture: user.profilePicture 
      });
  } catch (error) {
      res.status(500).json({ error: "Error fetching user details" });
  }
});
// router.post("/chat/addUser", async (req, res) => {
//     try {
//         console.log("Received Request:", req.body); // Debug incoming request

//         const { userId, currentUserId } = req.body;

//         if (!userId || !currentUserId) {
//             console.log("Missing user IDs");
//             return res.status(400).json({ message: "User ID is required." });
//         }

//         console.log("Fetching Users...");
//         const sender = await User.findById(currentUserId);
//         const receiver = await User.findById(userId);

//         if (!sender || !receiver) {
//             console.log("User not found");
//             return res.status(404).json({ message: "User not found." });
//         }

//         if (!sender.allowedUsers.includes(userId)) {
//             sender.allowedUsers.push(userId);
//             await sender.save();
//         }

//         if (!receiver.allowedUsers.includes(currentUserId)) {
//             receiver.allowedUsers.push(currentUserId);
//             await receiver.save();
//         }

//         console.log("User added successfully");
//         res.status(200).json({ message: "User added successfully." });
//     } catch (error) {
//         console.error("Error in /chat/addUser:", error);
//         res.status(500).json({ message: "Internal Server Error" });
//     }
// });
router.post("/addUser", async (req, res) => {
    try {
        let { userId, currentUserId } = req.body;

        console.log("Received userId:", userId); // Should be 6-digit number
        console.log("Received currentUserId:", currentUserId); // Should be MongoDB _id

        // Validate inputs
        if (!userId || !currentUserId) {
            return res.status(400).json({ message: "User ID and Current User ID are required." });
        }

        // Ensure currentUserId is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(currentUserId)) {
            return res.status(400).json({ message: "Invalid Current User ID format." });
        }

        // Ensure userId is a 6-digit number
        if (!/^\d{6}$/.test(userId)) {
            return res.status(400).json({ message: "Invalid user ID format. Must be a 6-digit number." });
        }

        // Find current user by _id
        const sender = await User.findById(currentUserId);
        if (!sender) {
            return res.status(404).json({ message: "Current user not found." });
        }

        // Find receiver by userId (6-digit code)
        const receiver = await User.findOne({ userId }); // `userId` is the field storing 6-digit IDs
        if (!receiver) {
            return res.status(404).json({ message: "User with this ID not found." });
        }

        // Add userId to sender's allowedUsers list
        if (!sender.allowedUsers.includes(userId)) {
            sender.allowedUsers.push(userId);
            await sender.save();
        }

        // Add sender's userId (6-digit) to receiver's allowedUsers list
        if (!receiver.allowedUsers.includes(sender.userId)) {
            receiver.allowedUsers.push(sender.userId);
            await receiver.save();
        }

        res.redirect("/chat");
    } catch (error) {
        console.error("Error in /chat/addUser:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

router.get("/conversation", async (req, res) => {
    try {
        const { senderId, receiverId } = req.query;

        if (!senderId || !receiverId) {
            return res.status(400).json({ message: "Sender and Receiver IDs are required" });
        }

        const sender = await User.findById(senderId);
        const receiver = await User.findById(receiverId);

        if (!sender || !receiver) {
            return res.status(404).json({ message: "Sender or Receiver not found" });
        }

        // Check if sender is allowed to chat with receiver
        if (!sender.allowedUsers.includes(receiver.userId)) {
            return res.status(403).json({ message: "You are not allowed to chat with this user" });
        }

        // Fetch messages
        const messages = await ChatMessage.find({
            $or: [
                { sender: sender._id, receiver: receiver._id },
                { sender: receiver._id, receiver: sender._id }
            ]
        }).sort({ timestamp: 1 });

        res.json(messages);
    } catch (error) {
        console.error("Error fetching conversation:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


module.exports = router;