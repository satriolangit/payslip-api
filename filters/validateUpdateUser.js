const Joi = require("@hapi/joi");

const filter = (req, res, next) => {
  const schema = Joi.object({
    userId: Joi.string().required().messages({
      "any.required": "UserId required",
      "string.empty": "UserId required",
    }),
    name: Joi.string().min(2).max(100).required().messages({
      "string.min": "Nama harus lebih dari 2 karakter",
      "string.max": "Nama lebih dari 100 karakter",
      "string.empty": "Nama harus diisi",
      "any.required": "Nama harus diisi",
    }),
    email: Joi.string().email().required().messages({
      "string.email": "Alamat email tidak sesuai format",
      "string.required": "Email harus diisi",
    }),
    employeeId: Joi.string()
      .required()
      .pattern(/^[0-9]+$/)
      .messages({
        "string.empty": "N.I.K harus diisi",
        "any.required": "N.I.K harus diisi",
        "string.pattern.base": "N.I.K harus diisi dengan angka",
      }),
    phone: Joi.string()
      .required()
      .messages({
        "any.required": "No. telepon harus diisi",
        "string.empty": "No. telepon harus diisi",
      }),
    role: Joi.string(),
    isActive: Joi.number(),
    photo: Joi.string().allow("").optional(),
    siteName: Joi.string(),
    departmentId: Joi.number(),
  });

  try {
    const request = JSON.parse(req.body.data);
    const { error } = schema.validate(request);

    if (error) {
      console.log("request not valid :", error);
      res.json({ result: "FAIL", message: error.details[0].message });
    } else {
      next();
    }
  } catch (err) {
    res.status(401).json({
      message: "Request not valid",
      data: req.body,
      errors: null,
    });
  }
};

module.exports = filter;
