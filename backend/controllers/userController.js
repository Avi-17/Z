import Notification from "../models/notificationModel.js";
import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import {v2 as cloudinary} from "cloudinary";

export const getUserProfile = async (req, res) => {
  const { username } = req.params;
  try {
    const user = await User.findOne({ username }).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const followUnfollowUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userToFollowUnfollow = await User.findById(id);
    const currentUser = await User.findById(req.user._id);

    if (id === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot follow or unfollow yourself." });
    }

    if (!currentUser || !userToFollowUnfollow) {
      return res.status(404).json({ error: "User not found" });
    }

    const isFollowing = currentUser.following.includes(id);
    if (isFollowing) {
      //unfollow the user
      await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });
      res.status(200).json({ message: "User unfollowed successfully." });
    } else {
      //follow the user
      await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });

      const newNotification = new Notification({
        type: "follow",
        from: req.user._id,
        to: id
      })

      await newNotification.save();

      res.status(200).json({ message: "User followed successfully" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({error: "Internal Server Error."})
  }
};

export const getSuggestedUsers = async(req, res) => {
    try {
        const userId = req.user._id;
        const usersFollowedByMe = await User.findById(userId).select("following");

        const users = await User.aggregate([
            {
                $match: {
                    _id: {$ne: userId}
                }
            },
            {
                $sample: {
                    size: 10
                }
            }
        ])

        const filteredUsers = users.filter(user => !usersFollowedByMe.following.includes(user._id));
        const suggestedUsers = filteredUsers.slice(0, 4);

        suggestedUsers.forEach(user => user.password = null)

        res.status(200).json(suggestedUsers);

    } catch (error) {
        console.error(error);
        return res.status(500).json({error: "Internal Server Error."})
    }
}

export const updateUser = async(req, res) => {
    const {fullName, email, username, currentPassword, newPassword, link, bio} = req.body;
    let { profileImg, coverImg } = req.body;

    const userId = req.user._id;
    try {
        let user = await User.findById(userId);
        if(!user){
            return res.status(404).json({error: "User not found"})
        }

        if((!newPassword && currentPassword) || (!currentPassword && newPassword)){
            return res.status(400).json({error: "Both current and new passwords must be provided"})
        }

        if(currentPassword && newPassword){
            if(newPassword.length < 6 ) {
                return res.status(400).json({error: "Password must be at least 6 characters long"})
            }
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if(isMatch){
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(newPassword, salt)
            }else{
                return res.status(400).json({error: "Invalid current password"})
            }
        }

        if(profileImg){
          if(user.profileImg){
            // example: "https://res.cloudinary.com/dipvp2ux4/image/upload/v1732522054/q3qntserod0qubvgtbyc.png"
            await cloudinary.uploader.destroy(user.profileImg.split('/').pop().split('.')[0]);
          }
          const uploadResponse = await cloudinary.uploader.upload(profileImg)
          profileImg = uploadResponse.secure_url
        }

        if(coverImg){
          if(user.coverImg){
            await cloudinary.uploader.destroy(user.coverImg.split('/').pop().split(".")[0]);
          }
          const uploadResponse = await cloudinary.uploader.upload(coverImg)
          coverImg = uploadResponse.secure_url
        }

        user.fullName = fullName || user.fullName;
        user.email = email || user.email;
        user.bio = bio || user.bio;
        user.link = link || user.link;
        user.username = username || user.username;
        user.profileImg = profileImg || user.profileImg;
        user.coverImg = coverImg || user.coverImg;

        user = await user.save();

        user.password = null;

        return res.status(200).json(user);


    } catch (error) {
        console.error(error);
        return res.status(500).json({error: "Internal Server Error"})
    }
}