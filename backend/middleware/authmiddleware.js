const JWT = require('jsonwebtoken');

module.exports = async (req, res, next) =>{
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).send({
        message: "Auth Failed",
        success: false
      });
    }
   try { 
    JWT.verify(token, process.env.JWT_SECRET, (err, decode) => {
        if (err) {
            return res.status(401).send({
                message:"Auth Failed",
                success:false
            })
        }else{
            req.body.userId = decode.userId;
            req.body.isAdmin = decode.isAdmin;
            next();
        }
    })
   } catch (error) {
    console.log(error);
   }
}
