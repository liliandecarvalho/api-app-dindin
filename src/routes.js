const express = require('express')
const { listCategories } = require('./controllers/categories')
const { listTransactions, detailTransaction, registerTransaction, updateTransaction, deleteTransaction, getExtract } = require('./controllers/transactions')
const { registerUser, login, detailUser, updateUser } = require('./controllers/users')
const verifyLogin = require('./intermediaries/verifyLogin')

const routes = express()

routes.post('/user', registerUser)
routes.post('/login', login)

routes.use(verifyLogin)

routes.get('/user', detailUser)
routes.put('/user', updateUser)
routes.get('/category', listCategories)
routes.get('/transaction', listTransactions)
routes.get('/transaction/extract', getExtract)
routes.get('/transaction/:id', detailTransaction)
routes.post('/transaction', registerTransaction)
routes.put('/transaction/:id', updateTransaction)
routes.delete('/transaction/:id', deleteTransaction)



module.exports = routes