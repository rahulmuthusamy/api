class BaseService {
    constructor(model) {
        this.model = model;
    }

    async getAll(options = {}) {
        try {
            return await this.model.findAll(options);
        } catch (error) {
            throw error;
        }
    }

    async getById(id, options = {}) {
        try {
            return await this.model.findByPk(id, options);
        } catch (error) {
            throw error;
        }
    }

    async create(data) {
        try {
            return await this.model.create(data);
        } catch (error) {
            throw error;
        }
    }

    async update(id, data) {
        try {
            const record = await this.model.findByPk(id);
            if (!record) return null;
            return await record.update(data);
        } catch (error) {
            throw error;
        }
    }

    async findOne(options) {
        try {
            return await this.model.findOne(options);
        } catch (error) {
            throw error;
        }
    }

    async delete(id) {
        try {
            // Using destroy with where clause to catch generic primary key usage if possible,
            // or we can rely on findByPk then destroy.
            // destroy({ where: { pk: id } }) is more efficient than find then destroy.
            // But we need the primary key name.
            const primaryKey = this.model.primaryKeyAttribute || 'id';
            const where = {};
            where[primaryKey] = id;

            return await this.model.destroy({ where });
        } catch (error) {
            throw error;
        }
    }
}

module.exports = BaseService;
