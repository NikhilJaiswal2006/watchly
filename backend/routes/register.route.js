const express = require('express')
const registerroute = require('../controller/register.controller')
const router = express.Router()

router.post('/register',registerroute)

module.exports=router