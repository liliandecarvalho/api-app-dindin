const pool = require("../connection")

const listCategories = async (req, res) => {
    try {

        const categories = await getCategories()

        return res.status(200).json(categories)

    } catch (error) {

        return res.status(500).json({ mensagem: 'Erro interno do servidor' })
    }
}

async function getCategories() {
    try {

        const { rows: categories } = await pool.query(`select * from categories`)

        return categories

    } catch (error) {

        return []
    }
}

module.exports = {
    listCategories,
    getCategories
}