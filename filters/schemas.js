const Joi = require('@hapi/joi');
const schemas = {
	addUserPOST: Joi.object({
		name: Joi.string()
			.min(2)
			.max(100)
			.required()
			.messages({
				'string.min': 'Nama harus lebih dari 2 karakter',
				'string.max': 'Nama lebih dari 100 karakter',
				'string.empty': 'Nama harus diisi',
				'any.required': 'Nama harus diisi',
			}),
		email: Joi.string()
			.email()
			.required()
			.messages({
				'string.email': 'Alamat email tidak sesuai format',
				'string.required': 'Email harus diisi',
			}),
	}),

	// define all the other schemas below
};
module.exports = schemas;
