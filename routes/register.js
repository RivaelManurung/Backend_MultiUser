const express = require("express");
const { register, validateRegister } = require("../controllers/registerController");

const router = express.Router();

router.post("/", validateRegister, register);

module.exports = router;