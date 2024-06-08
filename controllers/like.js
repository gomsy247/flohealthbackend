import { db } from "../connect.js";
import jwt from "jsonwebtoken";

export const getLikes = (req,res)=>{
    const q = "SELECT userId FROM videolikes WHERE videoId = ?";

    db.query(q, [req.query.videoId], (err, data) => {
      if (err) return res.status(500).json(err);
      return res.status(200).json(data.map(like=>like.userId));
    });
}

export const addLike = (req, res) => {
  //const token = req.cookies.accessToken;
  console.log("Ogbonge Authorization", req.headers)
  const token = req.headers.authorization.split(' ')[1];
  console.log("Ogbonge Token", token)
  if (!token) return res.status(401).json("Not logged in!");

  jwt.verify(token, "secretkey", (err, userInfo) => {
    console.log("Ogbonge USERINFO", userInfo)
    if (err) return res.status(403).json("Token is not valid!");

    const q = "INSERT INTO videolikes (`userId`,`videoId`) VALUES (?)";
    const values = [
      userInfo.id,
      req.body.videoIdUrl
    ];

    db.query(q, [values], (err, data) => {
      if (err) return res.status(500).json(err);
      return res.status(200).json("Video has been liked.");
    });
  });
};

export const checkLike = (req, res) => {
  // const token = req.cookies.accessToken;
  console.log("Ogbonge Authorization", req.headers);
  const token = req.headers.authorization.split(' ')[1];
  console.log("Ogbonge Token", token);
  if (!token) return res.status(401).json("Not logged in!");

  jwt.verify(token, "secretkey", (err, userInfo) => {
    console.log("Ogbonge USERINFO", userInfo);
    if (err) return res.status(403).json("Token is not valid!");

    const q = "SELECT * FROM videolikes WHERE userId = ? AND videoId = ?";
    const values = [
      userInfo.id,
      req.body.videoIdUrl
    ];

    db.query(q, values, (err, data) => {

      if (err) return res.status(500).json(err);

      const isLiked = data.length > 0; // Check if any rows were returned
      console.log("CURRENT LIKE STATUS", data.length, userInfo.id, req.body.videoIdUrl, isLiked);
      if(isLiked) {
        return res.status(200).json({ status: true, message: "Video has already been liked." });
      } else {
        return res.status(400).json({ status: false, message: "Your Video liked successfully." });
      }
    });
  });
};


export const deleteLike = (req, res) => {

  //const token = req.cookies.accessToken;
  const token = req.headers.authorization.split(' ')[1];
  if (!token) return res.status(401).json("Not logged in!");

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json("Token is not valid!");

    const q = "DELETE FROM videolikes WHERE `userId` = ? AND `videoId` = ?";

    db.query(q, [userInfo.id, req.body.videoIdUrl], (err, data) => {
      if (err) return res.status(500).json(err);
      return res.status(200).json("Video has been disliked.");
    });
  });
};
