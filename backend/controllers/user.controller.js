//Models
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";

//Packages
import bcryptjs from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";

export const getUserProfile = async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username }).select("-password");
    if (!user)
      return res.status(404).json({ message: "Usuario no encontrado." });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const followUnfollowUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userToModify = await User.findById(id);
    const currentUser = await User.findById(req.user._id);

    if (id === req.user._id.toString()) {
      return res.status(400).json({ error: "No puedes seguirte a ti mismo." });
    }

    if (!userToModify || !currentUser) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    const isFollowing = currentUser.following.includes(id);

    if (isFollowing) {
      await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });
      res.status(200).json({ message: "Dejaste de seguir a este usuario." });
    } else {
      //Follow the suer
      await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });
      //Mandar notificación

      const newNotification = new Notification({
        type: "follow",
        from: req.user._id,
        to: userToModify._id,
      });

      await newNotification.save();

      //TODO devolver el id del usuario como response
      res.status(200).json({ message: "Ahora sigues a este usuario." });
      //Mandar notificaci´øn
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUser = async (req, res) => {
  const { fullName, email, username, currentPassword, newPassword, bio, link } =
    req.body;
  let { profileImg, coverImg } = req.body;

  const userId = req.user._id;

  try {
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    if (
      (!newPassword && currentPassword) ||
      (newPassword && !currentPassword)
    ) {
      return res.status(400).json({
        error: "Debes ingresar tu contraseña actual y la nueva contraseña.",
      });
    }

    if (currentPassword && newPassword) {
      const isMatch = await bcryptjs.compare(currentPassword, user.password);
      if (!isMatch)
        return res
          .status(400)
          .json({ error: "Debes ingresar tu contraseña actual." });
      if (newPassword.length < 6) {
        return res.status(400).json({
          error: "La nueva contraseña debe tener al menos 6 caracteres.",
        });
      }

      const salt = await bcryptjs.genSalt(10);
      user.password = await bcryptjs.hash(newPassword, salt);
    }

    if (profileImg) {
      if (user.profileImg) {
        await cloudinary.uploader.destroy(
          user.profileImg.split("/").pop().split(".")[0]
        );
      }
      const uploadedResponse = await cloudinary.uploader.upload(profileImg);
      profileImg = uploadedResponse.secure_url;
    }
    if (coverImg) {
      if (user.coverImg) {
        await cloudinary.uploader.destroy(
          user.coverImg.split("/").pop().split(".")[0]
        );
      }
      const uploadedResponse = await cloudinary.uploader.upload(coverImg);
      coverImg = uploadedResponse.secure_url;
    }

    user.fullName = fullName || user.fullName;
    user.email = email || user.email;
    user.username = username || user.username;
    user.bio = bio || user.bio;
    user.profileImg = profileImg || user.profileImg;
    user.coverImg = coverImg || user.coverImg;
    user.link = link || user.link;

    user = await user.save();

    user.password = null;
    res.status(200).json(user);
  } catch (error) {
    console.log("Error en updateUser", error);
    res.status(500).json({ error: error.message });
  }
};

export const getSuggestedUsers = async (req, res) => {
  try {
    const userID = req.user._id;
    const userFollowedByMe = await User.findById(userID).select("following");

    const users = await User.aggregate([
      {
        $match: {
          _id: { $ne: userID },
        },
      },
      { $sample: { size: 10 } },
    ]);
    const filteredUsers = users.filter(
      (user) => !userFollowedByMe.following.includes(user._id)
    );
    const suggestedUsers = filteredUsers.slice(0, 4);
    res.status(200).json(suggestedUsers);
    suggestedUsers.forEach((user) => (user.password = null));
  } catch (error) {
    console.log("Error obteniendo getSuggesteUsers", error);
    res.status(500).json({ error: error.message });
  }
};
