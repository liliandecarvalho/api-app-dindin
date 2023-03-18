const bcrypt = require('bcrypt')
const poll = require('../connection')
const jwt = require('jsonwebtoken')
const passwordJwt = require('../passwordJwt')

const registerUser = async (req, res) => {

    const { name, email, password } = req.body

    if ((!name) || (!email) || (!password)) {

        return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios!' })
    }

    try {

        const emailExists = await poll.query('select * from users where email = $1', [email])

        if (emailExists.rowCount > 0) {

            return res.status(400).json({ mensagem: 'Já existe usuário cadastrado com o e-mail informado.' })
        }

        const encryptedPassword = await bcrypt.hash(password, 10)

        const query = `insert into users (name, email, password) values ($1, $2, $3) returning *`

        const { rows } = await poll.query(query, [name, email, encryptedPassword])

        const { password: _, ...user } = rows[0]

        return res.status(201).json(user)

    } catch (error) {

        return res.status(500).json({ mensagem: 'Erro interno do servidor' })
    }
}


const login = async (req, res) => {

    const { email, password } = req.body

    if ((!email) || (!password)) {

        return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios!' })
    }

    try {

        const { rows, rowCount } = await poll.query('select * from users where email = $1', [email])

        if (rowCount === 0) {

            return res.status(400).json({ mensagem: 'Email ou senha inválidos.' })
        }

        const { password: userPassword, ...user } = rows[0]

        const correctPassword = await bcrypt.compare(password, userPassword)

        if (!correctPassword) {

            return res.status(400).json({ mensagem: 'Email ou senha inválidos.' })
        }

        const token = jwt.sign({ id: user.id }, passwordJwt, { expiresIn: '8h' })

        return res.json({
            user,
            token,
        })

    } catch (error) {

        return res.status(500).json({ mensagem: 'Erro interno do servidor' })
    }
}


const detailUser = async (req, res) => {

    const { user } = req

    if (!user) {

        return res.status(401).json({ mensagem: 'Para acessar este recurso um token de autenticação válido deve ser enviado.' })
    }

    try {

        return res.status(200).json(user)

    } catch (error) {

        return res.status(401).json({ mensagem: 'Para acessar este recurso um token de autenticação válido deve ser enviado.' })
    }
}

const updateUser = async (req, res) => {
    const { name, email, password } = req.body
    const { user } = req

    if ((!name) || (!email) || (!password)) {

        return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios!' })
    }

    try {

        const emailExists = await poll.query('select * from users where email = $1 and id != $2', [email, user.id])

        if (emailExists.rowCount > 0) {

            return res.status(400).json({ mensagem: 'Já existe usuário cadastrado com o e-mail informado.' })
        }

        const encryptedPassword = await bcrypt.hash(password, 10)

        const updateQuery = `update users set name = $1, email = $2, password = $3 where id = $4 returning *`

        const { rowCount: updateRows } = await poll.query(updateQuery, [name, email, encryptedPassword, user.id])

        if (updateRows <= 0) {

            return res.status(500).json("Ocorreu um problema ao atualizar usuário.");
        }

        return res.status(204).json()

    } catch (error) {

        return res.status(500).json(error)
    }
}

module.exports = {
    registerUser,
    login,
    detailUser,
    updateUser
}