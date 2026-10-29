const express =require('express')
const loginroute = require('../controller/login.controller')
const router = express.Router()

router.post('/login',loginroute)

module.exports= router
