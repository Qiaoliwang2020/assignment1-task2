const express = require('express')
const moment = require('moment')

const app = express()

// for hosting static files (html)
app.use(express.static('public'))

const log = (message)=>{
    let time = moment().format()
    console.log(`[Server]@ ${time} ${message}`)
}



// liston to the port 3000
app.listen(3000,function () {
    console.log('web server running at: http://localhost:3000')
})