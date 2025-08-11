const express = require("express");
const { searchPostController } = require("../controllers/search-controller");
const { authUserReq } = require("../middleware/authUser");

const router = express.Router();

router.use(authUserReq);

router.get("/posts", searchPostController);

module.exports = router;
