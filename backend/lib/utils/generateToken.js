import jwt from "jsonwebtoken";

export const generateTokenAndSetCookie = (userID, res) => {
  const token = jwt.sign({ userID }, process.env.JWT_SECRET, {
    expiresIn: "15d",
  });

  res.cookie("jwt", token, {
    maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
    httpOnly: true, // Previene ataques XSS
    sameSite: "strict", // Previene ataques CSRF
    secure: process.env.NODE_ENV !== "development", // Solo se envía en producción
  });
};
