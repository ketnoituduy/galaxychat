var express = require('express');
var router = express.Router();
router.get('https://galaxychat.herokuapp.com/',(req,res) =>{
    res.render('login');
})
module.exports = router;