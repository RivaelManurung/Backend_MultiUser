const express = require("express");
const { login, validateLogin } = require("../controllers/authController");

const router = express.Router();

router.post("/login", validateLogin, login);

module.exports = router;