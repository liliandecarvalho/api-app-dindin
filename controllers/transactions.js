const pool = require("../connection")
const { getCategories } = require("./categories")

const listTransactions = async (req, res) => {

    try {
        const client = await pool.connect()

        const { rows: transactions } = await client.query(`select * from transactions where user_id = $1`, [req.user.id])

        client.release()

        if (transactions.rowCount === 0) {

            return res.status(404).json({ mensagem: 'Você ainda não cadastrou nenhuma transação.' })
        }

        const categories = await getCategories()

        const categoryMap = categories.reduce((map, category) => {

            map[category.id] = category.description
            return map
        }, {})

        const transactionsWithCategoryNames = transactions.map(transaction => {

            const category_name = categoryMap[transaction.category_id]
            return { ...transaction, category_name }
        })

        return res.status(200).json(transactionsWithCategoryNames)

    } catch (error) {

        return res.status(500).json({ mensagem: 'Erro interno do servidor' })
    }
}

const detailTransaction = async (req, res) => {

    const { id } = req.params

    try {

        const client = await pool.connect()

        const { rows, rowCount } = await client.query(`select * from transactions where id = $1 and user_id = $2`, [id, req.user.id])

        client.release()

        if (rowCount === 0) {

            return res.status(404).json({ mensagem: 'Transação não encontrada.' })
        }

        const transaction = rows[0]

        const categories = await getCategories()

        const categoryMap = categories.reduce((map, category) => {
            map[category.id] = category.description
            return map
        }, {})

        const category_name = categoryMap[transaction.categoria_id]

        const transactionWithCategoryName = { ...transaction, category_name }

        return res.status(200).json(transactionWithCategoryName)

    } catch (error) {

        return res.status(500).json({ mensagem: 'Erro interno do servidor' })
    }
}


const registerTransaction = async (req, res) => {

    const { description, value, date, category_id, type } = req.body

    if ((!description) || (!value) || (!date) || (!category_id) || (!type)) {

        return res.status(400).json({ mensagem: 'Todos os campos obrigatórios devem ser informados.' })
    }

    const categories = await getCategories()

    const isValidCategory = categories.some(category => category.id === category_id)

    if (!isValidCategory) {

        return res.status(400).json({ mensagem: 'A categoria informada não é válida' })
    }


    if (type !== 'entrada' && type !== 'saida') {

        return res.status(400).json({ mensagem: 'Somente são aceitos tipo "entrada" ou "saida".' })
    }

    try {

        const query = `insert into transactions (description, value, date, category_id, user_id, type) values ($1, $2, $3, $4, $5, $6) returning *`

        const params = [description, value, date, category_id, req.user.id, type]

        const { rows } = await pool.query(query, params)

        const category = categories.find((category) => category.id === category_id);

        const transaction = {
            ...rows[0],
            category_name: category.description,
        };

        return res.status(201).json(transaction);


    } catch (error) {

        return res.status(500).json({ mensagem: 'Erro interno do servidor' })
    }
}


const updateTransaction = async (req, res) => {
    const { id } = req.params
    const { description, value, date, category_id, type } = req.body

    try {

        const client = await pool.connect()

        const { rowCount } = await client.query(`select * from transactions where id = $1 and user_id = $2`, [id, req.user.id])

        if (rowCount === 0) {
            client.release()
            return res.status(404).json({ mensagem: 'A transação não foi encontrada.' })
        }

        if (!description || !value || !date || !category_id || !type) {
            client.release()
            return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios.' })
        }

        const categories = await getCategories()
        const isValidCategory = categories.some(category => category.id === category_id)

        if (!isValidCategory) {
            client.release()
            return res.status(400).json({ mensagem: 'A categoria informada não é válida' })
        }

        if (type !== 'entrada' && type !== 'saida') {
            client.release()
            return res.status(400).json({ mensagem: 'Somente são aceitos tipo "entrada" ou "saida".' })
        }

        const updateQuery = `update transactions set description = $1, value = $2, date = $3, category_id = $4, type = $5 where id = $6 and user_id = $7`
        const updateParams = [description, value, date, category_id, type, id, req.user.id]
        await client.query(updateQuery, updateParams)

        client.release()

        return res.status(204).send()

    } catch (error) {

        return res.status(500).json({ mensagem: 'Erro interno do servidor' })
    }
}


const deleteTransaction = async (req, res) => {
    const { id } = req.params

    try {

        const client = await pool.connect()

        const { rowCount } = await client.query(`delete from transactions where id = $1 and user_id = $2`, [id, req.user.id])

        client.release()

        if (rowCount === 0) {

            return res.status(404).json({ mensagem: 'Transação não encontrada.' })
        }

        return res.status(204).send()

    } catch (error) {

        return res.status(500).json({ mensagem: 'Erro interno do servidor' })
    }
}

const getExtract = async (req, res) => {
    try {
        const { id } = req.user;

        const totalEntries = await pool.query(
            `select sum(value) from transactions where user_id = $1 and type = 'entrada'`,
            [id]
        )

        const totalExits = await pool.query(
            `select sum(value) from transactions where user_id = $1 and type = 'saida'`,
            [id]
        )

        const result = {
            entradas: totalEntries.rows[0].sum,
            saida: totalExits.rows[0].sum
        }


        return res.status(200).json(result);

    } catch (error) {

        return res.status(500).json({ mensagem: 'Erro interno do servidor' })
    }
}


module.exports = {
    listTransactions,
    detailTransaction,
    registerTransaction,
    updateTransaction,
    deleteTransaction,
    getExtract
}
